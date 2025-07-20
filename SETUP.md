# Betterish App Setup

## Environment Variables Required

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

OPENAI_API_KEY=your_openai_api_key
```

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication with Email/Password
3. Create a Firestore database
4. Add your Firebase config to the environment variables

## OpenAI Setup

1. Get an API key from https://platform.openai.com
2. Add it to your environment variables

## Development

```bash
npm install
npm run dev
```

## Recent Fixes Applied

✅ **Fixed missing dismissTask function** - Tasks can now be dismissed properly
✅ **Fixed promises section buttons** - Added Snooze and Dismiss options
✅ **Improved swipe gestures** - Better touch handling and conflict resolution
✅ **Removed duplicate useEffect** - Cleaned up code structure
✅ **Fixed home page redirect** - Now properly redirects to dashboard/login
✅ **Enhanced touch responsiveness** - Added touch-manipulation CSS class

## Features Working

- ✅ Swipe right to complete tasks
- ✅ Swipe left to snooze tasks (move to tomorrow)
- ✅ Swipe far left to dismiss tasks permanently
- ✅ Voice recording with OpenAI Whisper transcription
- ✅ Smart task suggestions based on user preferences
- ✅ Past promises management with proper actions
- ✅ Three main sections: Dashboard, Browse, Loose Ends
