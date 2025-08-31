import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    chatLimit: 3,
    features: ['Basic task management', 'Emergency modes', '3 AI chats per month']
  },
  premium: {
    name: 'Betterish Pro',
    price: 9.99,
    chatLimit: 100,
    features: [
      'Unlimited AI sidekick chat',
      'Advanced project breakdowns',
      'Progress insights',
      'Custom emergency modes',
      'Priority support'
    ]
  },
  family: {
    name: 'Betterish Family',
    price: 14.99,
    chatLimit: 150,
    features: [
      'Everything in Pro',
      'Shared family dashboard',
      'Multiple home profiles',
      'Family calendar integration',
      'Kid milestone tracking'
    ]
  }
};

// Get user's subscription status
export async function getUserSubscription(userId) {
  try {
    const subRef = doc(db, 'subscriptions', userId);
    const subDoc = await getDoc(subRef);
    
    if (!subDoc.exists()) {
      // Create default free subscription
      const freeSubscription = {
        userId,
        tier: 'free',
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      await setDoc(subRef, freeSubscription);
      return freeSubscription;
    }
    
    const subscription = subDoc.data();
    
    // Check if premium subscription has expired
    if (subscription.tier !== 'free' && subscription.expiresAt) {
      const now = new Date();
      const expiresAt = subscription.expiresAt.toDate();
      
      if (now > expiresAt) {
        // Downgrade to free
        const expiredSubscription = {
          ...subscription,
          tier: 'free',
          status: 'expired',
          updatedAt: Timestamp.now()
        };
        
        await updateDoc(subRef, expiredSubscription);
        return expiredSubscription;
      }
    }
    
    return subscription;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return { tier: 'free', status: 'active' };
  }
}

// Get monthly chat usage
export async function getMonthlyUsage(userId) {
  try {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const usageRef = doc(db, 'chatUsage', `${userId}_${monthKey}`);
    const usageDoc = await getDoc(usageRef);
    
    return usageDoc.exists() ? usageDoc.data().count || 0 : 0;
  } catch (error) {
    console.error('Error getting monthly usage:', error);
    return 0;
  }
}

// Increment chat usage
export async function incrementChatUsage(userId) {
  try {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const usageRef = doc(db, 'chatUsage', `${userId}_${monthKey}`);
    const usageDoc = await getDoc(usageRef);
    
    if (usageDoc.exists()) {
      await updateDoc(usageRef, {
        count: (usageDoc.data().count || 0) + 1,
        lastUsed: Timestamp.now()
      });
    } else {
      await setDoc(usageRef, {
        userId,
        monthKey,
        count: 1,
        createdAt: Timestamp.now(),
        lastUsed: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error incrementing chat usage:', error);
  }
}

// Check if user can use chat
export async function canUseChat(userId, userTier) {
  // Development/testing mode - unlimited access
  if (process.env.NODE_ENV === 'development' || process.env.UNLIMITED_TESTING === 'true') {
    return { allowed: true, remaining: 'unlimited' };
  }
  
  if (userTier === 'premium' || userTier === 'family') {
    return { allowed: true, remaining: 'unlimited' };
  }
  
  const usage = await getMonthlyUsage(userId);
  const limit = SUBSCRIPTION_TIERS.free.chatLimit;
  
  return {
    allowed: usage < limit,
    remaining: Math.max(0, limit - usage),
    used: usage,
    limit
  };
}

// Create premium subscription (mock for now - would integrate with Stripe/Apple Pay)
export async function createPremiumSubscription(userId, tier = 'premium') {
  try {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now
    
    const subscription = {
      userId,
      tier,
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      // In production, would include:
      // stripeSubscriptionId, appleTransactionId, etc.
    };
    
    const subRef = doc(db, 'subscriptions', userId);
    await setDoc(subRef, subscription);
    
    return subscription;
  } catch (error) {
    console.error('Error creating premium subscription:', error);
    throw error;
  }
}

// Cancel subscription
export async function cancelSubscription(userId) {
  try {
    const subRef = doc(db, 'subscriptions', userId);
    await updateDoc(subRef, {
      status: 'cancelled',
      cancelledAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}