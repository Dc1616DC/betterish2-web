/**
 * useTaskForm - Hook for task form state and validation
 * Handles both create and edit scenarios with unified logic
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { TaskCategory, TaskPriority, Task } from '@/types/models';
import { CreateTaskRequest } from '@/types/api';
import { useTasks } from './useTasks';

interface FormData {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
}

interface FormErrors {
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  submit?: string;
}

interface UseTaskFormReturn {
  // Form state
  formData: FormData;
  errors: FormErrors;
  isSubmitting: boolean;
  isDirty: boolean;
  isEditing: boolean;
  isValid: boolean;
  hasChanges: boolean;

  // Form handlers
  updateField: (fieldName: keyof FormData, value: string) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (fieldName: keyof FormData, value: string) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<Task | false>;

  // Validation
  validateForm: () => boolean;
  validateField: (fieldName: keyof FormData, value: string) => void;

  // Utilities
  resetForm: () => void;
  clearErrors: () => void;
}

export function useTaskForm(
  initialTask: Task | null = null, 
  onSuccess?: ((task: Task) => void) | null
): UseTaskFormReturn {
  const { createTask, updateTask } = useTasks();
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: initialTask?.title || '',
    description: initialTask?.description || '',
    category: initialTask?.category || TaskCategory.PERSONAL,
    priority: initialTask?.priority || TaskPriority.MEDIUM
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
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

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

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
  const validateField = useCallback((fieldName: keyof FormData, value: string) => {
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

  const updateField = useCallback((fieldName: keyof FormData, value: string) => {
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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateField(name as keyof FormData, value);
    
    // Validate field on blur
    if (e.type === 'blur') {
      validateField(name as keyof FormData, value);
    }
  }, [updateField, validateField]);

  const handleSelectChange = useCallback((fieldName: keyof FormData, value: string) => {
    updateField(fieldName, value);
  }, [updateField]);

  // =============================================
  // FORM SUBMISSION
  // =============================================

  const handleSubmit = useCallback(async (e?: React.FormEvent): Promise<Task | false> => {
    if (e) {
      e.preventDefault();
    }

    if (!validateForm()) {
      return false;
    }

    setIsSubmitting(true);

    try {
      const taskData: CreateTaskRequest = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority
      };

      let result: Task;
      if (isEditing && initialTask) {
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Form submission error:', error);
      setErrors({ submit: errorMessage });
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