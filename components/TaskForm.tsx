'use client';

import React, { useEffect } from 'react';
import { useTaskForm } from '@/hooks/useTaskForm';
import { TaskCategory, TaskPriority } from '@/types/models';
import { TaskFormProps } from '@/types/components';
import { trackFeatureUsage, FEATURES } from '@/lib/featureDiscovery';

const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  onClose,
  initialTask = null,
  mode = 'create',
  defaultCategory,
  defaultPriority,
  showAdvancedOptions = false,
  onSubmit,
  onCancel,
  className,
  children,
  'data-testid': testId
}) => {
  const {
    formData,
    errors,
    isSubmitting,
    isEditing,
    isValid,
    hasChanges,
    updateField,
    handleInputChange,
    handleSelectChange,
    handleSubmit,
    resetForm,
    clearErrors
  } = useTaskForm(initialTask, async (result) => {
    // Success callback - close form
    if (onSubmit) {
      await onSubmit(result);
    }
    onClose();
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      clearErrors();
      if (!initialTask) {
        resetForm();
      }
    }
  }, [isOpen, initialTask, clearErrors, resetForm]);

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Track task creation
    trackFeatureUsage(FEATURES.TASK_CREATION, { 
      method: 'form',
      category: formData.category,
      priority: formData.priority,
      isEditing 
    });
    
    const result = await handleSubmit(e);
    // Form will be closed by success callback
  };

  const handleClose = () => {
    if (!isSubmitting) {
      clearErrors();
      if (!isEditing) {
        resetForm();
      }
      if (onCancel) {
        onCancel();
      }
      onClose();
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleSelectChange('category', e.target.value);
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleSelectChange('priority', e.target.value);
  };

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 pb-safe-nav ${className || ''}`}
      data-testid={testId}
    >
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md modal-with-nav">
        <h3 className="font-semibold text-gray-800 mb-4">
          {isEditing ? 'Edit Task' : 'Add New Task'}
        </h3>
        
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-800 text-sm">{errors.submit}</p>
          </div>
        )}
        
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <input
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              type="text"
              name="title"
              placeholder="What needs to be done?"
              value={formData.title || ''}
              onChange={handleInputChange}
              onBlur={handleInputChange}
              autoFocus
              disabled={isSubmitting}
              maxLength={100}
              required
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title}</p>
            )}
          </div>
          
          <div>
            <textarea
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              rows={3}
              name="description"
              placeholder="Any details? (optional)"
              value={formData.description || ''}
              onChange={handleInputChange}
              onBlur={handleInputChange}
              disabled={isSubmitting}
              maxLength={500}
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {(formData.description || '').length}/500 characters
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.category ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                value={formData.category || defaultCategory || TaskCategory.PERSONAL}
                onChange={handleCategoryChange}
                disabled={isSubmitting}
              >
                <option value={TaskCategory.PERSONAL}>🧘 Personal Time</option>
                <option value={TaskCategory.HOUSEHOLD}>🏠 Household</option>
                <option value={TaskCategory.HOME_PROJECTS}>🔨 Home Projects</option>
                <option value={TaskCategory.BABY}>👶 Kids & Baby</option>
                <option value={TaskCategory.RELATIONSHIP}>❤️ Relationship</option>
                <option value={TaskCategory.HEALTH}>🏥 Health & Medical</option>
                <option value={TaskCategory.EVENTS}>🎉 Events & Celebrations</option>
                <option value={TaskCategory.MAINTENANCE}>⚙️ Maintenance & Annual</option>
                <option value={TaskCategory.WORK}>💼 Work</option>
              </select>
              {errors.category && (
                <p className="text-red-600 text-sm mt-1">{errors.category}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.priority ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                value={formData.priority || defaultPriority || TaskPriority.MEDIUM}
                onChange={handlePriorityChange}
                disabled={isSubmitting}
              >
                <option value={TaskPriority.LOW}>🟢 Low</option>
                <option value={TaskPriority.MEDIUM}>🟡 Medium</option>
                <option value={TaskPriority.HIGH}>🔴 High</option>
              </select>
              {errors.priority && (
                <p className="text-red-600 text-sm mt-1">{errors.priority}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>{isEditing ? 'Updating...' : 'Adding...'}</span>
                </>
              ) : (
                isEditing ? 'Update Task' : 'Add Task'
              )}
            </button>
          </div>
        </form>
        
        {children}
      </div>
    </div>
  );
};

export default TaskForm;