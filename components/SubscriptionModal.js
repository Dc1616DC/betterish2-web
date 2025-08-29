'use client';

import { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { SUBSCRIPTION_TIERS } from '@/lib/subscription';

export default function SubscriptionModal({ isVisible, onClose, currentTier, onUpgrade }) {
  const [selectedTier, setSelectedTier] = useState('premium');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      await onUpgrade(selectedTier);
      onClose();
    } catch (error) {
      console.error('Upgrade failed:', error);
      // TODO: Show error message
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  const premiumTier = SUBSCRIPTION_TIERS.premium;
  const familyTier = SUBSCRIPTION_TIERS.family;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Upgrade to Pro</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
          </div>

          <div className="mb-6">
            <div className="text-center mb-4">
              <div className="text-2xl mb-2">💪</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Unlock Your Dad Sidekick
              </h3>
              <p className="text-sm text-gray-600">
                Get unlimited AI help with tasks, projects, and dad life challenges
              </p>
            </div>
          </div>

          {/* Pricing Options */}
          <div className="space-y-3 mb-6">
            {/* Premium Option */}
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedTier === 'premium' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTier('premium')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{premiumTier.name}</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${premiumTier.price}
                    <span className="text-sm font-normal text-gray-500">/month</span>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedTier === 'premium' 
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-gray-300'
                }`}>
                  {selectedTier === 'premium' && (
                    <CheckIcon className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>
            </div>

            {/* Family Option */}
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedTier === 'family' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTier('family')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{familyTier.name}</span>
                    <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                      Best Value
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${familyTier.price}
                    <span className="text-sm font-normal text-gray-500">/month</span>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedTier === 'family' 
                    ? 'border-blue-500 bg-blue-500' 
                    : 'border-gray-300'
                }`}>
                  {selectedTier === 'family' && (
                    <CheckIcon className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">
              {selectedTier === 'premium' ? 'Pro Features:' : 'Family Features:'}
            </h4>
            <ul className="space-y-2">
              {SUBSCRIPTION_TIERS[selectedTier].features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  <CheckIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Processing...' : `Upgrade to ${SUBSCRIPTION_TIERS[selectedTier].name}`}
          </button>

          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>✨ Cancel anytime • No long-term commitment</p>
            <p>🔒 Secure payment • Your data stays private</p>
          </div>
        </div>
      </div>
    </div>
  );
}