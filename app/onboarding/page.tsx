'use client';

import { useState } from 'react';
import { db } from '@/lib/instantdb';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

const AGE_RANGES = [
  { value: '0-3', label: '0-3 months', months: 2 },
  { value: '3-6', label: '3-6 months', months: 5 },
  { value: '6-9', label: '6-9 months', months: 8 },
  { value: '9-12', label: '9-12 months', months: 11 },
  { value: '12-18', label: '12-18 months', months: 15 },
  { value: '18-24', label: '18-24 months', months: 21 },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [childAgeRange, setChildAgeRange] = useState('');
  const [hasPartner, setHasPartner] = useState<boolean | null>(null);
  const [isHomeowner, setIsHomeowner] = useState<boolean | null>(null);
  const [homeType, setHomeType] = useState('');
  const [state, setState] = useState('');
  const [workSituation, setWorkSituation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { user } = db.useAuth();

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Calculate age in months from selected range
      const selectedRange = AGE_RANGES.find(r => r.value === childAgeRange);
      const ageInMonths = selectedRange?.months || 0;

      // Create or update user profile in InstantDB
      await db.transact([
        db.tx.users[user.id].update({
          id: user.id,
          email: user.email,
          name,
          onboardingCompleted: true,
          children: childAgeRange ? [{
            ageRange: childAgeRange,
            ageInMonths
          }] : [],
          hasPartner,
          state,
          isHomeowner,
          homeType,
          workSituation,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      ]);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save your profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isStepValid = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return childAgeRange !== '';
    if (step === 3) return state !== '' && isHomeowner !== null && homeType !== '';
    if (step === 4) return workSituation !== '';
    return false;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded mx-1 ${
                  s <= step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 text-center">Step {step} of 4</p>
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
              <p className="text-gray-600">Let&apos;s get to know you better.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What&apos;s your name?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Step 2: Child's age */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Family Context</h2>
              <p className="text-gray-600">This helps us personalize your experience.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How old is your child?
              </label>
              <select
                value={childAgeRange}
                onChange={(e) => setChildAgeRange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select age range...</option>
                {AGE_RANGES.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Do you have a partner?
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setHasPartner(true)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                    hasPartner === true
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setHasPartner(false)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                    hasPartner === false
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Home context */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Home Context</h2>
              <p className="text-gray-600">Help us tailor task suggestions.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What state do you live in?
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g., California, TX, NY"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Do you own or rent your home?
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsHomeowner(true)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                    isHomeowner === true
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Own
                </button>
                <button
                  type="button"
                  onClick={() => setIsHomeowner(false)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                    isHomeowner === false
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Rent
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What type of home?
              </label>
              <select
                value={homeType}
                onChange={(e) => setHomeType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select type...</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Work situation */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Work Situation</h2>
              <p className="text-gray-600">Almost done!</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What&apos;s your work situation?
              </label>
              <select
                value={workSituation}
                onChange={(e) => setWorkSituation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select...</option>
                <option value="full-time-office">Full-time (Office)</option>
                <option value="full-time-remote">Full-time (Remote)</option>
                <option value="full-time-hybrid">Full-time (Hybrid)</option>
                <option value="part-time">Part-time</option>
                <option value="stay-at-home">Stay-at-home Dad</option>
                <option value="freelance">Freelance</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex gap-4">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Back
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex-1 py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={!isStepValid() || isLoading}
              className="flex-1 py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Saving...' : "Let's Go!"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
