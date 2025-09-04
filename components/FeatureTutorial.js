/**
 * Feature Tutorial - Interactive step-by-step guides for specific app features
 * Provides detailed walkthroughs for each major feature with hands-on examples
 */

/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ChevronRightIcon, 
  ChevronLeftIcon, 
  XMarkIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  ChatBubbleBottomCenterTextIcon,
  MicrophoneIcon,
  PlusIcon,
  HandRaisedIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

const TUTORIAL_FEATURES = {
  'voice-input': {
    title: 'Voice Input Tutorial',
    description: 'Get better-ish at adding tasks and asking questions with your voice',
    icon: MicrophoneIcon,
    steps: [
      {
        title: 'Find the Voice Button',
        content: (
          <div className="space-y-4 text-center">
            <div className="text-4xl mb-4">🎤</div>
            <p className="text-gray-700 mb-4">Look for the microphone button on your dashboard. It's located below the AI Mentor section.</p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 max-w-sm mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <MicrophoneIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-blue-800 font-medium">Voice Input</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">This powerful feature lets you quickly add tasks or ask questions without typing!</p>
          </div>
        )
      },
      {
        title: 'Adding Tasks by Voice',
        content: (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="font-semibold text-gray-800 mb-4">Try saying these examples:</h3>
            </div>
            <div className="space-y-3 max-w-lg mx-auto">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-green-800 font-medium">"Add task: Schedule dentist appointment"</p>
                <p className="text-sm text-green-700">Creates a task with that exact title</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-blue-800 font-medium">"Remind me to change HVAC filter next weekend"</p>
                <p className="text-sm text-blue-700">Smart parsing extracts the task automatically</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <p className="text-purple-800 font-medium">"I need to organize the garage and fix that squeaky door"</p>
                <p className="text-sm text-purple-700">Can extract multiple tasks from one sentence</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center mt-4">
              <strong>Pro tip:</strong> Speak naturally! The AI is smart enough to understand context.
            </p>
          </div>
        )
      },
      {
        title: 'Asking Questions with Voice',
        content: (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-4">❓</div>
              <h3 className="font-semibold text-gray-800 mb-4">Voice questions work great for:</h3>
            </div>
            <div className="space-y-3 max-w-lg mx-auto">
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-yellow-800 font-medium">"How do I fix a squeaky door hinge?"</p>
                <p className="text-sm text-yellow-700">Get step-by-step repair instructions</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <p className="text-orange-800 font-medium">"What should I do to prepare for winter?"</p>
                <p className="text-sm text-orange-700">Seasonal maintenance recommendations</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-red-800 font-medium">"My baby is 6 months old, what should I remember?"</p>
                <p className="text-sm text-red-700">Age-appropriate reminders and tips</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center mt-4">
              <strong>The result gets transcribed and answered by your AI Dad Mentor!</strong>
            </p>
          </div>
        )
      },
      {
        title: 'Voice Recording Tips',
        content: (
          <div className="space-y-4 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="font-semibold text-gray-800 mb-4">For best results:</h3>
            <div className="space-y-3 max-w-md mx-auto text-left">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Speak clearly and at normal pace</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Find a quiet space when possible</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Hold button down while speaking</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">Release button when finished</p>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 max-w-md mx-auto mt-6">
              <p className="text-blue-800 font-medium">Ready to try it out?</p>
              <p className="text-sm text-blue-700">Go back to your dashboard and give voice input a try!</p>
            </div>
          </div>
        )
      }
    ]
  },
  'project-breakdown': {
    title: 'Project Breakdown Tutorial',
    description: 'Get better-ish at breaking complex projects into manageable steps',
    icon: WrenchScrewdriverIcon,
    steps: [
      {
        title: 'Identify Project Tasks',
        content: (
          <div className="space-y-4 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-700 mb-4">Project tasks are automatically detected based on keywords and complexity.</p>
            <div className="space-y-3 max-w-lg mx-auto">
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 text-left">
                <p className="text-purple-800 font-medium mb-1">Examples of Project Tasks:</p>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• "Install closet shelving"</li>
                  <li>• "Organize garage completely"</li>
                  <li>• "Fix bathroom faucet leak"</li>
                  <li>• "Mount TV on living room wall"</li>
                </ul>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-left">
                <p className="text-gray-800 font-medium mb-1">Regular Tasks (no breakdown needed):</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• "Buy milk"</li>
                  <li>• "Call mom"</li>
                  <li>• "Take out trash"</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-gray-600">Complex projects appear in the "Active Projects" section with a purple badge.</p>
          </div>
        )
      },
      {
        title: 'Breaking Down Projects',
        content: (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="font-semibold text-gray-800 mb-4">From overwhelming to actionable:</h3>
            </div>
            <div className="max-w-lg mx-auto">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
                <p className="text-red-800 font-medium text-center">😰 "Install closet shelving" (Where do I even start?!)</p>
              </div>
              <div className="flex justify-center mb-4">
                <ChevronRightIcon className="w-6 h-6 text-blue-500" />
              </div>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded border-l-4 border-blue-400">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800">Measure closet dimensions</span>
                    <span className="text-blue-600 text-sm">5 min</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded border-l-4 border-green-400">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800">Buy shelving kit and brackets</span>
                    <span className="text-green-600 text-sm">30 min</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded border-l-4 border-purple-400">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800">Install brackets and shelves</span>
                    <span className="text-purple-600 text-sm">45 min</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded border-l-4 border-orange-400">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800">Organize items on new shelves</span>
                    <span className="text-orange-600 text-sm">20 min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: 'Using Project Steps',
        content: (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="font-semibold text-gray-800 mb-4">Check off steps as you complete them:</h3>
            </div>
            <div className="max-w-lg mx-auto">
              <div className="space-y-3">
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded border-2 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-green-800 line-through">Measure closet dimensions</span>
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-500 rounded border-2 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-green-800 line-through">Buy shelving kit and brackets</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
                    <span className="text-gray-800">Install brackets and shelves</span>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
                    <span className="text-gray-800">Organize items on new shelves</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
                <p className="text-blue-800 font-medium">Progress: 50% complete</p>
                <p className="text-sm text-blue-700">You're making great progress!</p>
              </div>
            </div>
          </div>
        )
      },
      {
        title: 'Getting Help on Steps',
        content: (
          <div className="space-y-4 text-center">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="font-semibold text-gray-800 mb-4">Stuck on a specific step?</h3>
            <div className="max-w-lg mx-auto">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-800">Install brackets and shelves</span>
                  <button className="text-purple-500">
                    <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-left">
                <p className="text-purple-800 font-medium mb-2">Click the chat icon next to any step to:</p>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Get detailed instructions for that specific step</li>
                  <li>• Ask about tools needed</li>
                  <li>• Troubleshoot problems</li>
                  <li>• Get safety tips</li>
                </ul>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-200 mt-4">
                <p className="text-green-800 text-sm">
                  <strong>Pro tip:</strong> Your AI Dad Mentor provides step-specific help tailored to your exact question!
                </p>
              </div>
            </div>
          </div>
        )
      }
    ]
  },
  'ai-dad-mentor': {
    title: 'AI Dad Mentor Tutorial',
    description: 'Get better-ish at working with your AI dad mentor and advisor',
    icon: SparklesIcon,
    steps: [
      {
        title: 'Meet Your AI Mentor',
        content: (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-semibold text-gray-800">AI Dad Mentor</h3>
                <p className="text-gray-600">Your proactive dad mentor</p>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 max-w-md mx-auto">
              <p className="text-blue-800 font-medium mb-2">Your AI Dad Mentor specializes in:</p>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                <li>• Seasonal maintenance reminders</li>
                <li>• Home improvement guidance</li>
                <li>• Dad-specific life advice</li>
                <li>• Problem-solving and troubleshooting</li>
                <li>• Relationship and family tips</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              <strong>He's not just a chatbot - he's a mentor who understands the challenges dads face.</strong>
            </p>
          </div>
        )
      },
      {
        title: 'Daily Check-ins',
        content: (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="font-semibold text-gray-800 mb-4">Get personalized daily suggestions</h3>
            </div>
            <div className="max-w-lg mx-auto">
              <div className="bg-white border rounded-lg p-4 shadow-sm mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">🧠</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium mb-2">
                      "I see it's October. Want me to help you prepare for winter?"
                    </p>
                    <div className="space-y-2 mb-3">
                      <div className="bg-orange-50 rounded-lg p-3">
                        <span className="font-medium text-orange-900">Test heating system</span>
                        <p className="text-sm text-orange-700">Just turn it on, listen for weird noises</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <span className="font-medium text-blue-900">Schedule HVAC service</span>
                        <p className="text-sm text-blue-700">Book before the rush starts</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">Yeah, add those</button>
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">Just the urgent stuff</button>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Your AI Dad Mentor proactively suggests tasks based on the season, your situation, and what matters most.
              </p>
            </div>
          </div>
        )
      },
      {
        title: 'Emergency Mode',
        content: (
          <div className="space-y-4 text-center">
            <div className="text-4xl mb-4">🚨</div>
            <h3 className="font-semibold text-gray-800 mb-4">When life gets overwhelming</h3>
            <div className="max-w-md mx-auto">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
                <p className="text-red-800 font-medium mb-2">Emergency Mode helps when:</p>
                <ul className="text-sm text-red-700 space-y-1 text-left">
                  <li>• New baby arrived</li>
                  <li>• Work is crazy busy</li>
                  <li>• Partner needs extra support</li>
                  <li>• Something broke and needs immediate attention</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-800 font-medium mb-2">Your AI Dad Mentor will:</p>
                <ul className="text-sm text-green-700 space-y-1 text-left">
                  <li>• Focus on truly urgent tasks only</li>
                  <li>• Suggest ways to take pressure off your partner</li>
                  <li>• Help prioritize what can wait</li>
                  <li>• Provide emotional support and perspective</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              <strong>You're not alone in this.</strong> Emergency mode is there for the tough times.
            </p>
          </div>
        )
      },
      {
        title: 'Best Practices for AI Chat',
        content: (
          <div className="space-y-4 text-center">
            <div className="text-4xl mb-4">💡</div>
            <h3 className="font-semibold text-gray-800 mb-4">Get the most helpful responses</h3>
            <div className="space-y-3 max-w-lg mx-auto text-left">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-green-800 font-medium">✅ Good: "My 8-month-old just started crawling. What should I baby-proof first?"</p>
                <p className="text-sm text-green-700">Specific situation, actionable advice needed</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-yellow-800 font-medium">⚠️ Okay: "How do I fix my garage door?"</p>
                <p className="text-sm text-yellow-700">Could be more specific about the problem</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-red-800 font-medium">❌ Vague: "I need help"</p>
                <p className="text-sm text-red-700">Too general - your AI Dad Mentor needs context</p>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 max-w-md mx-auto mt-4">
              <p className="text-blue-800 font-medium">Pro Tips:</p>
              <ul className="text-sm text-blue-700 space-y-1 text-left mt-2">
                <li>• Include your situation (new dad, baby age, etc.)</li>
                <li>• Describe the specific problem</li>
                <li>• Ask for actionable steps</li>
                <li>• Don't hesitate to ask follow-up questions!</li>
              </ul>
            </div>
          </div>
        )
      }
    ]
  }
};

export default function FeatureTutorial({ feature, isVisible, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const tutorialRef = useRef(null);
  
  const tutorialData = TUTORIAL_FEATURES[feature];

  // Auto-scroll to tutorial when it opens
  useEffect(() => {
    if (isVisible && tutorialRef.current) {
      tutorialRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isVisible]);

  // Reset to first step when feature changes
  useEffect(() => {
    setCurrentStep(0);
  }, [feature]);

  const nextStep = () => {
    if (currentStep < tutorialData.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark this tutorial as completed
      const completedTutorials = JSON.parse(localStorage.getItem('completedTutorials') || '[]');
      if (!completedTutorials.includes(feature)) {
        completedTutorials.push(feature);
        localStorage.setItem('completedTutorials', JSON.stringify(completedTutorials));
      }
      onComplete?.(feature);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible || !tutorialData) return null;

  const IconComponent = tutorialData.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 pb-safe-nav">
      <div ref={tutorialRef} className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-y-auto modal-with-nav">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{tutorialData.title}</h2>
              <p className="text-sm text-gray-600">{tutorialData.description}</p>
            </div>
            <span className="text-sm text-gray-500 ml-auto">Step {currentStep + 1} of {tutorialData.steps.length}</span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / tutorialData.steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            {tutorialData.steps[currentStep].title}
          </h2>
          <div className="min-h-[400px] flex items-center justify-center">
            {tutorialData.steps[currentStep].content}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50 rounded-b-xl">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentStep === 0 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
            }`}
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back
          </button>

          <div className="flex gap-2">
            {tutorialData.steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {currentStep === tutorialData.steps.length - 1 ? 'Got it!' : 'Next'}
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}