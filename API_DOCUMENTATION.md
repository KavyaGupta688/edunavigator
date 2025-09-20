# EduNavigator API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Response Format
All API responses follow this format:
```json
{
  "success": true/false,
  "message": "Response message",
  "data": { ... } // Optional
}
```

---

## Authentication Endpoints

### Register User
- **POST** `/auth/register`
- **Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "university", // "school" or "university"
  "education": {
    "degree": "B.Tech",
    "year": 3
  },
  "preferences": {
    "interests": ["AI/ML", "Web Development"]
  }
}
```

### Login User
- **POST** `/auth/login`
- **Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Current User
- **GET** `/auth/me`
- **Headers:** Authorization required

### Update Password
- **PUT** `/auth/updatepassword`
- **Headers:** Authorization required
- **Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

---

## User Endpoints

### Get All Users (Admin)
- **GET** `/users`
- **Headers:** Authorization required (Admin only)
- **Query Parameters:**
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `role` (optional): Filter by role
  - `search` (optional): Search by name or email

### Get User Profile
- **GET** `/users/:id`
- **Headers:** Authorization required

### Update User Profile
- **PUT** `/users/:id`
- **Headers:** Authorization required
- **Body:**
```json
{
  "name": "Updated Name",
  "preferences": {
    "interests": ["Updated Interest"]
  },
  "notifications_enabled": true
}
```

### Get User Dashboard
- **GET** `/users/:id/dashboard`
- **Headers:** Authorization required

### Save Exam
- **POST** `/users/:id/save-exam`
- **Headers:** Authorization required
- **Body:**
```json
{
  "examId": "exam_id_here"
}
```

### Save Hackathon
- **POST** `/users/:id/save-hackathon`
- **Headers:** Authorization required
- **Body:**
```json
{
  "hackathonId": "hackathon_id_here"
}
```

### Save Internship
- **POST** `/users/:id/save-internship`
- **Headers:** Authorization required
- **Body:**
```json
{
  "internshipId": "internship_id_here"
}
```

---

## Exam Endpoints

### Get All Exams
- **GET** `/exams`
- **Query Parameters:**
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `type` (optional): Filter by type (government, private, semi_government)
  - `admission_mode` (optional): Filter by admission mode (direct_admission, entrance_exam)
  - `year` (optional): Filter by year
  - `subjects` (optional): Comma-separated subjects
  - `search` (optional): Search by exam name
  - `upcoming` (optional): true/false for upcoming exams

### Get Single Exam
- **GET** `/exams/:id`

### Get Upcoming Exams
- **GET** `/exams/upcoming`

### Get Exams by Type
- **GET** `/exams/type/:type`

### Get Exams by Admission Mode
- **GET** `/exams/admission-mode/:mode`
- **Parameters:**
  - `mode`: "direct_admission" or "entrance_exam"

### Get Exams by Subjects
- **GET** `/exams/subjects?subjects=Physics,Chemistry,Maths`

### Search Exams
- **GET** `/exams/search?q=search_term`

### Get Exam Statistics
- **GET** `/exams/stats`

### Create Exam (Admin)
- **POST** `/exams`
- **Headers:** Authorization required (Admin only)
- **Body:**
```json
{
  "exam_name": "JEE Main",
  "year": 2026,
  "authority": "NTA",
  "website": "https://jeemain.nta.nic.in/",
  "exam_type": "government",
  "admission_mode": "entrance_exam",
  "registration_fee": 1000,
  "subjects": ["Physics", "Chemistry", "Maths"],
  "events": [
    {
      "event": "Registration Start",
      "date": "2025-11-01"
    }
  ]
}
```

---

## Opportunity Endpoints

### Get All Opportunities
- **GET** `/opportunities`
- **Query Parameters:**
  - `type` (optional): "hackathon" or "internship"
  - `domain` (optional): Comma-separated domains
  - `skills` (optional): Comma-separated skills
  - `mode` (optional): "Online", "Offline", "Hybrid"
  - `company` (optional): Filter by company name
  - `location` (optional): Filter by location
  - `upcoming` (optional): true/false for upcoming opportunities

### Get Single Opportunity
- **GET** `/opportunities/:id`

### Get Hackathons
- **GET** `/opportunities/hackathons`

### Get Internships
- **GET** `/opportunities/internships`

### Get Opportunities for Student
- **GET** `/opportunities/for-student/:userId`
- **Headers:** Authorization required

### Get Upcoming Opportunities
- **GET** `/opportunities/upcoming`

### Search Opportunities
- **GET** `/opportunities/search?q=search_term`

### Create Opportunity (Admin)
- **POST** `/opportunities`
- **Headers:** Authorization required (Admin only)
- **Body (Hackathon):**
```json
{
  "title": "AI for Social Good",
  "type": "hackathon",
  "organizer": "Devpost",
  "domain": ["AI/ML", "Open Innovation"],
  "mode": "Online",
  "website": "https://devpost.com/hackathon/ai-social-good",
  "prize": 50000,
  "team_size": "1-4",
  "start_date": "2025-10-20",
  "end_date": "2025-10-25",
  "deadline": "2025-10-15"
}
```

---

## Team Endpoints

### Get All Teams
- **GET** `/teams`
- **Headers:** Authorization required
- **Query Parameters:**
  - `opp_id` (optional): Filter by opportunity ID
  - `status` (optional): Filter by status
  - `skills` (optional): Comma-separated skills

### Get Single Team
- **GET** `/teams/:id`
- **Headers:** Authorization required

### Create Team
- **POST** `/teams`
- **Headers:** Authorization required
- **Body:**
```json
{
  "opp_id": "opportunity_id_here",
  "name": "Team Name",
  "description": "Team description",
  "max_members": 4,
  "skills_needed": ["React", "Node.js"],
  "requirements": ["Must have experience"]
}
```

### Join Team
- **POST** `/teams/:id/join`
- **Headers:** Authorization required
- **Body:**
```json
{
  "skills": ["React", "JavaScript"]
}
```

### Leave Team
- **DELETE** `/teams/:id/leave`
- **Headers:** Authorization required

### Get User's Teams
- **GET** `/teams/user/:userId`
- **Headers:** Authorization required

### Get Available Teams
- **GET** `/teams/available`
- **Headers:** Authorization required

---

## Recommendation Endpoints

### Get User Recommendations
- **GET** `/recommendations/:userId`
- **Headers:** Authorization required
- **Query Parameters:**
  - `entityType` (optional): "exam" or "opportunity"
  - `limit` (optional): Number of recommendations

### Get Top Recommendations
- **GET** `/recommendations/:userId/top`
- **Headers:** Authorization required

### Generate Recommendations
- **POST** `/recommendations/:userId/generate`
- **Headers:** Authorization required

### Update Recommendation Interaction
- **PUT** `/recommendations/:id/interaction`
- **Headers:** Authorization required
- **Body:**
```json
{
  "interactionType": "viewed" // "viewed", "saved", or "applied"
}
```

### Get Trending Recommendations
- **GET** `/recommendations/trending`
- **Query Parameters:**
  - `type` (optional): "exams" or "opportunities"
  - `limit` (optional): Number of items

---

## Progress Endpoints

### Get User Progress
- **GET** `/progress/:userId`
- **Headers:** Authorization required

### Update User Progress
- **PUT** `/progress/:userId`
- **Headers:** Authorization required
- **Body:**
```json
{
  "activityType": "exams_registered", // "exams_registered", "hackathons_applied", "internships_applied"
  "increment": 1
}
```

### Add Badge
- **POST** `/progress/:userId/badges`
- **Headers:** Authorization required
- **Body:**
```json
{
  "name": "Badge Name",
  "description": "Badge description",
  "category": "achievement",
  "rarity": "rare",
  "points_awarded": 50
}
```

### Get Leaderboard
- **GET** `/progress/leaderboard`
- **Query Parameters:**
  - `limit` (optional): Number of users

---

## Message Endpoints

### Get Team Messages
- **GET** `/messages/team/:teamId`
- **Headers:** Authorization required
- **Query Parameters:**
  - `limit` (optional): Number of messages
  - `skip` (optional): Number to skip

### Send Message
- **POST** `/messages/team/:teamId`
- **Headers:** Authorization required
- **Body:**
```json
{
  "message": "Hello team!",
  "message_type": "text",
  "priority": "normal"
}
```

### Edit Message
- **PUT** `/messages/:id`
- **Headers:** Authorization required
- **Body:**
```json
{
  "message": "Updated message"
}
```

### Delete Message
- **DELETE** `/messages/:id`
- **Headers:** Authorization required

### Add Reaction
- **POST** `/messages/:id/reaction`
- **Headers:** Authorization required
- **Body:**
```json
{
  "emoji": "👍"
}
```

---

## Notification Endpoints

### Get User Notifications
- **GET** `/notifications/:userId`
- **Headers:** Authorization required
- **Query Parameters:**
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `unread_only` (optional): true/false

### Mark Notification as Read
- **PUT** `/notifications/:id/read`
- **Headers:** Authorization required

### Mark All Notifications as Read
- **PUT** `/notifications/:userId/read-all`
- **Headers:** Authorization required

### Get Notification Settings
- **GET** `/notifications/:userId/settings`
- **Headers:** Authorization required

### Update Notification Settings
- **PUT** `/notifications/:userId/settings`
- **Headers:** Authorization required
- **Body:**
```json
{
  "email_notifications": true,
  "push_notifications": true,
  "exam_deadlines": true,
  "new_opportunities": true,
  "team_updates": true,
  "weekly_digest": true
}
```

---

## Admin Endpoints

### Get System Statistics
- **GET** `/admin/stats`
- **Headers:** Authorization required (Admin only)

### Get User Analytics
- **GET** `/admin/analytics/users`
- **Headers:** Authorization required (Admin only)

### Get Exam Analytics
- **GET** `/admin/analytics/exams`
- **Headers:** Authorization required (Admin only)

### Get Opportunity Analytics
- **GET** `/admin/analytics/opportunities`
- **Headers:** Authorization required (Admin only)

### Get System Logs
- **GET** `/admin/logs`
- **Headers:** Authorization required (Admin only)
- **Query Parameters:**
  - `page` (optional): Page number
  - `limit` (optional): Items per page
  - `entity` (optional): Filter by entity type
  - `severity` (optional): Filter by severity

### Export Data
- **GET** `/admin/export/:type`
- **Headers:** Authorization required (Admin only)
- **Query Parameters:**
  - `format` (optional): "json" or "csv"
- **Types:** "users", "exams", "opportunities"

---

## Error Codes

- **400** - Bad Request (validation errors, missing parameters)
- **401** - Unauthorized (invalid or missing token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (resource doesn't exist)
- **429** - Too Many Requests (rate limit exceeded)
- **500** - Internal Server Error

## Rate Limiting

- **General API:** 100 requests per 15 minutes per IP
- **Authentication:** 5 requests per 15 minutes per IP

## Pagination

Most list endpoints support pagination:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```