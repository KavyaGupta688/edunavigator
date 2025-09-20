const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Exam = require('../models/Exam');
const Opportunity = require('../models/Opportunity');
const Progress = require('../models/Progress');

// Sample data
const sampleUsers = [
  {
    name: 'Arunima Rai',
    email: 'arunima@example.com',
    password: 'password123',
    role: 'university',
    education: {
      degree: 'B.Tech',
      year: 3
    },
    preferences: {
      interests: ['Engineering', 'AI/ML', 'Product Design']
    },
    notifications_enabled: true
  },
  {
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    password: 'password123',
    role: 'school',
    school_info: {
      class: 12,
      stream: 'Science'
    },
    preferences: {
      interests: ['Physics', 'Chemistry', 'Mathematics']
    },
    notifications_enabled: true
  },
  {
    name: 'Priya Patel',
    email: 'priya@example.com',
    password: 'password123',
    role: 'university',
    education: {
      degree: 'B.Sc',
      year: 2
    },
    preferences: {
      interests: ['Data Science', 'Machine Learning', 'Statistics']
    },
    notifications_enabled: true
  }
];

const sampleExams = [
  {
    exam_name: 'JEE Main',
    year: 2026,
    authority: 'NTA',
    website: 'https://jeemain.nta.nic.in/',
    exam_type: 'government',
    admission_mode: 'entrance_exam',
    eligibility: {
      board_exam_criteria: 'Minimum 75% in Class 12 PCM'
    },
    registration_fee: 1000,
    subjects: ['Physics', 'Chemistry', 'Maths'],
    events: [
      { event: 'Registration Start', date: new Date('2025-11-01') },
      { event: 'Registration End', date: new Date('2025-11-30') },
      { event: 'Exam Date', date: new Date('2026-01-15') },
      { event: 'Result Declaration', date: new Date('2026-02-10') }
    ],
    last_updated: new Date(),
    is_active: true
  },
  {
    exam_name: 'NEET',
    year: 2026,
    authority: 'NTA',
    website: 'https://neet.nta.nic.in/',
    exam_type: 'government',
    admission_mode: 'entrance_exam',
    eligibility: {
      board_exam_criteria: 'Minimum 50% in Class 12 PCB'
    },
    registration_fee: 1500,
    subjects: ['Physics', 'Chemistry', 'Biology'],
    events: [
      { event: 'Registration Start', date: new Date('2026-01-01') },
      { event: 'Registration End', date: new Date('2026-03-31') },
      { event: 'Exam Date', date: new Date('2026-05-05') },
      { event: 'Result Declaration', date: new Date('2026-06-15') }
    ],
    last_updated: new Date(),
    is_active: true
  },
  {
    exam_name: 'GATE',
    year: 2026,
    authority: 'IIT',
    website: 'https://gate.iitk.ac.in/',
    exam_type: 'government',
    admission_mode: 'entrance_exam',
    eligibility: {
      board_exam_criteria: 'Bachelor\'s degree in Engineering/Technology'
    },
    registration_fee: 1500,
    subjects: ['Engineering Mathematics', 'General Aptitude'],
    events: [
      { event: 'Registration Start', date: new Date('2025-08-01') },
      { event: 'Registration End', date: new Date('2025-09-30') },
      { event: 'Exam Date', date: new Date('2026-02-01') },
      { event: 'Result Declaration', date: new Date('2026-03-15') }
    ],
    last_updated: new Date(),
    is_active: true
  }
];

const sampleOpportunities = [
  {
    title: 'AI for Social Good',
    type: 'hackathon',
    organizer: 'Devpost',
    domain: ['AI/ML', 'Open Innovation'],
    mode: 'Online',
    website: 'https://devpost.com/hackathon/ai-social-good',
    prize: 50000,
    team_size: '1-4',
    start_date: new Date('2025-10-20'),
    end_date: new Date('2025-10-25'),
    deadline: new Date('2025-10-15'),
    description: 'Build AI solutions for social impact',
    skills_required: ['Python', 'Machine Learning', 'Data Science'],
    last_updated: new Date(),
    source: 'admin',
    is_active: true
  },
  {
    title: 'Software Engineering Intern',
    type: 'internship',
    company: 'Google India',
    role: 'Software Engineering Intern',
    degree_required: ['B.Tech', 'M.Tech'],
    year_of_study: [3, 4],
    location: 'Bangalore',
    mode: 'Hybrid',
    stipend: 40000,
    duration: '3 months',
    deadline: new Date('2025-11-01'),
    apply_link: 'https://careers.google.com/jobs/12345',
    description: 'Work on cutting-edge software projects',
    skills_required: ['JavaScript', 'React', 'Node.js', 'Python'],
    last_updated: new Date(),
    source: 'admin',
    is_active: true
  },
  {
    title: 'Data Science Hackathon',
    type: 'hackathon',
    organizer: 'Kaggle',
    domain: ['Data Science', 'Machine Learning'],
    mode: 'Online',
    website: 'https://kaggle.com/competitions/data-science-hackathon',
    prize: 25000,
    team_size: '1-3',
    start_date: new Date('2025-12-01'),
    end_date: new Date('2025-12-03'),
    deadline: new Date('2025-11-25'),
    description: 'Solve real-world data science problems',
    skills_required: ['Python', 'R', 'Statistics', 'Machine Learning'],
    last_updated: new Date(),
    source: 'admin',
    is_active: true
  }
];

// Connect to database
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edunavigator';
    await mongoose.connect(mongoURI);
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Exam.deleteMany({});
    await Opportunity.deleteMany({});
    await Progress.deleteMany({});
    console.log('🗑️  Database cleared');
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
  }
};

// Seed users
const seedUsers = async () => {
  try {
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
    }
    console.log('👥 Users seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
  }
};

// Seed exams
const seedExams = async () => {
  try {
    for (const examData of sampleExams) {
      const exam = new Exam(examData);
      await exam.save();
    }
    console.log('📚 Exams seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding exams:', error.message);
  }
};

// Seed opportunities
const seedOpportunities = async () => {
  try {
    for (const opportunityData of sampleOpportunities) {
      const opportunity = new Opportunity(opportunityData);
      await opportunity.save();
    }
    console.log('🎯 Opportunities seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding opportunities:', error.message);
  }
};

// Seed progress for users
const seedProgress = async () => {
  try {
    const users = await User.find();
    for (const user of users) {
      const progress = new Progress({
        user_id: user._id,
        exams_registered: Math.floor(Math.random() * 3),
        hackathons_applied: user.role === 'university' ? Math.floor(Math.random() * 2) : 0,
        internships_applied: user.role === 'university' ? Math.floor(Math.random() * 2) : 0,
        points: Math.floor(Math.random() * 200),
        level: Math.floor(Math.random() * 5) + 1,
        badges: [
          {
            name: 'First Steps',
            description: 'Created your account',
            category: 'achievement',
            rarity: 'common',
            earned_at: new Date()
          }
        ]
      });
      await progress.save();
    }
    console.log('📊 Progress seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding progress:', error.message);
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    await connectDB();
    await clearDatabase();
    await seedUsers();
    await seedExams();
    await seedOpportunities();
    await seedProgress();
    
    console.log('🎉 Database seeded successfully!');
    console.log('\n📋 Sample Data Summary:');
    console.log(`👥 Users: ${sampleUsers.length}`);
    console.log(`📚 Exams: ${sampleExams.length}`);
    console.log(`🎯 Opportunities: ${sampleOpportunities.length}`);
    console.log('\n🔑 Sample Login Credentials:');
    sampleUsers.forEach(user => {
      console.log(`Email: ${user.email}, Password: password123`);
    });
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };