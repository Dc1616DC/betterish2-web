'use client';

import { useState } from 'react';
import { BoltIcon, MoonIcon, FaceSmileIcon } from '@heroicons/react/24/outline';

export default function EnergyLevelSelector({ currentLevel = 'medium', onLevelChange, compact = false }) {
  const [selectedLevel, setSelectedLevel] = useState(currentLevel);

  const energyLevels = [
    {
      id: 'low',
      name: 'Low Energy',
      icon: '😴',
      description: 'Quick 2-minute tasks only',
      iconComponent: MoonIcon,
      color: 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100',
      selectedColor: 'bg-gray-100 border-gray-400 text-gray-800',
      examples: ['Send appreciation text', 'Set coffee for morning', 'Put phone on charger']
    },
    {
      id: 'medium',
      name: 'Medium Energy',
      icon: '🙂',
      description: '5-15 minute tasks',
      iconComponent: FaceSmileIcon,
      color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
      selectedColor: 'bg-blue-100 border-blue-400 text-blue-800',
      examples: ['Prep daycare bag', 'Kitchen counter reset', 'Read bedtime story']
    },
    {
      id: 'high',
      name: 'High Energy',
      icon: '💪',
      description: '30+ minute focused tasks',
      iconComponent: BoltIcon,
      color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
      selectedColor: 'bg-green-100 border-green-400 text-green-800',
      examples: ['Deep clean bathroom', 'Meal prep for week', 'Organize garage']
    }
  ];

  const handleSelect = (levelId) => {
    setSelectedLevel(levelId);
    if (onLevelChange) {
      onLevelChange(levelId);
    }
  };

  if (compact) {
    return (
      <div className="mb-2">
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
          <span>Energy:</span>
          <div className="flex gap-1">
            {energyLevels.map((level) => {
              const isSelected = selectedLevel === level.id;
              return (
                <button
                  key={level.id}
                  onClick={() => handleSelect(level.id)}
                  className={`px-2 py-1 rounded text-xs transition-all ${
                    isSelected ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {level.icon} {level.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        How&apos;s your energy level right now?
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        {energyLevels.map((level) => {
          const isSelected = selectedLevel === level.id;
          const IconComponent = level.iconComponent;
          
          return (
            <button
              key={level.id}
              onClick={() => handleSelect(level.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                isSelected ? level.selectedColor : level.color
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl">{level.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold">{level.name}</div>
                  <div className="text-sm opacity-80">{level.description}</div>
                </div>
                <IconComponent className="w-5 h-5 opacity-60" />
              </div>
              
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                  <p className="text-xs font-medium opacity-75 mb-2">Good tasks for this energy level:</p>
                  <ul className="text-xs opacity-60 space-y-1">
                    {level.examples.map((example, index) => (
                      <li key={index}>• {example}</li>
                    ))}
                  </ul>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
