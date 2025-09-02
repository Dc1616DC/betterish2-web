# TestSprite Testing Scenarios for Betterish

## 1. AI Mentor Core Functionality

### Scenario: Basic AI Check-in
- **URL**: http://localhost:3003/dashboard
- **Action**: Click "What's up today?" button
- **Expected**: AI mentor provides contextual response with seasonal suggestions
- **Verify**: Response matches brand voice (tired dad friend tone)

### Scenario: Task Addition from AI Suggestions  
- **Action**: Click "Yeah, add these" on AI suggestions
- **Expected**: Tasks are added to the dashboard
- **Verify**: Tasks appear in today's task list

### Scenario: Emergency Mode Activation
- **Action**: Click "Emergency Mode" button
- **Expected**: Shows 4 essential survival tasks
- **Verify**: UI changes to orange theme, shows progress bar

## 2. Mobile Responsiveness

### Scenario: Mobile Task Management
- **Device**: iPhone/Android viewport
- **Action**: Swipe tasks left/right for complete/snooze
- **Expected**: Smooth swipe gestures work
- **Verify**: Haptic feedback on mobile devices

### Scenario: Mobile AI Mentor
- **Device**: Mobile viewport
- **Action**: Use AI mentor check-in
- **Expected**: UI adapts properly to mobile screen
- **Verify**: Text is readable, buttons are touchable

## 3. Subscription System (Testing Mode)

### Scenario: Unlimited Chat Access
- **Action**: Use AI mentor multiple times (>3 times)
- **Expected**: No chat limit warnings appear
- **Verify**: UNLIMITED_TESTING=true is working

### Scenario: Subscription Modal
- **Action**: Try to access premium features
- **Expected**: Subscription modal appears with pricing
- **Verify**: Modal shows correct pricing ($9.99 Pro, $14.99 Family)

## 4. PWA Functionality

### Scenario: Service Worker
- **Action**: Go offline, try to load app
- **Expected**: App loads from cache
- **Verify**: Offline message appears for API calls

### Scenario: Add to Home Screen
- **Action**: Add app to mobile home screen
- **Expected**: App icon appears, opens without browser chrome
- **Verify**: Manifest.json is properly configured

## 5. Task Management Features

### Scenario: Task Creation
- **Action**: Create new task with category
- **Expected**: Task appears in list with correct category color
- **Verify**: Task saved to Firebase

### Scenario: Task Completion
- **Action**: Mark task as complete
- **Expected**: Task moves to completed section
- **Verify**: Completion tracked in Firebase

### Scenario: Recurring Tasks
- **Action**: Set up recurring task
- **Expected**: Task recreates on schedule
- **Verify**: Recurring logic works properly

## 6. Firebase Integration

### Scenario: User Authentication
- **Action**: Sign in with Google
- **Expected**: User data loads, tasks appear
- **Verify**: Firebase auth working

### Scenario: Real-time Updates
- **Action**: Make changes in one tab/device
- **Expected**: Changes appear in other tabs/devices
- **Verify**: Firestore real-time listeners working

## 7. Error Handling

### Scenario: API Failure Graceful Degradation
- **Action**: Block external API calls
- **Expected**: App shows fallback messages
- **Verify**: No crashes, helpful error messages

### Scenario: Offline Mode
- **Action**: Disconnect internet
- **Expected**: App continues working with cached data
- **Verify**: Clear offline indicators

## Test URLs
- **Local Development**: http://localhost:3003
- **Production**: https://your-app.netlify.app

## API Endpoints to Test
- `POST /api/ai-checkin` - AI mentor responses
- `GET /api/health` - Health check
- Firebase Functions (if any)

## Brand Voice Verification
Check that AI responses maintain the "tired dad friend" tone:
- ✅ Empathetic, understanding
- ✅ Practical, no corporate speak  
- ✅ Gentle humor without being flippant
- ✅ Acknowledges the struggle of dad life