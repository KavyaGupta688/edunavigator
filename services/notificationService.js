const nodemailer = require('nodemailer');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Opportunity = require('../models/Opportunity');
const UpdateLog = require('../models/UpdateLog');

class NotificationService {
  constructor() {
    this.emailTransporter = this.createEmailTransporter();
  }

  /**
   * Create email transporter
   * @returns {Object} Nodemailer transporter
   */
  createEmailTransporter() {
    return nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  /**
   * Send email notification
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - Email HTML content
   * @param {string} text - Email text content
   */
  async sendEmail(to, subject, html, text) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
        text
      };

      await this.emailTransporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send push notification
   * @param {string} userId - User ID
   * @param {Object} notification - Notification data
   */
  async sendPushNotification(userId, notification) {
    try {
      // In a real implementation, you would integrate with FCM or similar service
      console.log(`Push notification sent to user ${userId}:`, notification);
      
      // Mock implementation - in production, use FCM or similar
      return { success: true, messageId: `msg_${Date.now()}` };
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Send deadline reminder notifications
   * @param {number} daysBefore - Days before deadline to send reminder
   */
  async sendDeadlineReminders(daysBefore = 7) {
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysBefore);

      // Find exams with deadlines in the target date range
      const upcomingExams = await Exam.find({
        is_active: true,
        'events.date': {
          $gte: new Date(targetDate.getTime() - 24 * 60 * 60 * 1000), // 1 day before
          $lte: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)  // 1 day after
        }
      });

      // Find opportunities with deadlines in the target date range
      const upcomingOpportunities = await Opportunity.find({
        is_active: true,
        deadline: {
          $gte: new Date(targetDate.getTime() - 24 * 60 * 60 * 1000),
          $lte: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      // Get users who have saved these items
      const examUsers = await User.find({
        saved_exams: { $in: upcomingExams.map(exam => exam._id) },
        notifications_enabled: true
      });

      const opportunityUsers = await User.find({
        $or: [
          { saved_hackathons: { $in: upcomingOpportunities.map(opp => opp._id) } },
          { saved_internships: { $in: upcomingOpportunities.map(opp => opp._id) } }
        ],
        notifications_enabled: true
      });

      // Send notifications for exams
      for (const exam of upcomingExams) {
        const users = examUsers.filter(user => user.saved_exams.includes(exam._id));
        
        for (const user of users) {
          await this.sendDeadlineReminder(user, exam, 'exam');
        }
      }

      // Send notifications for opportunities
      for (const opportunity of upcomingOpportunities) {
        const users = opportunityUsers.filter(user => 
          user.saved_hackathons.includes(opportunity._id) || 
          user.saved_internships.includes(opportunity._id)
        );
        
        for (const user of users) {
          await this.sendDeadlineReminder(user, opportunity, 'opportunity');
        }
      }

      console.log(`Deadline reminders sent for ${daysBefore} days ahead`);
    } catch (error) {
      console.error('Error sending deadline reminders:', error);
      throw error;
    }
  }

  /**
   * Send deadline reminder to user
   * @param {Object} user - User object
   * @param {Object} item - Exam or Opportunity object
   * @param {string} type - 'exam' or 'opportunity'
   */
  async sendDeadlineReminder(user, item, type) {
    try {
      const deadline = type === 'exam' 
        ? item.events.find(event => event.event.toLowerCase().includes('registration') && event.event.toLowerCase().includes('end'))?.date
        : item.deadline;

      if (!deadline) return;

      const daysUntilDeadline = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
      
      const subject = `${type === 'exam' ? 'Exam' : 'Opportunity'} Deadline Reminder - ${item.exam_name || item.title}`;
      
      const html = this.generateDeadlineReminderHTML(user, item, type, daysUntilDeadline);
      const text = this.generateDeadlineReminderText(user, item, type, daysUntilDeadline);

      // Send email
      if (user.notifications_enabled) {
        await this.sendEmail(user.email, subject, html, text);
      }

      // Send push notification
      await this.sendPushNotification(user._id, {
        title: subject,
        body: `${daysUntilDeadline} days left until deadline`,
        data: {
          type: 'deadline_reminder',
          item_id: item._id,
          item_type: type
        }
      });

      // Log the notification
      await this.logNotification(user._id, 'deadline_reminder', {
        item_id: item._id,
        item_type: type,
        days_until_deadline: daysUntilDeadline
      });

    } catch (error) {
      console.error(`Error sending deadline reminder to user ${user._id}:`, error);
    }
  }

  /**
   * Send new opportunity notifications
   * @param {Object} opportunity - New opportunity
   */
  async sendNewOpportunityNotifications(opportunity) {
    try {
      // Find users who might be interested in this opportunity
      const interestedUsers = await this.findInterestedUsers(opportunity);

      for (const user of interestedUsers) {
        if (user.notifications_enabled) {
          await this.sendNewOpportunityNotification(user, opportunity);
        }
      }

      console.log(`New opportunity notifications sent to ${interestedUsers.length} users`);
    } catch (error) {
      console.error('Error sending new opportunity notifications:', error);
      throw error;
    }
  }

  /**
   * Find users interested in an opportunity
   * @param {Object} opportunity - Opportunity object
   * @returns {Array} Array of interested users
   */
  async findInterestedUsers(opportunity) {
    const query = {
      notifications_enabled: true,
      is_active: true
    };

    // For hackathons, find users with matching interests
    if (opportunity.type === 'hackathon') {
      if (opportunity.domain && opportunity.domain.length > 0) {
        query['preferences.interests'] = { $in: opportunity.domain };
      }
      query.role = 'university';
    }

    // For internships, find users with matching degree and year
    if (opportunity.type === 'internship') {
      if (opportunity.degree_required && opportunity.degree_required.length > 0) {
        query['education.degree'] = { $in: opportunity.degree_required };
      }
      if (opportunity.year_of_study && opportunity.year_of_study.length > 0) {
        query['education.year'] = { $in: opportunity.year_of_study };
      }
      query.role = 'university';
    }

    return await User.find(query).limit(100); // Limit to prevent spam
  }

  /**
   * Send new opportunity notification to user
   * @param {Object} user - User object
   * @param {Object} opportunity - Opportunity object
   */
  async sendNewOpportunityNotification(user, opportunity) {
    try {
      const subject = `New ${opportunity.type === 'hackathon' ? 'Hackathon' : 'Internship'} Opportunity - ${opportunity.title}`;
      
      const html = this.generateNewOpportunityHTML(user, opportunity);
      const text = this.generateNewOpportunityText(user, opportunity);

      // Send email
      await this.sendEmail(user.email, subject, html, text);

      // Send push notification
      await this.sendPushNotification(user._id, {
        title: subject,
        body: `Check out this new ${opportunity.type} opportunity`,
        data: {
          type: 'new_opportunity',
          opportunity_id: opportunity._id
        }
      });

      // Log the notification
      await this.logNotification(user._id, 'new_opportunity', {
        opportunity_id: opportunity._id,
        opportunity_type: opportunity.type
      });

    } catch (error) {
      console.error(`Error sending new opportunity notification to user ${user._id}:`, error);
    }
  }

  /**
   * Send team update notifications
   * @param {string} teamId - Team ID
   * @param {string} updateType - Type of update
   * @param {Object} updateData - Update data
   */
  async sendTeamUpdateNotifications(teamId, updateType, updateData) {
    try {
      const TeamMember = require('../models/TeamMember');
      const teamMembers = await TeamMember.getTeamMembers(teamId);

      for (const member of teamMembers) {
        if (member.user_id.notifications_enabled) {
          await this.sendTeamUpdateNotification(member.user_id, teamId, updateType, updateData);
        }
      }

      console.log(`Team update notifications sent to ${teamMembers.length} members`);
    } catch (error) {
      console.error('Error sending team update notifications:', error);
      throw error;
    }
  }

  /**
   * Send team update notification to user
   * @param {Object} user - User object
   * @param {string} teamId - Team ID
   * @param {string} updateType - Type of update
   * @param {Object} updateData - Update data
   */
  async sendTeamUpdateNotification(user, teamId, updateType, updateData) {
    try {
      const subject = `Team Update - ${updateData.teamName || 'Your Team'}`;
      
      const html = this.generateTeamUpdateHTML(user, updateType, updateData);
      const text = this.generateTeamUpdateText(user, updateType, updateData);

      // Send email
      await this.sendEmail(user.email, subject, html, text);

      // Send push notification
      await this.sendPushNotification(user._id, {
        title: subject,
        body: this.getTeamUpdateMessage(updateType, updateData),
        data: {
          type: 'team_update',
          team_id: teamId,
          update_type: updateType
        }
      });

      // Log the notification
      await this.logNotification(user._id, 'team_update', {
        team_id: teamId,
        update_type: updateType
      });

    } catch (error) {
      console.error(`Error sending team update notification to user ${user._id}:`, error);
    }
  }

  /**
   * Send weekly digest
   */
  async sendWeeklyDigest() {
    try {
      const users = await User.find({
        notifications_enabled: true,
        is_active: true
      });

      for (const user of users) {
        await this.sendUserWeeklyDigest(user);
      }

      console.log(`Weekly digest sent to ${users.length} users`);
    } catch (error) {
      console.error('Error sending weekly digest:', error);
      throw error;
    }
  }

  /**
   * Send weekly digest to user
   * @param {Object} user - User object
   */
  async sendUserWeeklyDigest(user) {
    try {
      // Get user's weekly activity and recommendations
      const weeklyData = await this.getUserWeeklyData(user);

      const subject = `Your Weekly EduNavigator Digest - ${user.name}`;
      
      const html = this.generateWeeklyDigestHTML(user, weeklyData);
      const text = this.generateWeeklyDigestText(user, weeklyData);

      // Send email
      await this.sendEmail(user.email, subject, html, text);

      // Log the notification
      await this.logNotification(user._id, 'weekly_digest', {
        week_start: weeklyData.weekStart,
        week_end: weeklyData.weekEnd
      });

    } catch (error) {
      console.error(`Error sending weekly digest to user ${user._id}:`, error);
    }
  }

  /**
   * Get user's weekly data
   * @param {Object} user - User object
   * @returns {Object} Weekly data
   */
  async getUserWeeklyData(user) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekEnd = new Date();

    // Get new opportunities in the past week
    const newOpportunities = await Opportunity.find({
      created_at: { $gte: weekStart, $lte: weekEnd },
      is_active: true
    }).limit(10);

    // Get upcoming deadlines
    const upcomingDeadlines = [];
    if (user.saved_exams && user.saved_exams.length > 0) {
      const upcomingExams = await Exam.find({
        _id: { $in: user.saved_exams },
        'events.date': { $gt: new Date(), $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
      }).limit(5);
      upcomingDeadlines.push(...upcomingExams);
    }

    return {
      weekStart,
      weekEnd,
      newOpportunities,
      upcomingDeadlines,
      userActivity: {
        savedItems: user.saved_exams.length + user.saved_hackathons.length + user.saved_internships.length
      }
    };
  }

  /**
   * Log notification
   * @param {string} userId - User ID
   * @param {string} type - Notification type
   * @param {Object} data - Notification data
   */
  async logNotification(userId, type, data) {
    try {
      // In a real implementation, you would save to a notifications collection
      console.log(`Notification logged: User ${userId}, Type: ${type}`, data);
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  // HTML and Text generation methods
  generateDeadlineReminderHTML(user, item, type, daysUntilDeadline) {
    const itemName = type === 'exam' ? item.exam_name : item.title;
    const deadline = type === 'exam' 
      ? item.events.find(event => event.event.toLowerCase().includes('registration') && event.event.toLowerCase().includes('end'))?.date
      : item.deadline;

    return `
      <h2>Deadline Reminder</h2>
      <p>Hi ${user.name},</p>
      <p>This is a reminder that the ${type} <strong>${itemName}</strong> has a deadline in ${daysUntilDeadline} days.</p>
      <p><strong>Deadline:</strong> ${deadline.toLocaleDateString()}</p>
      <p>Don't miss out on this opportunity!</p>
      <p>Best regards,<br>EduNavigator Team</p>
    `;
  }

  generateDeadlineReminderText(user, item, type, daysUntilDeadline) {
    const itemName = type === 'exam' ? item.exam_name : item.title;
    const deadline = type === 'exam' 
      ? item.events.find(event => event.event.toLowerCase().includes('registration') && event.event.toLowerCase().includes('end'))?.date
      : item.deadline;

    return `
      Deadline Reminder
      
      Hi ${user.name},
      
      This is a reminder that the ${type} ${itemName} has a deadline in ${daysUntilDeadline} days.
      
      Deadline: ${deadline.toLocaleDateString()}
      
      Don't miss out on this opportunity!
      
      Best regards,
      EduNavigator Team
    `;
  }

  generateNewOpportunityHTML(user, opportunity) {
    return `
      <h2>New Opportunity Available</h2>
      <p>Hi ${user.name},</p>
      <p>A new ${opportunity.type} opportunity that matches your interests is now available:</p>
      <h3>${opportunity.title}</h3>
      <p><strong>Organizer/Company:</strong> ${opportunity.organizer || opportunity.company}</p>
      <p><strong>Deadline:</strong> ${opportunity.deadline.toLocaleDateString()}</p>
      <p><strong>Mode:</strong> ${opportunity.mode}</p>
      <p>Check it out and apply if you're interested!</p>
      <p>Best regards,<br>EduNavigator Team</p>
    `;
  }

  generateNewOpportunityText(user, opportunity) {
    return `
      New Opportunity Available
      
      Hi ${user.name},
      
      A new ${opportunity.type} opportunity that matches your interests is now available:
      
      ${opportunity.title}
      Organizer/Company: ${opportunity.organizer || opportunity.company}
      Deadline: ${opportunity.deadline.toLocaleDateString()}
      Mode: ${opportunity.mode}
      
      Check it out and apply if you're interested!
      
      Best regards,
      EduNavigator Team
    `;
  }

  generateTeamUpdateHTML(user, updateType, updateData) {
    return `
      <h2>Team Update</h2>
      <p>Hi ${user.name},</p>
      <p>There's been an update to your team:</p>
      <p>${this.getTeamUpdateMessage(updateType, updateData)}</p>
      <p>Best regards,<br>EduNavigator Team</p>
    `;
  }

  generateTeamUpdateText(user, updateType, updateData) {
    return `
      Team Update
      
      Hi ${user.name},
      
      There's been an update to your team:
      
      ${this.getTeamUpdateMessage(updateType, updateData)}
      
      Best regards,
      EduNavigator Team
    `;
  }

  generateWeeklyDigestHTML(user, weeklyData) {
    return `
      <h2>Your Weekly EduNavigator Digest</h2>
      <p>Hi ${user.name},</p>
      <p>Here's what happened this week:</p>
      
      <h3>New Opportunities (${weeklyData.newOpportunities.length})</h3>
      ${weeklyData.newOpportunities.map(opp => `<p>• ${opp.title} (${opp.type})</p>`).join('')}
      
      <h3>Upcoming Deadlines</h3>
      ${weeklyData.upcomingDeadlines.map(item => `<p>• ${item.exam_name || item.title}</p>`).join('')}
      
      <p>Keep exploring and don't miss out on great opportunities!</p>
      <p>Best regards,<br>EduNavigator Team</p>
    `;
  }

  generateWeeklyDigestText(user, weeklyData) {
    return `
      Your Weekly EduNavigator Digest
      
      Hi ${user.name},
      
      Here's what happened this week:
      
      New Opportunities (${weeklyData.newOpportunities.length}):
      ${weeklyData.newOpportunities.map(opp => `• ${opp.title} (${opp.type})`).join('\n')}
      
      Upcoming Deadlines:
      ${weeklyData.upcomingDeadlines.map(item => `• ${item.exam_name || item.title}`).join('\n')}
      
      Keep exploring and don't miss out on great opportunities!
      
      Best regards,
      EduNavigator Team
    `;
  }

  getTeamUpdateMessage(updateType, updateData) {
    switch (updateType) {
      case 'new_member':
        return `A new member has joined your team: ${updateData.memberName}`;
      case 'member_left':
        return `A member has left your team: ${updateData.memberName}`;
      case 'leadership_transfer':
        return `Team leadership has been transferred to ${updateData.newLeaderName}`;
      case 'team_disbanded':
        return 'Your team has been disbanded';
      default:
        return 'There has been an update to your team';
    }
  }
}

module.exports = NotificationService;