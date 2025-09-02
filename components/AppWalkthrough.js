/**
 * App Walkthrough - Engaging introduction to Betterish
 * Speaks directly to overwhelmed dads about real pain points and solutions
 */

/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState } from 'react';
import { 
  ChevronRightIcon, 
  ChevronLeftIcon, 
  XMarkIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  HeartIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function AppWalkthrough({ isVisible, onClose, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Sound familiar?",
      content: (
        <div className="text-center space-y-4">
          <div className="text-4xl mb-4">😰</div>
          <div className="space-y-3 text-left max-w-md mx-auto">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700">&quot;It&apos;s October. Did I test the heating system? When&apos;s the last time I changed the HVAC filter?&quot;</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700">&quot;My partner is handling everything. I want to help but I&apos;m always forgetting something important.&quot;</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700">&quot;That garage project has been nagging at me for months. Where do I even start?&quot;</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-6 italic">If this sounds like your inner voice, you're not alone.</p>
        </div>
      )
    },
    {
      title: "This isn't about productivity",
      content: (
        <div className="text-center space-y-4">
          <div className="text-4xl mb-4">🛡️</div>
          <h3 className="text-xl font-semibold text-gray-800">It's about disaster prevention</h3>
          <div className="space-y-4 text-left max-w-lg mx-auto">
            <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
              <p className="font-medium text-red-800">Without proactive maintenance:</p>
              <ul className="mt-2 space-y-1 text-red-700 text-sm">
                <li>• HVAC dies mid-winter ($3,000+ repair)</li>
                <li>• Partner burns out from handling everything</li>
                <li>• Small problems become expensive emergencies</li>
                <li>• You're always playing catch-up, never ahead</li>
              </ul>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
              <p className="font-medium text-green-800">With Betterish:</p>
              <ul className="mt-2 space-y-1 text-green-700 text-sm">
                <li>• Get reminded BEFORE things break</li>
                <li>• Take pressure off your partner</li>
                <li>• Be the proactive guy, not the reactive one</li>
                <li>• Small actions prevent big problems</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Meet Morpheus",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-800">Morpheus</h3>
              <p className="text-sm text-gray-600">Named after the wise guide from The Matrix, he shows you patterns you've been missing</p>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">🧠</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-900 font-medium mb-2">
                  "What if I told you... there are patterns you can see before disaster strikes? Here's what needs to happen before winter hits:"
                </p>
                <div className="space-y-2 mb-3">
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-orange-900">Test heating system</span>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Seasonal</span>
                    </div>
                    <p className="text-sm text-orange-700">Just turn it on for 5 minutes, listen for weird noises</p>
                    <p className="text-xs text-orange-600 mt-1">Prevents: $3,000+ emergency repair</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <span className="font-medium text-blue-900">Schedule HVAC service</span>
                    <p className="text-sm text-blue-700">Book now for October appointment</p>
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
            <strong>There's a difference between knowing what needs to be done and actually doing it.</strong> Morpheus shows you both.
          </p>
        </div>
      )
    },
    {
      title: "Break down overwhelming projects",
      content: (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <WrenchScrewdriverIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-800">Projects that actually get done</h3>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 font-medium mb-2">You think: <span className="text-red-600">"Clean the garage" (overwhelming!)</span></p>
          </div>

          <div className="flex justify-center">
            <ChevronRightIcon className="w-6 h-6 text-blue-500" />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 font-medium mb-3">AI breaks it down:</p>
            <div className="space-y-2">
              <div className="bg-white p-3 rounded border-l-4 border-blue-400">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">This Saturday: Clear one wall</span>
                  <span className="text-blue-600 text-sm">30 min</span>
                </div>
              </div>
              <div className="bg-white p-3 rounded border-l-4 border-green-400">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">Next weekend: Sort & donate</span>
                  <span className="text-green-600 text-sm">45 min</span>
                </div>
              </div>
              <div className="bg-white p-3 rounded border-l-4 border-purple-400">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">Following weekend: Organize & enjoy</span>
                  <span className="text-purple-600 text-sm">1 hour</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 text-center">
            <strong>What if I told you that overwhelming project is just code waiting to be decoded?</strong> Morpheus breaks it down.
          </p>
        </div>
      )
    },
    {
      title: "Carry the invisible load",
      content: (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">👶</div>
            <h3 className="font-semibold text-gray-800">New dad? She's managing everything baby-related</h3>
            <p className="text-sm text-gray-600">Time to step up and share the mental load</p>
          </div>

          <div className="space-y-3">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-yellow-800">Schedule baby's 6-month checkup</p>
                  <p className="text-sm text-yellow-700">She's been tracking this for weeks - you book it</p>
                  <p className="text-xs text-yellow-600 mt-1">Age: 5-6 months</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-green-800">Restock diapers before you run out</p>
                  <p className="text-sm text-green-700">She always notices first - beat her to it</p>
                  <p className="text-xs text-green-600 mt-1">Age: 0-24 months</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-purple-800">Baby-proof the stairs</p>
                  <p className="text-sm text-purple-700">They're almost crawling - get ahead of it</p>
                  <p className="text-xs text-purple-600 mt-1">Age: 6-9 months</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 text-center">
            <strong>She's been thinking about all of this.</strong> Now you can too.
          </p>
        </div>
      )
    },
    {
      title: "Be the partner she needs",
      content: (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <HeartIcon className="w-12 h-12 text-pink-500 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-800">Relationship disaster prevention</h3>
          </div>

          <div className="space-y-3">
            <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-pink-800">Ask about her day first</p>
                  <p className="text-sm text-pink-700">Before talking about yours - she feels seen</p>
                  <p className="text-xs text-pink-600 mt-1">Prevents: Roommate syndrome</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-purple-800">Give her 1 hour alone this Saturday</p>
                  <p className="text-sm text-purple-700">Take kids out - she needs space to breathe</p>
                  <p className="text-xs text-purple-600 mt-1">Prevents: Partner burnout</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-blue-800">Plan something for next week</p>
                  <p className="text-sm text-blue-700">Date, family activity, anything to look forward to</p>
                  <p className="text-xs text-blue-600 mt-1">Prevents: Relationship drift</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 text-center">
            <strong>Small actions, huge impact.</strong> Be proactive with what matters most.
          </p>
        </div>
      )
    },
    {
      title: "Ready to get ahead of life?",
      content: (
        <div className="text-center space-y-6">
          <div className="text-4xl mb-4">🚀</div>
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">You'll have:</h3>
            
            <div className="grid gap-4 max-w-md mx-auto">
              <div className="flex items-center gap-3 text-left">
                <ClockIcon className="w-6 h-6 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">Seasonal awareness that prevents problems</span>
              </div>
              
              <div className="flex items-center gap-3 text-left">
                <WrenchScrewdriverIcon className="w-6 h-6 text-blue-500 flex-shrink-0" />
                <span className="text-gray-700">Big projects broken into weekend chunks</span>
              </div>
              
              <div className="flex items-center gap-3 text-left">
                <HeartIcon className="w-6 h-6 text-pink-500 flex-shrink-0" />
                <span className="text-gray-700">A happier, less burned-out partner</span>
              </div>
              
              <div className="flex items-center gap-3 text-left">
                <SparklesIcon className="w-6 h-6 text-purple-500 flex-shrink-0" />
                <span className="text-gray-700">That feeling of being ahead, not behind</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200 max-w-md mx-auto">
            <p className="text-green-800 font-medium">
              "Finally, someone who gets it. This isn't about being perfect - it's about being proactive where it counts."
            </p>
            <p className="text-sm text-green-600 mt-1">- Every dad who's tried this</p>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-800">Welcome to Betterish</h2>
            <span className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}</span>
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
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            {steps[currentStep].title}
          </h2>
          <div className="min-h-[400px] flex items-center justify-center">
            {steps[currentStep].content}
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
            {steps.map((_, index) => (
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
            {currentStep === steps.length - 1 ? "Let's do this!" : 'Next'}
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}