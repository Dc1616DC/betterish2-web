/**
 * Onboarding Questionnaire - Gather context for personalized AI recommendations
 * Collects family, home, and life situation details to make task suggestions more relevant
 */

/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState } from 'react';
import { ChevronRightIcon, ChevronLeftIcon, HomeIcon, UserGroupIcon, HeartIcon } from '@heroicons/react/24/outline';
import { TaskCategory } from '@/lib/services/TaskService';

const LIFE_AREAS = [
  { value: TaskCategory.HOUSEHOLD, label: '🏠 Household & Chores', description: 'Cleaning, organizing, daily tasks' },
  { value: TaskCategory.HOME_PROJECTS, label: '🔨 Home Projects', description: 'Repairs, improvements, DIY' },
  { value: TaskCategory.MAINTENANCE, label: '⚙️ Maintenance', description: 'HVAC, car, seasonal upkeep' },
  { value: TaskCategory.BABY, label: '👶 Kids & Baby', description: 'Childcare, school, activities' },
  { value: TaskCategory.RELATIONSHIP, label: '❤️ Relationship', description: 'Date nights, communication' },
  { value: TaskCategory.HEALTH, label: '🏥 Health & Medical', description: 'Appointments, fitness, wellness' },
  { value: TaskCategory.PERSONAL, label: '🧘 Personal Time', description: 'Hobbies, self-care, growth' },
  { value: TaskCategory.WORK, label: '💼 Work-Life Balance', description: 'Career, boundaries, productivity' }
];

export default function OnboardingQuestionnaire({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    homeOwnership: null,
    kidsCount: 0,
    kidsAges: [],
    spouseName: '',
    primaryConcerns: [],
    zipCode: ''
  });

  const questions = [
    {
      id: 'homeOwnership',
      title: 'Your Living Situation',
      subtitle: 'This helps us suggest relevant home maintenance tasks',
      icon: HomeIcon,
      content: (
        <div className="space-y-3">
          <button
            onClick={() => setAnswers({...answers, homeOwnership: 'own'})}
            className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
              answers.homeOwnership === 'own' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900">🏡 I own my home</div>
            <div className="text-sm text-gray-600 mt-1">Get reminders for property maintenance, HOA deadlines, and home improvements</div>
          </button>
          <button
            onClick={() => setAnswers({...answers, homeOwnership: 'rent'})}
            className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
              answers.homeOwnership === 'rent' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900">🏢 I rent</div>
            <div className="text-sm text-gray-600 mt-1">Focus on renter-friendly improvements and lease reminders</div>
          </button>
        </div>
      )
    },
    {
      id: 'kids',
      title: 'Your Family',
      subtitle: 'We\'ll remind you about age-appropriate activities and milestones',
      icon: UserGroupIcon,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How many kids do you have?
            </label>
            <div className="flex gap-2 flex-wrap">
              {[0, 1, 2, 3, 4, '5+'].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    const count = num === '5+' ? 5 : num;
                    setAnswers({
                      ...answers, 
                      kidsCount: count,
                      kidsAges: Array(count).fill('')
                    });
                  }}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    answers.kidsCount === (num === '5+' ? 5 : num)
                      ? 'border-blue-500 bg-blue-50 font-medium' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {answers.kidsCount > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Their ages? (This helps with age-specific reminders)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: answers.kidsCount }).map((_, i) => (
                  <input
                    key={i}
                    type="number"
                    placeholder={`Kid ${i + 1} age`}
                    value={answers.kidsAges[i] || ''}
                    onChange={(e) => {
                      const newAges = [...answers.kidsAges];
                      newAges[i] = e.target.value;
                      setAnswers({...answers, kidsAges: newAges});
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    max="25"
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Examples: Baby (0-2): sleep schedules, feeding • Toddler (3-5): preschool, potty training • School age (6-12): homework, activities
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'spouse',
      title: 'Your Partner',
      subtitle: 'Personalize relationship reminders',
      icon: HeartIcon,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Partner's name (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Sarah, Mike, Alex..."
              value={answers.spouseName}
              onChange={(e) => setAnswers({...answers, spouseName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-2">
              We'll personalize reminders like "Plan date night with {answers.spouseName || 'your partner'}" and "Ask {answers.spouseName || 'them'} about their day"
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'concerns',
      title: 'Where do you need the most support?',
      subtitle: 'Select all that apply - we\'ll prioritize these areas',
      content: (
        <div className="space-y-2">
          {LIFE_AREAS.map((area) => (
            <button
              key={area.value}
              onClick={() => {
                const concerns = answers.primaryConcerns.includes(area.value)
                  ? answers.primaryConcerns.filter(c => c !== area.value)
                  : [...answers.primaryConcerns, area.value];
                setAnswers({...answers, primaryConcerns: concerns});
              }}
              className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                answers.primaryConcerns.includes(area.value)
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{area.label}</div>
                  <div className="text-xs text-gray-600">{area.description}</div>
                </div>
                {answers.primaryConcerns.includes(area.value) && (
                  <div className="text-blue-500">✓</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )
    },
    {
      id: 'location',
      title: 'Your Location',
      subtitle: 'For seasonal and local reminders',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., 10001"
              value={answers.zipCode}
              onChange={(e) => setAnswers({...answers, zipCode: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength="5"
            />
            <p className="text-xs text-gray-500 mt-2">
              We'll remind you about seasonal tasks specific to your climate (winterize pipes in cold areas, hurricane prep in coastal regions, etc.)
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save profile and complete onboarding
      const profile = {
        ...answers,
        completedAt: new Date().toISOString(),
        // Calculate derived data
        hasYoungKids: answers.kidsAges.some(age => age <= 5),
        hasSchoolAgeKids: answers.kidsAges.some(age => age > 5 && age <= 18),
        isHomeowner: answers.homeOwnership === 'own',
        hasPartner: !!answers.spouseName
      };
      
      // Save to localStorage for now (could be Firebase later)
      localStorage.setItem('userProfile', JSON.stringify(profile));
      onComplete(profile);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentQuestion = questions[currentStep];
  const IconComponent = currentQuestion.icon;

  return (
    <div className="max-w-md mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Question {currentStep + 1} of {questions.length}</span>
          <button 
            onClick={onSkip}
            className="text-gray-500 hover:text-gray-700"
          >
            Skip all
          </button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-3 mb-4">
          {IconComponent && (
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <IconComponent className="w-5 h-5 text-blue-600" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{currentQuestion.title}</h3>
            {currentQuestion.subtitle && (
              <p className="text-sm text-gray-600 mt-1">{currentQuestion.subtitle}</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          {currentQuestion.content}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              currentStep === 0 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {currentStep === questions.length - 1 ? 'Complete Setup' : 'Next'}
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}