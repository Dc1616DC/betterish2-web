'use client';

import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import EnergyLevelSelector from '@/components/EnergyLevelSelector';

export default function TaskActions({
  showMoreOptions,
  onToggleRecurringForm,
  showRecurringForm,
  emergencyModeActive,
  onShowEmergencyMode,
  currentEnergyLevel,
  onEnergyLevelChange
}) {
  if (!showMoreOptions) return null;

  return (
    <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
      <button
        onClick={onToggleRecurringForm}
        className="w-full flex items-center gap-2 text-gray-700 py-2 px-3 rounded hover:bg-gray-200 transition-colors text-sm"
      >
        <ArrowPathIcon className="w-4 h-4" />
        <span>Add Recurring Task</span>
      </button>
      
      {!emergencyModeActive && (
        <button
          onClick={onShowEmergencyMode}
          className="w-full flex items-center gap-2 text-orange-700 py-2 px-3 rounded hover:bg-orange-100 transition-colors text-sm"
        >
          <ExclamationTriangleIcon className="w-4 h-4" />
          <span>Emergency Mode</span>
        </button>
      )}

      <EnergyLevelSelector
        currentLevel={currentEnergyLevel}
        onLevelChange={onEnergyLevelChange}
        compact={true}
      />
    </div>
  );
}
