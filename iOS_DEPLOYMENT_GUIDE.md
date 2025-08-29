# iOS App Store Deployment Guide for Betterish

This guide covers deploying your Next.js Betterish app to the iOS App Store using Capacitor.

## Prerequisites

- Mac with macOS (required for iOS development)
- Xcode installed from the Mac App Store
- Apple Developer Account ($99/year)
- Node.js and npm installed

## Step 1: Install Dependencies

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios
```

## Step 2: Initialize Capacitor

```bash
npx cap init "Betterish" "com.betterish.app"
```

## Step 3: Configure Next.js for Static Export

Create or update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
}

module.exports = nextConfig
```

## Step 4: Build and Add iOS Platform

```bash
# Build the Next.js app for static export
npm run build

# Add iOS platform
npx cap add ios

# Sync the web build to iOS
npx cap sync ios
```

## Step 5: Configure Capacitor

Create `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.betterish.app',
  appName: 'Betterish',
  webDir: 'out',
  bundledWebRuntime: false,
  ios: {
    scheme: 'Betterish',
    contentInset: 'automatic'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#2563eb",
      showSpinner: false
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
```

## Step 6: Open in Xcode

```bash
npx cap open ios
```

This opens your project in Xcode where you can:

1. **Set App Icons**: Add your app icons to the Assets catalog
2. **Configure App Info**: Set bundle ID, version, display name
3. **Set Permissions**: Add required permissions in Info.plist
4. **Configure Signing**: Set up your Apple Developer Team

## Step 7: Required Info.plist Permissions

Add these to your iOS project's Info.plist:

```xml
<key>NSCameraUsageDescription</key>
<string>This app uses camera for profile photos</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app uses location for location-based reminders</string>
<key>NSUserNotificationsUsageDescription</key>
<string>This app sends you helpful reminders for tasks</string>
```

## Step 8: App Store Submission

1. **Archive the App**: In Xcode, Product → Archive
2. **Upload to App Store Connect**: Use the Organizer window
3. **Fill App Store Information**: Screenshots, descriptions, keywords
4. **Submit for Review**: Apple typically takes 24-48 hours

## App Store Requirements

### Required Assets

- **App Icons**: 1024x1024 (App Store), various sizes for device
- **Screenshots**: iPhone 6.7", 6.5", 5.5" displays
- **App Description**: Under 4000 characters
- **Keywords**: Comma-separated, under 100 characters
- **Privacy Policy**: Required for all apps

### App Store Optimization (ASO)

**Primary Keywords**: dad app, family organizer, home management, productivity
**Secondary Keywords**: parenting, household tasks, AI assistant, modern father

### Suggested App Store Description

```
The Modern Father's Sidekick

Betterish helps busy dads master the juggle of home, family, and personal life. Get AI-powered guidance for household projects, relationship management, and staying on top of what matters most.

🏠 Home Management Made Simple
• Smart task suggestions for maintenance and upkeep
• Seasonal reminders so nothing gets forgotten
• Project breakdowns with step-by-step guidance

👨‍👩‍👧‍👦 Family Life Optimization  
• Emergency modes for when life gets chaotic
• Partner support tools for better teamwork
• Baby and kid milestone tracking

🤖 AI Sidekick That Gets Dad Life
• Context-aware help for any task or project
• Product recommendations and tutorial links  
• Real advice from a dad perspective

Get your life back while being the dad and partner you want to be.
```

## Testing Before Submission

1. **Device Testing**: Test on multiple iPhone models/sizes
2. **Performance**: Ensure smooth scrolling and fast loading
3. **Offline Mode**: Test PWA functionality offline
4. **Push Notifications**: Verify reminder system works
5. **Payment Flow**: Test subscription upgrades

## Common Rejection Reasons to Avoid

1. **Incomplete App Information**: Fill all required metadata
2. **Broken Functionality**: Test all features thoroughly  
3. **Poor User Experience**: Ensure responsive design
4. **Privacy Issues**: Include privacy policy and permission descriptions
5. **In-App Purchases**: Must use Apple's payment system for subscriptions

## Post-Submission

- **Monitor Status**: Check App Store Connect for review updates
- **Respond to Rejections**: Address feedback quickly
- **Plan Updates**: Regular updates improve App Store ranking
- **Track Analytics**: Monitor downloads and user feedback

## Alternative: PWA Distribution

If App Store approval is delayed, you can distribute as a PWA:
1. Users visit your website on iOS Safari
2. Tap "Add to Home Screen" 
3. App installs like a native app
4. Limited functionality but immediate distribution

This deployment strategy ensures your Betterish app reaches iOS users through the official App Store while maintaining your existing web-based architecture.