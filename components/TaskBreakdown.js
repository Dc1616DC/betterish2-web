'use client';

import { useState, useEffect, useRef } from 'react';
import { PlusIcon, XMarkIcon, CheckIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import SidekickChat from './SidekickChat';
import { trackFeatureUsage, FEATURES } from '@/lib/featureDiscovery';
import { useTasks } from '@/hooks/useTasks';

const TASK_BREAKDOWNS = {
  'Fix squeaky door hinge': [
    'Identify which hinge is squeaking',
    'Get WD-40 or 3-in-1 oil',
    'Spray hinges thoroughly', 
    'Work door back and forth',
    'Wipe excess oil with cloth'
  ],
  'Install new shower head': [
    'Remove old shower head (twist counterclockwise)',
    'Clean threads on shower arm',
    'Wrap new threads with plumber tape',
    'Hand-tighten new shower head',
    'Test for leaks'
  ],
  'Caulk around bathtub edge': [
    'Remove old caulk with scraper',
    'Clean surface with rubbing alcohol',
    'Apply painter tape for clean lines',
    'Apply new caulk in steady bead',
    'Smooth with finger, remove tape'
  ],
  'Organize garage/basement': [
    'Sort items into keep/donate/trash piles',
    'Install shelving or storage bins',
    'Group similar items together',
    'Label everything clearly',
    'Sweep/clean the space'
  ],
  'Schedule annual physical': [
    'Call doctor office for appointment',
    'Check insurance coverage',
    'Gather list of current medications',
    'Note any health concerns to discuss',
    'Add appointment to calendar'
  ],
  'Plan birthday celebration': [
    'Set date and guest list',
    'Choose venue (home or restaurant)',
    'Send invitations 2 weeks ahead',
    'Plan menu or order cake',
    'Buy decorations and gifts'
  ],
  'Schedule HVAC service': [
    'Research local HVAC companies',
    'Get quotes from 2-3 providers',
    'Check company reviews and licenses',
    'Schedule service appointment',
    'Prepare access to system'
  ]
};

export default function TaskBreakdown({ task, onSubtaskComplete, onClose }) {
  const [customSteps, setCustomSteps] = useState([]);
  const [aiSteps, setAiSteps] = useState([]);
  const [newStep, setNewStep] = useState('');
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiBreakdown, setAiBreakdown] = useState(null);
  const [showAIMentorChat, setShowAIMentorChat] = useState(false);
  const [selectedStepForHelp, setSelectedStepForHelp] = useState(null);
  const [updating, setUpdating] = useState(false);
  const breakdownRef = useRef(null);
  
  const { updateTask, convertToProject } = useTasks();

  // Auto-scroll to breakdown when it opens
  useEffect(() => {
    if (task && breakdownRef.current) {
      breakdownRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Track project breakdown usage
      const predefinedSteps = TASK_BREAKDOWNS[task.title] || [];
      trackFeatureUsage(FEATURES.PROJECT_BREAKDOWN, { 
        taskTitle: task.title,
        hasPreDefinedSteps: predefinedSteps.length > 0 
      });
    }
  }, [task]);

  const predefinedSteps = TASK_BREAKDOWNS[task.title] || [];
  const allSteps = predefinedSteps.length > 0 ? predefinedSteps : (aiSteps.length > 0 ? aiSteps : customSteps);
  
  // Initialize with existing subtasks if this is already a project
  useEffect(() => {
    if (task?.subtasks && task.subtasks.length > 0) {
      const existingSteps = task.subtasks.map(subtask => subtask.title);
      const completedIndices = new Set();
      
      task.subtasks.forEach((subtask, index) => {
        if (subtask.completed) {
          completedIndices.add(index);
        }
      });
      
      setCustomSteps(existingSteps);
      setCompletedSteps(completedIndices);
    }
  }, [task]);

  // Fetch AI breakdown when component loads and no predefined steps exist
  useEffect(() => {
    if (predefinedSteps.length === 0 && !aiBreakdown) {
      fetchAIBreakdown();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAIBreakdown = async () => {
    setLoadingAI(true);
    try {
      const response = await fetch('/api/ai-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'task-breakdown',
          action: 'break_down',
          taskTitle: task.title
        })
      });

      if (response.ok) {
        const breakdown = await response.json();
        setAiBreakdown(breakdown);
        
        // Convert AI breakdown to flat steps array
        const steps = [];
        if (breakdown.today) {
          steps.push(...breakdown.today.map(step => `${step.title} (${step.time})`));
        }
        if (breakdown.thisWeekend) {
          steps.push(...breakdown.thisWeekend.map(step => `${step.title} (${step.time})`));
        }
        if (breakdown.nextWeekend) {
          steps.push(...breakdown.nextWeekend.map(step => `${step.title} (${step.time})`));
        }
        if (breakdown.steps) {
          steps.push(...breakdown.steps.map(step => `${step.title} (${step.time})`));
        }
        
        setAiSteps(steps);
      }
    } catch (error) {
      console.error('Failed to fetch AI breakdown:', error);
    } finally {
      setLoadingAI(false);
    }
  };

  const addCustomStep = async () => {
    if (!newStep.trim() || updating) return;
    setUpdating(true);
    
    try {
      const newStepTitle = newStep.trim();
      const updatedSteps = [...customSteps, newStepTitle];
      
      // Update local state immediately
      setCustomSteps(updatedSteps);
      setNewStep('');
      
      // Save to database if task is already a project
      if (task.isProject && task.subtasks) {
        const newSubtask = {
          id: task.subtasks.length + 1,
          title: newStepTitle,
          completed: false,
          completedAt: null
        };
        
        await updateTask(task.id, {
          subtasks: [...task.subtasks, newSubtask]
        });
      }
    } catch (error) {
      console.error('Error adding custom step:', error);
      // Revert local state on error
      setCustomSteps(customSteps);
      setNewStep(newStep);
    } finally {
      setUpdating(false);
    }
  };

  const toggleStep = async (stepIndex) => {
    if (updating) return;
    setUpdating(true);
    
    try {
      const newCompleted = new Set(completedSteps);
      const wasCompleted = completedSteps.has(stepIndex);
      
      if (wasCompleted) {
        newCompleted.delete(stepIndex);
      } else {
        newCompleted.add(stepIndex);
      }
      
      // Update local state immediately for responsive UI
      setCompletedSteps(newCompleted);
      
      // Convert task to project if it's not already one, or update existing project
      if (!task.isProject) {
        // Create subtasks array from current steps
        const subtasks = allSteps.map((step, index) => ({
          id: index + 1,
          title: step,
          completed: newCompleted.has(index),
          completedAt: newCompleted.has(index) ? new Date() : null
        }));
        
        await convertToProject(task.id, subtasks);
      } else {
        // Update existing project's subtasks
        const updatedSubtasks = [...(task.subtasks || [])];
        if (updatedSubtasks[stepIndex]) {
          updatedSubtasks[stepIndex].completed = !wasCompleted;
          updatedSubtasks[stepIndex].completedAt = !wasCompleted ? new Date() : null;
          
          await updateTask(task.id, {
            subtasks: updatedSubtasks,
            lastActivityAt: new Date()
          });
        }
      }
      
      // If all steps are completed, notify parent to complete the whole project
      if (newCompleted.size === allSteps.length && allSteps.length > 0) {
        onSubtaskComplete?.(task.id);
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
      // Revert local state on error
      setCompletedSteps(completedSteps);
    } finally {
      setUpdating(false);
    }
  };

  const removeCustomStep = (stepIndex) => {
    const newSteps = customSteps.filter((_, i) => i !== stepIndex);
    setCustomSteps(newSteps);
    
    // Adjust completed steps indices
    const newCompleted = new Set();
    completedSteps.forEach(completedIndex => {
      if (completedIndex < stepIndex) {
        newCompleted.add(completedIndex);
      } else if (completedIndex > stepIndex) {
        newCompleted.add(completedIndex - 1);
      }
    });
    setCompletedSteps(newCompleted);
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 pb-safe-nav">
      <div ref={breakdownRef} className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg overflow-y-auto modal-with-nav">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Break Down Task</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <h4 className="font-medium text-blue-900 mb-1">{task.title}</h4>
          {task.detail && (
            <p className="text-sm text-blue-700">{task.detail}</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-medium text-gray-700">
              Steps to Complete ({completedSteps.size}/{allSteps.length})
            </h5>
            <div className="flex gap-2">
              {predefinedSteps.length === 0 && !loadingAI && (
                <button
                  onClick={fetchAIBreakdown}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                  title="Get AI Dad Mentor breakdown"
                >
                  🧠 Ask AI Dad Mentor
                </button>
              )}
              {allSteps.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      setSelectedStepForHelp(null);
                      setShowAIMentorChat(true);
                    }}
                    className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 flex items-center gap-1"
                    title="Get help from AI Dad Mentor"
                  >
                    <ChatBubbleBottomCenterTextIcon className="w-3 h-3" />
                    Get Help
                  </button>
                  <div className="text-sm text-gray-500">
                    {Math.round((completedSteps.size / allSteps.length) * 100)}% done
                  </div>
                </>
              )}
            </div>
          </div>

          {loadingAI && (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-blue-600 text-sm">AI Dad Mentor is breaking down this project...</p>
            </div>
          )}

          {!loadingAI && allSteps.length === 0 && predefinedSteps.length === 0 && (
            <p className="text-gray-500 text-sm py-4 text-center">
              Click &quot;🧠 Ask AI Dad Mentor&quot; above or add your own steps below.
            </p>
          )}

          {allSteps.map((step, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                completedSteps.has(index)
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <button
                onClick={() => toggleStep(index)}
                disabled={updating}
                className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors disabled:opacity-50 ${
                  completedSteps.has(index)
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-green-400'
                }`}
              >
                {completedSteps.has(index) && (
                  <CheckIcon className="w-3 h-3" />
                )}
              </button>
              
              <span
                className={`flex-grow text-sm ${
                  completedSteps.has(index)
                    ? 'text-green-800 line-through'
                    : 'text-gray-700'
                }`}
              >
                {step}
              </span>

              <button
                onClick={() => {
                  // Track step-specific help usage
                  trackFeatureUsage(FEATURES.STEP_HELP, {
                    taskTitle: task.title,
                    step: step,
                    stepIndex: index
                  });
                  
                  setSelectedStepForHelp(step);
                  setShowAIMentorChat(true);
                }}
                className="flex-shrink-0 text-purple-500 hover:text-purple-700"
                title="Get help with this step"
              >
                <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
              </button>

              {predefinedSteps.length === 0 && (
                <button
                  onClick={() => removeCustomStep(index)}
                  className="flex-shrink-0 text-gray-400 hover:text-red-500"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {predefinedSteps.length === 0 && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                placeholder="Add a step..."
                className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomStep();
                  }
                }}
              />
              <button
                onClick={addCustomStep}
                disabled={!newStep.trim() || updating}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {allSteps.length > 0 && completedSteps.size === allSteps.length && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm font-medium text-center">
              🎉 All steps completed! Great job!
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          {allSteps.length > 0 && completedSteps.size === allSteps.length && (
            <button
              onClick={() => {
                onSubtaskComplete?.(task.id);
                onClose();
              }}
              className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Mark Task Complete
            </button>
          )}
        </div>
      </div>
      
      {/* AI Dad Mentor Chat Modal */}
      {showAIMentorChat && (
        <SidekickChat
          task={{
            ...task,
            title: selectedStepForHelp 
              ? `Help with step: "${selectedStepForHelp}"` 
              : `Help with project: ${task.title}`,
            description: selectedStepForHelp 
              ? `I need help understanding how to: ${selectedStepForHelp}. This is part of the project: ${task.title}`
              : `I need help with this project: ${task.title}. Here are all the steps: ${allSteps.join(', ')}`
          }}
          isVisible={showAIMentorChat}
          onClose={() => {
            setShowAIMentorChat(false);
            setSelectedStepForHelp(null);
          }}
        />
      )}
    </div>
  );
}