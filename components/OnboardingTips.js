/**
 * Onboarding Tips - Progressive daily tips for first week of app usage
 * Shows contextual tips to help users discover features over their first week
 */

'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  SparklesIcon,
  MicrophoneIcon,
  WrenchScrewdriverIcon,
  ChatBubbleBottomCenterTextIcon,
  HandRaisedIcon,
  LightBulbIcon,
  HeartIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const ONBOARDING_TIPS = {
  day1: {
    title: "Welcome to Betterish! 👋",
    content: "You've just joined thousands of dads getting better-ish at life. Start by adding your first task - maybe something that's been nagging at you? Don't worry, tasks stick around for 3-7 days so you have time to tackle them.",
    action: "Add your first task",
    actionType: "highlight-add-task",
    icon: HandRaisedIcon,
    color: "blue"
  },
  day2: {
    title: "Meet Morpheus - Your AI Dad Mentor 🧠",
    content: "That blue card below? That's Morpheus, your AI mentor. He gives personalized advice based on the season, your tasks, and what matters most to dads. Try asking him something!",
    action: "Chat with Morpheus",
    actionType: "highlight-morpheus",
    icon: SparklesIcon,
    color: "purple"
  },
  day3: {
    title: "Voice Input Makes Everything Faster 🎤",
    content: "Tired of typing? Use voice input to quickly add tasks or ask questions. Just hold the microphone button and speak naturally - 'Remind me to change the air filter this weekend.'",
    action: "Try voice input",
    actionType: "highlight-voice",
    icon: MicrophoneIcon,
    color: "green"
  },
  day4: {
    title: "Break Down Big Projects 🔨",
    content: "Got a project that feels overwhelming? Betterish automatically detects complex tasks and helps break them into manageable steps. Look for the purple 'Project' badges!",
    action: "View project breakdown",
    actionType: "highlight-projects",
    icon: WrenchScrewdriverIcon,
    color: "purple"
  },
  day5: {
    title: "Get Help on Specific Steps 💬",
    content: "Stuck on a project step? Click the chat icon next to any step to get specific help from Morpheus. He'll give you detailed instructions, tool recommendations, and safety tips.",
    action: "Try step-specific help",
    actionType: "highlight-step-help",
    icon: ChatBubbleBottomCenterTextIcon,
    color: "indigo"
  },
  day6: {
    title: "Categories Keep You Organized 📋",
    content: "Notice how your tasks are organized by categories? This helps you batch similar activities together. Home projects on Saturday, relationship tasks on Sunday evening, etc. Tasks stay active for 3-7 days based on category before moving to loose ends.",
    action: "Review your categories",
    actionType: "highlight-categories",
    icon: ClockIcon,
    color: "yellow"
  },
  day7: {
    title: "You're Getting Better-ish! 🎉",
    content: "A week in, and you're already more proactive than most dads. Remember: it's not about being perfect - it's about being better-ish. Keep using Morpheus and breaking down those projects. You've got this!",
    action: "Keep being better-ish!",
    actionType: "celebrate",
    icon: HeartIcon,
    color: "pink"
  }
};

