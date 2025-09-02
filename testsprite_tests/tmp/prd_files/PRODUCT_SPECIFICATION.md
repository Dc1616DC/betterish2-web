# Betterish - Product Specification Document

## 1. Product Overview

### 1.1 Product Name
**Betterish** - Stay on top of life without the nagging. Get time back for what you love.

### 1.2 Product Vision
A modern task management and productivity application that helps users manage their daily responsibilities through intelligent task organization, AI assistance, and personalized productivity coaching.

### 1.3 Target Users
- Busy professionals and parents
- Individuals seeking better work-life balance
- People who struggle with task prioritization and follow-through
- Users who want intelligent assistance without overwhelming notifications

## 2. Core Features

### 2.1 Authentication & User Management
- **Email/Password Authentication**: Secure user registration and login via Firebase Auth
- **User Profiles**: Personalized profiles with preferences and settings
- **User Preferences Setup**: Onboarding flow to customize experience
- **Session Management**: Secure authentication state handling

### 2.2 Task Management System
- **Task Creation**: Add tasks with title, details, category, and priority levels
- **Task Completion**: Mark tasks as completed with timestamp tracking
- **Task Categories**: Organize tasks by categories (household, work, personal, etc.)
- **Priority Levels**: Set task priorities (low, medium, high)
- **Task Editing**: Modify existing tasks
- **Task Deletion**: Remove unwanted tasks
- **Bulk Task Operations**: Handle multiple tasks efficiently

### 2.3 Project Management
- **Project Detection**: Automatically identify potential projects from task titles
- **Project Breakdown**: Convert complex tasks into structured projects with subtasks
- **Subtask Management**: Create, edit, and complete individual subtasks within projects
- **Project Progress Tracking**: Visual progress indicators for project completion
- **Project Completion**: Mark entire projects as complete

### 2.4 Smart Task Features
- **Past Promises**: Surface incomplete tasks from previous days for review
- **Task Restoration**: Move old tasks back to today's focus
- **Task Snoozing**: Defer tasks to future dates (tomorrow morning)
- **Task Dismissal**: Remove tasks that are no longer relevant
- **Recurring Tasks**: Set up repeating tasks with various intervals
- **Smart Suggestions**: AI-generated daily task recommendations

### 2.5 AI Assistant Features
- **AI Mentor Check-ins**: Intelligent productivity coaching and guidance
- **Sidekick Chat**: Context-aware AI assistance for specific tasks
- **Task Breakdown**: AI-powered project decomposition
- **Voice Transcription**: Convert speech to tasks via `/api/transcribe`
- **Contextual Task Generation**: Smart task suggestions based on user patterns

### 2.6 Advanced Productivity Features
- **Emergency Mode**: Special focus mode for high-pressure situations
- **Streak Tracking**: Daily completion streak monitoring
- **Pattern Tracking**: AI learning from user completion patterns
- **Undo Functionality**: Reverse recent task completions
- **Pull-to-Refresh**: Mobile-friendly data synchronization

### 2.7 Mobile Optimization
- **Responsive Design**: Mobile-first design approach
- **Touch Interactions**: Optimized for mobile gestures
- **Offline Support**: Local storage and sync capabilities
- **Mobile Task Forms**: Simplified task creation for mobile devices
- **Haptic Feedback**: Physical feedback for task interactions

### 2.8 Data Management
- **Real-time Sync**: Firebase Firestore for real-time data synchronization
- **Data Cleanup**: Automated template task cleanup functionality
- **Export Capabilities**: Task data export functionality
- **Data Security**: Secure data handling with proper access controls

## 3. Technical Architecture

### 3.1 Frontend
- **Framework**: Next.js 15.3.4 with React 19.0.0
- **Styling**: Tailwind CSS 4.0
- **Icons**: Heroicons React components
- **State Management**: React hooks and context
- **Build System**: Next.js build system with bundle analysis

### 3.2 Backend Services
- **Database**: Firebase Firestore for real-time data
- **Authentication**: Firebase Authentication
- **Cloud Functions**: Firebase Functions for serverless operations
- **File Storage**: Firebase Storage (if needed)

### 3.3 External APIs
- **OpenAI Integration**: AI-powered features using OpenAI API
- **Voice Processing**: Speech-to-text transcription services

### 3.4 Security Features
- **Content Security Policy**: Comprehensive CSP headers
- **HTTPS Enforcement**: Automatic HTTP to HTTPS redirection
- **XSS Protection**: X-Content-Type-Options and X-Frame-Options headers
- **Referrer Policy**: Strict origin policy for external requests

## 4. User Experience Flow

### 4.1 Onboarding
1. User registration/login
2. Initial preferences setup
3. Dashboard introduction
4. First task creation

### 4.2 Daily Workflow
1. Dashboard greeting with date and streak information
2. Review today's focus tasks and active projects
3. Complete tasks with instant feedback
4. Add new tasks as they arise
5. Interact with AI mentor for guidance
6. Review past promises periodically

### 4.3 Mobile Experience
- Simplified interface for mobile devices
- Touch-optimized interactions
- Mobile-specific task forms
- Gesture-based navigation

## 5. API Endpoints

### 5.1 Authentication
- `GET/POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout

### 5.2 AI Services
- `POST /api/ai-checkin` - AI mentor check-in functionality
- `POST /api/sidekick-chat` - AI task assistance chat
- `POST /api/ai/breakdown` - Task breakdown assistance
- `POST /api/transcribe` - Voice-to-text transcription

### 5.3 Admin Functions
- `POST /api/admin/cleanup-all-users` - Administrative cleanup operations

## 6. Data Models

### 6.1 User
- userId (string)
- email (string)
- preferences (object)
- streakCount (number)
- userTier (string: free/premium)
- lastTaskCompletionDate (timestamp)

### 6.2 Task
- id (string)
- userId (string)
- title (string)
- detail (string)
- category (string)
- priority (string)
- completed (boolean)
- completedAt (timestamp)
- createdAt (timestamp)
- snoozedUntil (timestamp, optional)
- dismissed (boolean)
- deleted (boolean)
- source (string: manual/ai_mentor/voice)
- isProject (boolean)
- subtasks (array, for projects)

### 6.3 Recurring Task
- userId (string)
- title (string)
- category (string)
- frequency (string)
- isActive (boolean)
- createdAt (timestamp)

## 7. Performance Considerations
- Optimistic UI updates for immediate feedback
- Efficient data fetching and caching
- Mobile-first responsive design
- Bundle size optimization with Next.js analyzer
- Real-time synchronization with minimal overhead

## 8. Security & Privacy
- Firebase security rules for data access control
- No sensitive data logging
- Secure API communication
- User data isolation and privacy protection
- GDPR compliance considerations

## 9. Future Enhancements
- Calendar integration
- Team collaboration features
- Advanced analytics and insights
- Third-party app integrations
- Enhanced AI capabilities
- Wearable device support

## 10. Success Metrics
- Daily active users
- Task completion rates
- User retention
- Feature adoption rates
- AI interaction engagement
- Mobile vs desktop usage patterns

---

This PRD serves as the foundation for comprehensive testing and development of the Betterish application, covering all major features and functionality currently implemented in the codebase.