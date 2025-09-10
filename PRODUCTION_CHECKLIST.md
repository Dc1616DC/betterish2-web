# Production Deployment Checklist

## Environment Variables (Netlify)

Required environment variables for the AI systems to work in production:

### Must Have:
- [ ] `GROK_API_KEY` - For AI-powered task suggestions
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase authentication
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID

### Optional (for enhanced features):
- [ ] `OPENAI_API_KEY` - Alternative AI provider (fallback)
- [ ] `FIREBASE_ADMIN_CLIENT_EMAIL` - Server-side Firebase operations
- [ ] `FIREBASE_ADMIN_PRIVATE_KEY` - Server-side Firebase auth

## Netlify Configuration

1. **Add Environment Variables**:
   - Go to Site Settings → Environment variables
   - Add all required keys from above
   - Deploy or redeploy after adding

2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18.x or higher

## GitHub Actions (if using CI/CD)

Add secrets to GitHub repository:
1. Go to Settings → Secrets and variables → Actions
2. Add all environment variables as repository secrets
3. Update `.github/workflows/deploy.yml` if needed

## Production-Ready Code Checks

### ✅ Already Fixed:
- [x] Pattern tracking works server-side (checks for `window` object)
- [x] localStorage usage is browser-only
- [x] API routes handle errors gracefully
- [x] Fallback data for when APIs fail

### AI Systems Status:
1. **Grok AI Integration** ✅
   - Location: `/app/api/ai-checkin/route.ts`
   - Requires: `GROK_API_KEY` env variable
   - Fallback: Static suggestions if API fails

2. **Contextual Task Engine** ✅
   - Location: `/lib/contextualTasks.js`
   - Works: Client and server-side
   - No external dependencies

3. **Pattern Tracking** ✅
   - Location: `/lib/patternTracking.js`
   - Fixed: Server-side safe (checks for browser)
   - Storage: localStorage (client-only)

4. **Dynamic Refresh** ✅
   - Location: `/lib/dynamicTaskRefresh.js`
   - Works: Client-side only (as intended)

## Testing Production Features

After deployment, test these features:

1. **Daily Check-in**:
   - Should show varied suggestions each day
   - Should not repeat "Test heating system" constantly

2. **Browse Section**:
   - All categories should show tasks
   - Tasks should be personalized based on profile

3. **Task Suggestions**:
   - Should change based on time of day
   - Should reflect seasonal changes
   - Should personalize with user data

## Common Issues & Solutions

### Issue: Same suggestions every day
**Solution**: Check if `GROK_API_KEY` is set in Netlify environment variables

### Issue: "No suggestions available"
**Solution**: The fallback system should prevent this. Check browser console for errors.

### Issue: Browse section crashes
**Solution**: Fixed - was due to undefined `babyAgeInMonths` variable

### Issue: Features work locally but not in production
**Solution**: Ensure all environment variables are set in Netlify dashboard

## Monitoring

Check these after deployment:
- Netlify Functions log for API errors
- Browser console for client-side errors
- Network tab for failed API calls

## Environment Variable Template for Netlify

```
GROK_API_KEY=xai-xxxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaxxxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-app-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxxxxxxxxxxx
```

## Final Steps

1. Commit all changes
2. Push to GitHub
3. Netlify auto-deploys from main branch
4. Verify environment variables are set
5. Test all AI features in production