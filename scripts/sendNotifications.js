const NotificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Send deadline reminder notifications
 */
const sendDeadlineReminders = async () => {
  try {
    logger.info('Starting deadline reminder notifications...');
    
    const notificationService = new NotificationService();
    
    // Send reminders for different time periods
    const reminderPeriods = [7, 3, 1]; // 7 days, 3 days, 1 day before deadline
    
    for (const days of reminderPeriods) {
      await notificationService.sendDeadlineReminders(days);
    }
    
    logger.info('Deadline reminder notifications sent successfully');
    console.log('✅ Deadline reminder notifications sent successfully!');
    
  } catch (error) {
    logger.error('Failed to send deadline reminders', { error: error.message });
    console.error('❌ Failed to send deadline reminders:', error.message);
    process.exit(1);
  }
};

/**
 * Send weekly digest notifications
 */
const sendWeeklyDigest = async () => {
  try {
    logger.info('Starting weekly digest notifications...');
    
    const notificationService = new NotificationService();
    await notificationService.sendWeeklyDigest();
    
    logger.info('Weekly digest notifications sent successfully');
    console.log('✅ Weekly digest notifications sent successfully!');
    
  } catch (error) {
    logger.error('Failed to send weekly digest', { error: error.message });
    console.error('❌ Failed to send weekly digest:', error.message);
    process.exit(1);
  }
};

/**
 * Main notification function
 */
const sendNotifications = async () => {
  const args = process.argv.slice(2);
  const notificationType = args[0] || 'all';
  
  try {
    switch (notificationType) {
      case 'deadlines':
        await sendDeadlineReminders();
        break;
      case 'digest':
        await sendWeeklyDigest();
        break;
      case 'all':
        await sendDeadlineReminders();
        await sendWeeklyDigest();
        break;
      default:
        console.log('Usage: node sendNotifications.js [deadlines|digest|all]');
        process.exit(1);
    }
    
  } catch (error) {
    logger.error('Notification sending failed', { error: error.message });
    console.error('❌ Notification sending failed:', error.message);
    process.exit(1);
  }
};

// Run notifications if this file is executed directly
if (require.main === module) {
  sendNotifications();
}

module.exports = { sendNotifications, sendDeadlineReminders, sendWeeklyDigest };