'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserId } from '@/types/models';
import { BaseProps } from '@/types/components';

interface UserPreferencesData {
  partnerName: string;
  childAge: string;
  homeType: 'house' | 'apartment';
  hasSetup: boolean;
}

interface UserPreferencesProps extends BaseProps {
  userId: UserId;
  onComplete: (preferences: UserPreferencesData) => void;
}

const UserPreferences: React.FC<UserPreferencesProps> = ({ 
  userId, 
  onComplete,
  className 
}) => {
  const [preferences, setPreferences] = useState<UserPreferencesData>({
    partnerName: '',
    childAge: '',
    homeType: 'house',
    hasSetup: false
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Load existing preferences
    const loadPreferences = async (): Promise<void> => {
      try {
        const userRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists() && docSnap.data()?.preferences) {
          setPreferences(docSnap.data().preferences as UserPreferencesData);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };
    
    if (userId) {
      loadPreferences();
    }
  }, [userId]);

  const handleSave = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const userRef = doc(db, 'users', userId);
      const updatedPreferences = {
        ...preferences,
        hasSetup: true
      };
      
      await updateDoc(userRef, {
        preferences: updatedPreferences
      });
      
      setLoading(false);
      onComplete(updatedPreferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setLoading(false);
    }
  };

  const handlePartnerNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setPreferences({ ...preferences, partnerName: e.target.value });
  };

  const handleChildAgeChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setPreferences({ ...preferences, childAge: e.target.value });
  };

  const handleHomeTypeChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setPreferences({ 
      ...preferences, 
      homeType: e.target.value as 'house' | 'apartment' 
    });
  };

  const handleSkip = (): void => {
    onComplete(preferences);
  };

  return (
    <div className={`max-w-md mx-auto p-4 ${className || ''}`}>
      <h2 className="text-2xl font-bold mb-6">Quick Setup</h2>
      <p className="text-gray-600 mb-6">Help us personalize your tasks</p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Partner&apos;s name (optional)
          </label>
          <input
            type="text"
            placeholder="e.g., Sarah"
            className="w-full p-3 border rounded-lg"
            value={preferences.partnerName}
            onChange={handlePartnerNameChange}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Child&apos;s age
          </label>
          <select
            className="w-full p-3 border rounded-lg"
            value={preferences.childAge}
            onChange={handleChildAgeChange}
          >
            <option value="">Select age</option>
            <option value="0-6m">0-6 months</option>
            <option value="6-12m">6-12 months</option>
            <option value="1-2y">1-2 years</option>
            <option value="2-3y">2-3 years</option>
            <option value="3-5y">3-5 years</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Home type
          </label>
          <select
            className="w-full p-3 border rounded-lg"
            value={preferences.homeType}
            onChange={handleHomeTypeChange}
          >
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
          </select>
        </div>
        
        <button
          onClick={handleSave}
          disabled={loading || !preferences.childAge}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Start Using Betterish'}
        </button>
        
        <button
          onClick={handleSkip}
          className="w-full text-gray-500 text-sm"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
};

export default UserPreferences;