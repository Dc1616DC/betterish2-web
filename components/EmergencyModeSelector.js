'use client';

import { useState } from 'react';
import { ExclamationTriangleIcon, HeartIcon, FaceSmileIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import { expandedTemplatePacks } from '@/lib/taskEngine';

export default function EmergencyModeSelector({ isVisible, onModeSelect, onClose }) {
  const [selectedMode, setSelectedMode] = useState(null);

  const emergencyModes = [
    {
      id: 'pack_004',
      name: 'Sick Kid Mode',
      icon: '🤒',
      description: 'When baby is unwell',
      iconComponent: ExclamationTriangleIcon,
      color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
    },
    {
      id: 'pack_003',
      name: 'Partner Overwhelm SOS',
      icon: '🆘',
      description: 'When she\'s drowning',
      iconComponent: HeartIcon,
      color: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
    },
    {
      id: 'pack_007',
      name: 'Chaotic Morning Save',
      icon: '☕',
      description: 'When everything\'s running late',
      iconComponent: FaceSmileIcon,
      color: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
    },
    {
      id: 'pack_010',
      name: 'Work Crunch Mode',
      icon: '💼',
      description: 'When job demands spike',
      iconComponent: BriefcaseIcon,
      color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
    }
  ];

  const handleSelectMode = (mode) => {
    const templatePack = expandedTemplatePacks.find(pack => pack.id === mode.id);
    if (templatePack) {
      onModeSelect(templatePack);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Emergency Mode</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ✕
            </button>
          </div>

          <p className="text-gray-600 mb-6 text-sm">
            Life happens. Pick the situation that matches your current chaos and get a curated task list to help you through it.
          </p>

          <div className="space-y-3">
            {emergencyModes.map((mode) => {
              const IconComponent = mode.iconComponent;
              return (
                <button
                  key={mode.id}
                  onClick={() => handleSelectMode(mode)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${mode.color}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{mode.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold">{mode.name}</div>
                      <div className="text-sm opacity-80">{mode.description}</div>
                    </div>
                    <IconComponent className="w-5 h-5 opacity-60" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              💡 <strong>Pro tip:</strong> Emergency modes replace your daily tasks with situation-specific help. You can always return to normal mode later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