export default function OnboardingTips({ onTutorialRequest }) {
  const [currentTip, setCurrentTip] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user is in their first week
    const accountCreated = localStorage.getItem('accountCreated');
    const dismissedTips = JSON.parse(localStorage.getItem('dismissedOnboardingTips') || '[]');
    
    if (!accountCreated) {
      // Set account creation date for new users
      localStorage.setItem('accountCreated', new Date().toISOString());
    }

    const createdDate = new Date(accountCreated || new Date());
    const daysSinceCreated = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));
    
    // Show tips for first 7 days
    if (daysSinceCreated < 7) {
      const tipKey = `day${Math.max(1, daysSinceCreated + 1)}`;
      const tipData = ONBOARDING_TIPS[tipKey];
      
      if (tipData && !dismissedTips.includes(tipKey)) {
        setCurrentTip({ key: tipKey, ...tipData });
      }
    }
  }, []);

  const dismissTip = (learnMore = false) => {
    if (!currentTip) return;

    // Mark tip as dismissed
    const dismissedTips = JSON.parse(localStorage.getItem('dismissedOnboardingTips') || '[]');
    dismissedTips.push(currentTip.key);
    localStorage.setItem('dismissedOnboardingTips', JSON.stringify(dismissedTips));
    
    // Track feature discovery
    const discoveredFeatures = JSON.parse(localStorage.getItem('discoveredFeatures') || '[]');
    const featureMap = {
      'highlight-add-task': 'task-creation',
      'highlight-morpheus': 'morpheus-chat',
      'highlight-voice': 'voice-input',
      'highlight-projects': 'project-breakdown',
      'highlight-step-help': 'step-help',
      'highlight-categories': 'task-categories'
    };
    
    const featureName = featureMap[currentTip.actionType];
    if (featureName && !discoveredFeatures.includes(featureName)) {
      discoveredFeatures.push(featureName);
      localStorage.setItem('discoveredFeatures', JSON.stringify(discoveredFeatures));
    }

    if (learnMore) {
      // Request appropriate tutorial based on tip
      const tutorialMap = {
        'highlight-morpheus': 'morpheus-chat',
        'highlight-voice': 'voice-input',
        'highlight-projects': 'project-breakdown',
        'highlight-step-help': 'project-breakdown'
      };
      
      const tutorialType = tutorialMap[currentTip.actionType];
      if (tutorialType && onTutorialRequest) {
        onTutorialRequest(tutorialType);
      }
    }
    
    setDismissed(true);
    setTimeout(() => setCurrentTip(null), 300);
  };

  if (!currentTip || dismissed) return null;

  const IconComponent = currentTip.icon;
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    pink: 'bg-pink-50 border-pink-200 text-pink-800'
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    indigo: 'text-indigo-600',
    yellow: 'text-yellow-600',
    pink: 'text-pink-600'
  };

  const buttonColorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    green: 'bg-green-600 hover:bg-green-700',
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    yellow: 'bg-yellow-600 hover:bg-yellow-700',
    pink: 'bg-pink-600 hover:bg-pink-700'
  };

  return (
    <div className={`mx-auto max-w-md px-6 pb-4 ${dismissed ? 'opacity-0 transition-opacity duration-300' : ''}`}>
      <div className={`relative p-4 rounded-xl border-2 shadow-sm ${colorClasses[currentTip.color]}`}>
        {/* Dismiss button */}
        <button
          onClick={() => dismissTip(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`flex-shrink-0 ${iconColorClasses[currentTip.color]}`}>
            <IconComponent className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">{currentTip.title}</h3>
            <p className="text-sm leading-relaxed">{currentTip.content}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 ml-9">
          {currentTip.actionType !== 'celebrate' ? (
            <>
              <button
                onClick={() => dismissTip(true)}
                className={`px-3 py-1.5 text-white rounded-lg text-sm font-medium transition-colors ${buttonColorClasses[currentTip.color]}`}
              >
                {currentTip.action}
              </button>
              <button
                onClick={() => dismissTip(false)}
                className="px-3 py-1.5 bg-white text-gray-700 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Got it
              </button>
            </>
          ) : (
            <button
              onClick={() => dismissTip(false)}
              className={`px-4 py-1.5 text-white rounded-lg text-sm font-medium transition-colors ${buttonColorClasses[currentTip.color]}`}
            >
              {currentTip.action}
            </button>
          )}
        </div>

        {/* Progress indicator */}
        <div className="mt-3 ml-9">
          <div className="flex items-center gap-1">
            <span className="text-xs opacity-70">Day {currentTip.key.replace('day', '')} of 7</span>
            <div className="flex gap-1 ml-2">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <div
                  key={day}
                  className={`w-1 h-1 rounded-full ${
                    day <= parseInt(currentTip.key.replace('day', '')) ? 'bg-current opacity-70' : 'bg-current opacity-20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}