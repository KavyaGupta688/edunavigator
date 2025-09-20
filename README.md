# EduNavigator Backend

A comprehensive Node.js and Express.js backend for the EduNavigator platform - an educational opportunities platform for students to discover exams, hackathons, and internships.

## 🚀 Features

- **User Management**: Registration, authentication, and profile management for school and university students
- **Exam Management**: CRUD operations for various competitive exams with deadline tracking
- **Opportunity Management**: Hackathons and internships with filtering and search capabilities
- **Team Formation**: Team creation and management for hackathons
- **Recommendation System**: AI-powered personalized recommendations
- **Notification System**: Email and push notifications for deadlines and updates
- **Progress Tracking**: Gamification with points, badges, and leaderboards
- **Real-time Messaging**: Team communication system
- **Admin Panel**: Comprehensive admin dashboard and analytics
- **Web Scraping**: Automated data collection from various sources

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd edunavigator/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/edunavigator
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB (if not running)
   mongod
   
   # Seed the database with sample data
   npm run seed
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

The API documentation is available in `API_DOCUMENTATION.md` or you can access it at:
- **Base URL**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/health`

### Key Endpoints

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Exams**: `/api/exams/*`
- **Opportunities**: `/api/opportunities/*`
- **Teams**: `/api/teams/*`
- **Recommendations**: `/api/recommendations/*`
- **Progress**: `/api/progress/*`
- **Messages**: `/api/messages/*`
- **Notifications**: `/api/notifications/*`
- **Admin**: `/api/admin/*`

## 🗄️ Database Schema

The application uses MongoDB with the following main collections:

- **Users**: Student profiles and preferences
- **Exams**: Competitive exam information
- **Opportunities**: Hackathons and internships
- **Teams**: Team formation for hackathons
- **Messages**: Team communication
- **Recommendations**: AI-generated recommendations
- **Progress**: User progress and gamification
- **UpdateLogs**: System change tracking

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start with nodemon
npm start           # Start production server

# Database
npm run seed        # Seed database with sample data

# Testing
npm test           # Run tests
npm run test:watch # Run tests in watch mode

# Scraping
npm run scrape     # Run data scraping
npm run notify     # Send notifications
```

## 🏗️ Project Structure

```
backend/
├── config/           # Database and app configuration
├── controllers/      # Route controllers
├── middleware/       # Custom middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic services
├── utils/           # Utility functions
├── scripts/         # Database and utility scripts
├── logs/            # Application logs
├── uploads/         # File uploads
├── server.js        # Main application file
└── package.json     # Dependencies and scripts
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📊 Features Overview

### User Management
- Role-based access (school/university students)
- Profile management with preferences
- Progress tracking and gamification

### Exam System
- Comprehensive exam database
- Deadline tracking and notifications
- Filtering by type, subjects, and authority

### Opportunity Platform
- Hackathons and internships
- Advanced filtering and search
- Application tracking

### Team Formation
- Team creation and management
- Real-time messaging
- Member roles and permissions

### Recommendation Engine
- Rule-based recommendations
- Content-based filtering
- Collaborative filtering
- Hybrid approach

### Notification System
- Email notifications
- Push notifications
- Deadline reminders
- Weekly digests

## 🚀 Deployment

### Environment Variables

Ensure all required environment variables are set:

```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/edunavigator

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_REFRESH_EXPIRE=30d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@edunavigator.com

# External APIs
OPENAI_API_KEY=your_openai_api_key_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Production Deployment

1. **Build the application**
   ```bash
   npm install --production
   ```

2. **Set up process manager (PM2)**
   ```bash
   npm install -g pm2
   pm2 start server.js --name edunavigator-backend
   ```

3. **Set up reverse proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🔍 Monitoring and Logging

- **Logs**: Application logs are stored in the `logs/` directory
- **Health Check**: Monitor application health at `/health`
- **Metrics**: Admin endpoints provide system metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the logs for debugging

## 🔄 Updates and Maintenance

### Regular Tasks
- Database backups
- Log rotation
- Security updates
- Performance monitoring

### Automated Tasks
- Data scraping (daily)
- Notification sending (scheduled)
- Database cleanup (weekly)

---

**EduNavigator Backend** - Empowering students with educational opportunities! 🎓