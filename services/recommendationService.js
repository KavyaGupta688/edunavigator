const User = require('../models/User');
const Exam = require('../models/Exam');
const Opportunity = require('../models/Opportunity');
const Recommendation = require('../models/Recommendation');

class RecommendationService {
  /**
   * Generate personalized recommendations for a user
   * @param {string} userId - User ID
   * @param {string} algorithm - Algorithm to use ('rule_based', 'content_based', 'collaborative_filtering', 'hybrid')
   * @returns {Array} Array of recommendations
   */
  static async generateRecommendations(userId, algorithm = 'rule_based') {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    let recommendations = [];

    switch (algorithm) {
      case 'rule_based':
        recommendations = await this.generateRuleBasedRecommendations(user);
        break;
      case 'content_based':
        recommendations = await this.generateContentBasedRecommendations(user);
        break;
      case 'collaborative_filtering':
        recommendations = await this.generateCollaborativeFilteringRecommendations(user);
        break;
      case 'hybrid':
        recommendations = await this.generateHybridRecommendations(user);
        break;
      default:
        throw new Error('Invalid algorithm specified');
    }

    // Save recommendations to database
    if (recommendations.length > 0) {
      await Recommendation.insertMany(recommendations);
    }

    return recommendations;
  }

  /**
   * Rule-based recommendation system
   * @param {Object} user - User object
   * @returns {Array} Recommendations
   */
  static async generateRuleBasedRecommendations(user) {
    const recommendations = [];

    if (user.role === 'school') {
      // Generate exam recommendations for school students
      const exams = await Exam.find({
        is_active: true,
        'events.date': { $gt: new Date() }
      }).limit(50);

      for (const exam of exams) {
        let score = 0.5; // Base score
        const reasons = [];

        // Score based on user's stream
        if (user.school_info && user.school_info.stream === 'Science') {
          const scienceSubjects = ['Physics', 'Chemistry', 'Maths', 'Biology'];
          const matchingSubjects = exam.subjects.filter(subject =>
            scienceSubjects.some(sci => subject.toLowerCase().includes(sci.toLowerCase()))
          );
          if (matchingSubjects.length > 0) {
            score += 0.3;
            reasons.push({ reason: 'Matches your Science stream', weight: 0.3 });
          }
        }

        // Score based on user's interests
        if (user.preferences.interests && user.preferences.interests.length > 0) {
          const matchingInterests = user.preferences.interests.filter(interest =>
            exam.exam_name.toLowerCase().includes(interest.toLowerCase()) ||
            exam.subjects.some(subject => subject.toLowerCase().includes(interest.toLowerCase()))
          );
          if (matchingInterests.length > 0) {
            score += (matchingInterests.length / user.preferences.interests.length) * 0.2;
            reasons.push({ reason: 'Aligns with your interests', weight: 0.2 });
          }
        }

        // Score based on exam popularity (application count)
        if (exam.application_count > 100) {
          score += 0.1;
          reasons.push({ reason: 'Popular among students', weight: 0.1 });
        }

        if (score > 0.6) {
          recommendations.push({
            user_id: user._id,
            entity_type: 'exam',
            entity_id: exam._id,
            entity_type_ref: 'Exam',
            score: Math.min(score, 1.0),
            algorithm_used: 'rule_based',
            recommendation_reasons: reasons
          });
        }
      }
    } else {
      // Generate opportunity recommendations for university students
      const opportunities = await Opportunity.find({
        is_active: true,
        deadline: { $gt: new Date() }
      }).limit(100);

      for (const opportunity of opportunities) {
        let score = 0.5; // Base score
        const reasons = [];

        // Score based on user's interests
        if (user.preferences.interests && user.preferences.interests.length > 0) {
          const matchingInterests = user.preferences.interests.filter(interest =>
            opportunity.title.toLowerCase().includes(interest.toLowerCase()) ||
            opportunity.skills_required.some(skill => skill.toLowerCase().includes(interest.toLowerCase())) ||
            (opportunity.domain && opportunity.domain.some(domain => domain.toLowerCase().includes(interest.toLowerCase())))
          );
          if (matchingInterests.length > 0) {
            score += (matchingInterests.length / user.preferences.interests.length) * 0.3;
            reasons.push({ reason: 'Matches your interests', weight: 0.3 });
          }
        }

        // Score based on user's degree and year (for internships)
        if (opportunity.type === 'internship') {
          if (opportunity.degree_required.includes(user.education.degree) || opportunity.degree_required.includes('Any')) {
            score += 0.2;
            reasons.push({ reason: 'Suitable for your degree', weight: 0.2 });
          }
          if (opportunity.year_of_study.includes(user.education.year) || opportunity.year_of_study.includes(0)) {
            score += 0.2;
            reasons.push({ reason: 'Perfect for your year', weight: 0.2 });
          }
        }

        // Score based on opportunity popularity
        if (opportunity.application_count > 50) {
          score += 0.1;
          reasons.push({ reason: 'Popular opportunity', weight: 0.1 });
        }

        if (score > 0.6) {
          recommendations.push({
            user_id: user._id,
            entity_type: 'opportunity',
            entity_id: opportunity._id,
            entity_type_ref: 'Opportunity',
            score: Math.min(score, 1.0),
            algorithm_used: 'rule_based',
            recommendation_reasons: reasons
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Content-based recommendation system
   * @param {Object} user - User object
   * @returns {Array} Recommendations
   */
  static async generateContentBasedRecommendations(user) {
    const recommendations = [];
    
    // Get user's saved items to understand preferences
    const savedExams = user.saved_exams || [];
    const savedOpportunities = [...(user.saved_hackathons || []), ...(user.saved_internships || [])];

    // Analyze user's preferences from saved items
    const userPreferences = await this.analyzeUserPreferences(user);

    if (user.role === 'school' && savedExams.length > 0) {
      // Find similar exams based on saved exams
      const similarExams = await this.findSimilarExams(savedExams, userPreferences);
      
      for (const exam of similarExams) {
        const score = this.calculateContentSimilarity(exam, userPreferences);
        if (score > 0.7) {
          recommendations.push({
            user_id: user._id,
            entity_type: 'exam',
            entity_id: exam._id,
            entity_type_ref: 'Exam',
            score,
            algorithm_used: 'content_based',
            recommendation_reasons: [
              { reason: 'Similar to your saved exams', weight: 0.4 },
              { reason: 'Matches your preferences', weight: 0.3 }
            ]
          });
        }
      }
    } else if (user.role === 'university' && savedOpportunities.length > 0) {
      // Find similar opportunities based on saved opportunities
      const similarOpportunities = await this.findSimilarOpportunities(savedOpportunities, userPreferences);
      
      for (const opportunity of similarOpportunities) {
        const score = this.calculateContentSimilarity(opportunity, userPreferences);
        if (score > 0.7) {
          recommendations.push({
            user_id: user._id,
            entity_type: 'opportunity',
            entity_id: opportunity._id,
            entity_type_ref: 'Opportunity',
            score,
            algorithm_used: 'content_based',
            recommendation_reasons: [
              { reason: 'Similar to your saved opportunities', weight: 0.4 },
              { reason: 'Matches your preferences', weight: 0.3 }
            ]
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Collaborative filtering recommendation system
   * @param {Object} user - User object
   * @returns {Array} Recommendations
   */
  static async generateCollaborativeFilteringRecommendations(user) {
    const recommendations = [];

    // Find users with similar interests
    const similarUsers = await User.findByInterests(user.preferences.interests)
      .find({ _id: { $ne: user._id } })
      .limit(20);

    if (similarUsers.length === 0) {
      return recommendations;
    }

    // Get items liked by similar users
    const similarUserIds = similarUsers.map(u => u._id);
    
    if (user.role === 'school') {
      // Find exams liked by similar users
      const similarUsersData = await User.find({ _id: { $in: similarUserIds } })
        .populate('saved_exams');
      
      const popularExams = {};
      similarUsersData.forEach(similarUser => {
        similarUser.saved_exams.forEach(exam => {
          if (!popularExams[exam._id]) {
            popularExams[exam._id] = { count: 0, exam };
          }
          popularExams[exam._id].count++;
        });
      });

      // Recommend exams that are popular among similar users
      Object.values(popularExams).forEach(({ count, exam }) => {
        if (count >= 2 && !user.saved_exams.includes(exam._id)) {
          const score = Math.min(count / similarUsers.length, 1.0);
          recommendations.push({
            user_id: user._id,
            entity_type: 'exam',
            entity_id: exam._id,
            entity_type_ref: 'Exam',
            score,
            algorithm_used: 'collaborative_filtering',
            recommendation_reasons: [
              { reason: 'Popular among users like you', weight: 0.5 }
            ]
          });
        }
      });
    } else {
      // Find opportunities liked by similar users
      const similarUsersData = await User.find({ _id: { $in: similarUserIds } })
        .populate('saved_hackathons saved_internships');
      
      const popularOpportunities = {};
      similarUsersData.forEach(similarUser => {
        [...similarUser.saved_hackathons, ...similarUser.saved_internships].forEach(opp => {
          if (!popularOpportunities[opp._id]) {
            popularOpportunities[opp._id] = { count: 0, opportunity: opp };
          }
          popularOpportunities[opp._id].count++;
        });
      });

      // Recommend opportunities that are popular among similar users
      Object.values(popularOpportunities).forEach(({ count, opportunity }) => {
        const userSavedOpps = [...(user.saved_hackathons || []), ...(user.saved_internships || [])];
        if (count >= 2 && !userSavedOpps.includes(opportunity._id)) {
          const score = Math.min(count / similarUsers.length, 1.0);
          recommendations.push({
            user_id: user._id,
            entity_type: 'opportunity',
            entity_id: opportunity._id,
            entity_type_ref: 'Opportunity',
            score,
            algorithm_used: 'collaborative_filtering',
            recommendation_reasons: [
              { reason: 'Popular among users like you', weight: 0.5 }
            ]
          });
        }
      });
    }

    return recommendations;
  }

  /**
   * Hybrid recommendation system combining multiple approaches
   * @param {Object} user - User object
   * @returns {Array} Recommendations
   */
  static async generateHybridRecommendations(user) {
    const [ruleBased, contentBased, collaborative] = await Promise.all([
      this.generateRuleBasedRecommendations(user),
      this.generateContentBasedRecommendations(user),
      this.generateCollaborativeFilteringRecommendations(user)
    ]);

    // Combine and deduplicate recommendations
    const allRecommendations = [...ruleBased, ...contentBased, ...collaborative];
    const uniqueRecommendations = new Map();

    allRecommendations.forEach(rec => {
      const key = `${rec.entity_type}_${rec.entity_id}`;
      if (!uniqueRecommendations.has(key)) {
        uniqueRecommendations.set(key, rec);
      } else {
        // Average the scores for duplicate recommendations
        const existing = uniqueRecommendations.get(key);
        existing.score = (existing.score + rec.score) / 2;
        existing.algorithm_used = 'hybrid';
        existing.recommendation_reasons = [
          ...existing.recommendation_reasons,
          ...rec.recommendation_reasons
        ];
      }
    });

    return Array.from(uniqueRecommendations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 50); // Limit to top 50 recommendations
  }

  /**
   * Analyze user preferences from saved items
   * @param {Object} user - User object
   * @returns {Object} User preferences
   */
  static async analyzeUserPreferences(user) {
    const preferences = {
      subjects: new Set(),
      skills: new Set(),
      domains: new Set(),
      examTypes: new Set(),
      companies: new Set(),
      organizers: new Set()
    };

    // Analyze saved exams
    if (user.saved_exams && user.saved_exams.length > 0) {
      const exams = await Exam.find({ _id: { $in: user.saved_exams } });
      exams.forEach(exam => {
        exam.subjects.forEach(subject => preferences.subjects.add(subject));
        preferences.examTypes.add(exam.exam_type);
      });
    }

    // Analyze saved opportunities
    const savedOpps = [...(user.saved_hackathons || []), ...(user.saved_internships || [])];
    if (savedOpps.length > 0) {
      const opportunities = await Opportunity.find({ _id: { $in: savedOpps } });
      opportunities.forEach(opp => {
        opp.skills_required.forEach(skill => preferences.skills.add(skill));
        if (opp.domain) opp.domain.forEach(domain => preferences.domains.add(domain));
        if (opp.company) preferences.companies.add(opp.company);
        if (opp.organizer) preferences.organizers.add(opp.organizer);
      });
    }

    // Convert Sets to Arrays
    Object.keys(preferences).forEach(key => {
      preferences[key] = Array.from(preferences[key]);
    });

    return preferences;
  }

  /**
   * Find similar exams based on user preferences
   * @param {Array} savedExams - Array of saved exam IDs
   * @param {Object} preferences - User preferences
   * @returns {Array} Similar exams
   */
  static async findSimilarExams(savedExams, preferences) {
    const query = {
      is_active: true,
      'events.date': { $gt: new Date() },
      _id: { $nin: savedExams }
    };

    if (preferences.subjects.length > 0) {
      query.subjects = { $in: preferences.subjects };
    }

    if (preferences.examTypes.length > 0) {
      query.exam_type = { $in: preferences.examTypes };
    }

    return await Exam.find(query).limit(20);
  }

  /**
   * Find similar opportunities based on user preferences
   * @param {Array} savedOpportunities - Array of saved opportunity IDs
   * @param {Object} preferences - User preferences
   * @returns {Array} Similar opportunities
   */
  static async findSimilarOpportunities(savedOpportunities, preferences) {
    const query = {
      is_active: true,
      deadline: { $gt: new Date() },
      _id: { $nin: savedOpportunities }
    };

    if (preferences.skills.length > 0) {
      query.skills_required = { $in: preferences.skills };
    }

    if (preferences.domains.length > 0) {
      query.domain = { $in: preferences.domains };
    }

    return await Opportunity.find(query).limit(30);
  }

  /**
   * Calculate content similarity score
   * @param {Object} item - Exam or Opportunity object
   * @param {Object} preferences - User preferences
   * @returns {number} Similarity score
   */
  static calculateContentSimilarity(item, preferences) {
    let score = 0;
    let totalWeight = 0;

    // Subject/Skill matching
    if (item.subjects) {
      const matchingSubjects = item.subjects.filter(subject =>
        preferences.subjects.includes(subject)
      );
      score += (matchingSubjects.length / item.subjects.length) * 0.4;
      totalWeight += 0.4;
    }

    if (item.skills_required) {
      const matchingSkills = item.skills_required.filter(skill =>
        preferences.skills.includes(skill)
      );
      score += (matchingSkills.length / item.skills_required.length) * 0.3;
      totalWeight += 0.3;
    }

    // Domain matching
    if (item.domain) {
      const matchingDomains = item.domain.filter(domain =>
        preferences.domains.includes(domain)
      );
      score += (matchingDomains.length / item.domain.length) * 0.2;
      totalWeight += 0.2;
    }

    // Company/Organizer matching
    if (item.company && preferences.companies.includes(item.company)) {
      score += 0.1;
      totalWeight += 0.1;
    }

    if (item.organizer && preferences.organizers.includes(item.organizer)) {
      score += 0.1;
      totalWeight += 0.1;
    }

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * Get recommendation performance metrics
   * @returns {Object} Performance metrics
   */
  static async getRecommendationMetrics() {
    const metrics = await Recommendation.aggregate([
      {
        $group: {
          _id: '$algorithm_used',
          total_recommendations: { $sum: 1 },
          avg_score: { $avg: '$score' },
          viewed_count: { $sum: { $cond: ['$user_interaction.viewed', 1, 0] } },
          saved_count: { $sum: { $cond: ['$user_interaction.saved', 1, 0] } },
          applied_count: { $sum: { $cond: ['$user_interaction.applied', 1, 0] } }
        }
      }
    ]);

    const totalRecommendations = await Recommendation.countDocuments();
    const activeRecommendations = await Recommendation.countDocuments({
      is_active: true,
      expires_at: { $gt: new Date() }
    });

    return {
      total_recommendations: totalRecommendations,
      active_recommendations: activeRecommendations,
      by_algorithm: metrics
    };
  }
}

module.exports = RecommendationService;