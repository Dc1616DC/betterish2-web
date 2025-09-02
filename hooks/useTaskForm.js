/**
 * useTaskForm - Hook for task form state and validation
 * Handles both create and edit scenarios with unified logic
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { TaskCategory, TaskPriority } from '@/lib/services/TaskService';
import { useTasks } from './useTasks';

export function useTaskForm(initialTask = null, onSuccess = null) {
  const { createTask, updateTask } = useTasks();
  
  // Form state
  const [formData, setFormData] = useState({
    title: initialTask?.title || '',
    description: initialTask?.description || '',
    category: initialTask?.category || TaskCategory.PERSONAL,
    priority: initialTask?.priority || TaskPriority.MEDIUM
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // Track if we're editing
  const isEditing = Boolean(initialTask?.id);
  
  // Update form when initialTask changes
  useEffect(() => {
    if (initialTask) {
      setFormData({
        title: initialTask.title || '',
        description: initialTask.description || '',
        category: initialTask.category || TaskCategory.PERSONAL,
        priority: initialTask.priority || TaskPriority.MEDIUM
      });
      setIsDirty(false);
    }
  }, [initialTask]);

  // =============================================
  // VALIDATION
  // =============================================

  const validateForm = useCallback(() => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Task title must be less than 100 characters';
    }

    // Description validation
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    // Category validation
    if (!Object.values(TaskCategory).includes(formData.category)) {
      newErrors.category = 'Invalid category selected';
    }

    // Priority validation  
    if (!Object.values(TaskPriority).includes(formData.priority)) {
      newErrors.priority = 'Invalid priority selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Real-time field validation
  const validateField = useCallback((fieldName, value) => {
    const fieldErrors = { ...errors };

    switch (fieldName) {
      case 'title':
        if (!value.trim()) {
          fieldErrors.title = 'Task title is required';
        } else if (value.trim().length > 100) {
          fieldErrors.title = 'Task title must be less than 100 characters';
        } else {
          delete fieldErrors.title;
        }
        break;
        
      case 'description':
        if (value && value.length > 500) {
          fieldErrors.description = 'Description must be less than 500 characters';
        } else {
          delete fieldErrors.description;
        }
        break;
    }

    setErrors(fieldErrors);
  }, [errors]);

  // =============================================
  // FORM HANDLERS
  // =============================================

  const updateField = useCallback((fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    setIsDirty(true);
    
    // Clear field error on change
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  }, [errors]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    updateField(name, value);
    
    // Validate field on blur
    if (e.type === 'blur') {
      validateField(name, value);
    }
  }, [updateField, validateField]);

  const handleSelectChange = useCallback((fieldName, value) => {
    updateField(fieldName, value);
  }, [updateField]);

  // =============================================
  // FORM SUBMISSION
  // =============================================

  const handleSubmit = useCallback(async (e) => {
    if (e) {
      e.preventDefault();
    }

    if (!validateForm()) {
      return false;
    }

    setIsSubmitting(true);

    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority
      };

      let result;
      if (isEditing) {
        result = await updateTask(initialTask.id, taskData);
      } else {
        result = await createTask(taskData);
      }

      // Reset form on successful create (but not edit)
      if (!isEditing) {
        setFormData({
          title: '',
          description: '',
          category: TaskCategory.PERSONAL,
          priority: TaskPriority.MEDIUM
        });
        setIsDirty(false);
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ submit: error.message });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, isEditing, initialTask, updateTask, createTask, onSuccess]);

  // =============================================
  // FORM UTILITIES
  // =============================================

  const resetForm = useCallback(() => {
    if (initialTask) {
      setFormData({
        title: initialTask.title || '',
        description: initialTask.description || '',
        category: initialTask.category || TaskCategory.PERSONAL,
        priority: initialTask.priority || TaskPriority.MEDIUM
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: TaskCategory.PERSONAL,
        priority: TaskPriority.MEDIUM
      });
    }
    setErrors({});
    setIsDirty(false);
  }, [initialTask]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0 && formData.title.trim().length > 0;
  
  // Check if form has changes
  const hasChanges = isEditing ? isDirty : formData.title.trim().length > 0;

  return {
    // Form state
    formData,
    errors,
    isSubmitting,
    isDirty,
    isEditing,
    isValid,
    hasChanges,

    // Form handlers
    updateField,
    handleInputChange,
    handleSelectChange,
    handleSubmit,

    // Validation
    validateForm,
    validateField,

    // Utilities
    resetForm,
    clearErrors
  };
}

export default useTaskForm;