# Deployment Guide for Betterish-Web

## Prerequisites

1. **Firebase Project Setup**
   - Ensure your Firebase project is properly configured
   - Authentication is enabled for Email/Password and Google Sign-In
   - Firestore security rules are configured
   - Firebase Admin SDK service account key is available

2. **Environment Variables**
   - Copy `.env.example` to `.env.local` for development
   - Set up production environment variables in your hosting platform

## Environment Variables Required

### Client-side (NEXT_PUBLIC_*)
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Server-side only
```
OPENAI_API_KEY=your_openai_api_key
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----"
```

## Deployment Options

### Option 1: Netlify (Recommended)

1. **Connect Repository**
   - Connect your GitHub repository to Netlify
   - Netlify will auto-detect it's a Next.js project

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 20

3. **Environment Variables**
   - Go to Site Settings → Environment Variables
   - Add all required environment variables listed above
   - For `FIREBASE_ADMIN_PRIVATE_KEY`, ensure the entire key including newlines is properly formatted

4. **Deploy**
   - Push to your main branch
   - Netlify will automatically build and deploy

### Option 2: Vercel

1. **Connect Repository**
   - Import your project from GitHub on Vercel

2. **Environment Variables**
   - Add all required environment variables in the Vercel dashboard
   - Vercel will automatically detect Next.js configuration

3. **Deploy**
   - Vercel will automatically build and deploy on push

### Option 3: Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Firebase Hosting**
   ```bash
   firebase init hosting
   ```

3. **Build and Deploy**
   ```bash
   npm run build
   firebase deploy
   ```

## Security Considerations

1. **Environment Variables**
   - Never commit `.env.local` or `.env` files
   - Use `.env.example` as a template
   - Ensure server-side keys are not exposed to client

2. **Firebase Security Rules**
   - Review and update Firestore security rules
   - Ensure users can only access their own data

3. **API Keys**
   - Restrict Firebase API keys to specific domains in production
   - Monitor usage to prevent abuse

## Testing Production Build Locally

```bash
# Build the application
npm run build

# Start the production server
npm start

# Or test the production build
npm run build:production && npm start
```

## Post-Deployment Checklist

- [ ] All pages load correctly
- [ ] User authentication works
- [ ] Task creation and management functions
- [ ] Firebase data syncs properly
- [ ] Environment variables are set correctly
- [ ] No console errors in production
- [ ] Performance metrics are acceptable

## Troubleshooting

### Build Failures
- Check all environment variables are set
- Ensure Node.js version compatibility (use Node 18+)
- Review build logs for specific errors

### Authentication Issues
- Verify Firebase Auth configuration
- Check domain restrictions on Firebase API keys
- Ensure redirect URLs are whitelisted

### Database Access Issues
- Review Firestore security rules
- Check Firebase Admin SDK configuration
- Verify service account permissions

## Monitoring

- Set up error tracking (Sentry, LogRocket, etc.)
- Monitor Firebase usage and costs
- Track performance metrics
- Set up uptime monitoring

## Updates and Maintenance

- Regularly update dependencies
- Monitor Firebase SDK updates
- Keep environment variables secure and rotated
- Review and update security rules as needed