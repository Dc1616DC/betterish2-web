# Betterish-Web Project Summary

## Overview
Task management app for busy parents built with Next.js 15, React 19, and Firebase.

## Tech Stack
- **Frontend**: Next.js 15.3.4, React 19
- **Database**: Firebase Firestore  
- **Auth**: Firebase Authentication
- **Styling**: Tailwind CSS
- **Deployment**: Netlify

## Core Features
1. **Daily Task Management**: Auto-generated tasks based on user preferences
2. **Past Promises**: Track incomplete tasks from previous days
3. **Voice Recording**: Add tasks via voice using OpenAI Whisper
4. **Smart Reminders**: Contextual reminders based on patterns
5. **Emergency Mode**: Quick task sets for overwhelming days
6. **Relationship Tracking**: Monitor relationship health metrics

## Project Structure
```
betterish-web/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Main dashboard page
│   ├── browse/           # Browse task suggestions
│   ├── loose-ends/       # View past incomplete tasks
│   └── api/              # API routes
├── components/           # React components
├── lib/                  # Utilities and Firebase config
├── hooks/               # Custom React hooks
└── constants/           # Task templates and constants
```

## Key Files

### Dashboard Component
- **File**: `/app/dashboard/DashboardClient.js`
- **Purpose**: Main dashboard with real-time task management
- **Features**: Task CRUD, swipe gestures, real-time sync

### Firebase Configuration  
- **Client**: `/lib/firebase-client.js`
- **Admin**: `/lib/firebase-admin.js`
- **Purpose**: Separated client/server Firebase initialization

### Task System
- **Templates**: `/constants/tasks.js`
- **Engine**: `/lib/taskEngine.js`
- **Purpose**: Smart task generation based on context

## Environment Variables Required
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
OPENAI_API_KEY
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
```

## Recent Improvements
1. Fixed dismissed tasks reappearing bug
2. Removed exposed API keys from client
3. Added real-time listeners for data sync
4. Implemented proper error boundaries
5. Added debouncing to prevent rapid clicks
6. Cleaned up console logs for production
7. Fixed Firebase configuration conflicts
8. Added comprehensive field migration

## Setup Instructions
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in values
4. Run development server: `npm run dev`
5. Build for production: `npm run build`

## Deployment
Configured for automatic deployment to Netlify on push to main branch.

## GitHub Repository
https://github.com/Dc1616DC/betterish2-web