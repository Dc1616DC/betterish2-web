'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function UserPreferences({ userId, onComplete }) {
  const [preferences, setPreferences] = useState({
    partnerName: '',
    childAge: '',
    homeType: 'house',
    hasSetup: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load existing preferences
    const loadPreferences = async () => {
      const userRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists() && docSnap.data().preferences) {
        setPreferences(docSnap.data().preferences);
      }
    };
    
    if (userId) {
      loadPreferences();
    }
  }, [userId]);

  const handleSave = async () => {
    setLoading(true);
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      preferences: {
        ...preferences,
        hasSetup: true
      }
    });
    
    setLoading(false);
    onComplete(preferences);
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Quick Setup</h2>
      <p className="text-gray-600 mb-6">Help us personalize your tasks</p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Partner's name (optional)
          </label>
          <input
            type="text"
            placeholder="e.g., Sarah"
            className="w-full p-3 border rounded-lg"
            value={preferences.partnerName}
            onChange={(e) => setPreferences({...preferences, partnerName: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Child's age
          </label>
          <select
            className="w-full p-3 border rounded-lg"
            value={preferences.childAge}
            onChange={(e) => setPreferences({...preferences, childAge: e.target.value})}
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
            onChange={(e) => setPreferences({...preferences, homeType: e.target.value})}
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
          onClick={() => onComplete(preferences)}
          className="w-full text-gray-500 text-sm"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}