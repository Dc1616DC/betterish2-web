/**
 * Component Props Types for Betterish Application
 * 
 * Defines prop interfaces for React components.
 * Ensures type safety for component communication and helps with IDE autocomplete.
 */

import { ReactNode, MouseEvent, ChangeEvent, FormEvent } from 'react';
import { Task, TaskId, UserId, User, TaskCategory, TaskPriority, TaskStatus } from './models';

// =============================================
// BASIC PROP TYPES
// =============================================

export interface BaseProps {
  className?: string;
  children?: ReactNode;
  'data-testid'?: string;
}

export interface LoadingProps {
  loading?: boolean;
  loadingText?: string;
}

export interface ErrorProps {
  error?: string | null;
  onRetry?: () => void;
}

// =============================================
// TASK COMPONENT PROPS
// =============================================

export interface TaskCardProps extends BaseProps {
  task: Task;
  isFirst?: boolean;
  showActions?: boolean;
  
  // Event handlers
  onComplete: (taskId: TaskId) => void;
  onUndo?: (taskId: TaskId) => void;
  onDismiss?: (taskId: TaskId) => void;
  onSnooze?: (taskId: TaskId, until: Date) => void;
  onSetReminder?: (taskId: TaskId, reminderType: 'morning' | 'evening' | 'custom') => Promise<void>;
  onOpenChat?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: TaskId) => void;
  
  // Additional props
  functions?: any; // Firebase functions - will be typed later
  user?: User | null;
  userTier?: 'free' | 'premium' | 'family';
}

export interface TaskFormProps extends BaseProps {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: Task | null;
  mode?: 'create' | 'edit';
  
  // Form-specific options
  defaultCategory?: TaskCategory;
  defaultPriority?: TaskPriority;
  showAdvancedOptions?: boolean;
  
  // Event handlers
  onSubmit?: (task: Partial<Task>) => Promise<void>;
  onCancel?: () => void;
}

export interface TaskBreakdownProps extends BaseProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onConvert?: (taskId: TaskId, subtasks: string[]) => Promise<void>;
  onUpdateSubtask?: (taskId: TaskId, subtaskId: number, completed: boolean) => Promise<void>;
  
  // Additional features
  showAiSuggestions?: boolean;
  allowManualEdit?: boolean;
}

export interface TaskListProps extends BaseProps, LoadingProps, ErrorProps {
  tasks: Task[];
  title?: string;
  emptyMessage?: string;
  maxHeight?: string;
  
  // Task actions
  onTaskComplete: (taskId: TaskId) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (taskId: TaskId) => void;
  onTaskSnooze?: (taskId: TaskId, until: Date) => void;
  
  // List features
  showSearch?: boolean;
  showFilters?: boolean;
  allowReorder?: boolean;
  
  // User context
  user?: User | null;
  userTier?: string;
}

export interface ProjectCardProps extends BaseProps {
  project: Task; // Task with isProject: true
  onComplete: (taskId: TaskId) => void;
  onToggleSubtask: (projectId: TaskId, subtaskId: number) => void;
  onEditProject?: (project: Task) => void;
  onDeleteProject?: (projectId: TaskId) => void;
  
  // Display options
  showProgress?: boolean;
  showSubtasks?: boolean;
  expandable?: boolean;
}

// =============================================
// NAVIGATION COMPONENTS
// =============================================

export interface BottomNavProps extends BaseProps {
  currentPath: string;
  user?: User | null;
  
  // Navigation items
  showBadges?: boolean;
  badgeCounts?: {
    dashboard?: number;
    browse?: number;
    profile?: number;
  };
}

export interface MobileHeaderProps extends BaseProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showSettings?: boolean;
  showNotifications?: boolean;
  
  // Event handlers
  onBack?: () => void;
  onSettings?: () => void;
  onNotifications?: () => void;
  
  // Additional features
  notificationCount?: number;
  actions?: {
    icon: ReactNode;
    label: string;
    onClick: () => void;
  }[];
}

// =============================================
// FORM COMPONENTS
// =============================================

export interface InputProps extends BaseProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: ChangeEvent<HTMLInputElement>) => void;
  
  // Input attributes
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  
  // Validation
  error?: string;
  success?: boolean;
  
  // Styling
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'underline';
}

export interface TextAreaProps extends BaseProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  
  // Textarea attributes
  rows?: number;
  cols?: number;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
  
  // Validation
  error?: string;
  success?: boolean;
}

export interface SelectProps extends BaseProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  
  // Options
  options: {
    value: string;
    label: string;
    disabled?: boolean;
  }[];
  
  // Select attributes
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  
  // Validation
  error?: string;
  success?: boolean;
}

// =============================================
// UI COMPONENTS
// =============================================

export interface ButtonProps extends BaseProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  // Button attributes
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  
  // Content
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loadingText?: string;
  
  // Event handlers
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
}

export interface ModalProps extends BaseProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  
  // Modal options
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  
  // Content
  header?: ReactNode;
  footer?: ReactNode;
}

export interface LoadingSpinnerProps extends BaseProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

export interface ErrorBoundaryProps extends BaseProps {
  fallback?: ReactNode;
  fallbackMessage?: string;
  onError?: (error: Error, errorInfo: any) => void;
  showDetails?: boolean;
}

// =============================================
// NOTIFICATION COMPONENTS
// =============================================

export interface NotificationProps extends BaseProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  
  // Actions
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }[];
  
  // Event handlers
  onDismiss: (id: string) => void;
  onActionClick?: (actionId: string) => void;
  
  // Display options
  showIcon?: boolean;
  showCloseButton?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export interface ErrorNotificationProps extends BaseProps {
  errors: string[];
  onDismiss: (index: number) => void;
  maxVisible?: number;
  autoHideDuration?: number;
}

// =============================================
// DASHBOARD COMPONENTS
// =============================================

export interface MobileDashboardProps extends BaseProps, LoadingProps, ErrorProps {
  user: User;
  tasks: Task[];
  userTier?: string;
  emergencyMode?: boolean;
  
  // Dashboard sections
  sections?: {
    activeTasks?: boolean;
    projects?: boolean;
    completedTasks?: boolean;
    suggestions?: boolean;
    analytics?: boolean;
  };
  
  // Event handlers
  onTaskComplete: (taskId: TaskId) => void;
  onTaskCreate: (task: Partial<Task>) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: TaskId) => void;
  onEmergencyModeToggle?: (enabled: boolean) => void;
}

export interface QuickAddButtonProps extends BaseProps {
  onAddTask: () => void;
  onVoiceAdd?: () => void;
  disabled?: boolean;
  
  // Voice features
  isListening?: boolean;
  voiceEnabled?: boolean;
  voiceSupported?: boolean;
}

export interface SuggestionsDrawerProps extends BaseProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: {
    id: string;
    title: string;
    description?: string;
    category: TaskCategory;
    priority?: TaskPriority;
    source: 'ai' | 'seasonal' | 'contextual' | 'template';
  }[];
  
  // Event handlers
  onSuggestionAdd: (suggestion: any) => void;
  onRefreshSuggestions?: () => void;
  
  // Display options
  showCategories?: boolean;
  maxSuggestions?: number;
}

// =============================================
// VOICE COMPONENTS
// =============================================

export interface VoiceRecorderProps extends BaseProps {
  onTranscription: (text: string) => void;
  onError?: (error: string) => void;
  
  // Recording options
  maxDuration?: number; // seconds
  autoStop?: boolean;
  showTimer?: boolean;
  showWaveform?: boolean;
  
  // Voice settings
  language?: string;
  sampleRate?: number;
}

export interface VoiceButtonProps extends BaseProps {
  isRecording: boolean;
  isProcessing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  
  // Display options
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  pulseAnimation?: boolean;
  
  // Permissions
  permissionGranted?: boolean;
  onRequestPermission?: () => void;
}

// =============================================
// CHAT COMPONENTS
// =============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

export interface SidekickChatProps extends BaseProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  
  // Chat state
  messages: ChatMessage[];
  isLoading?: boolean;
  
  // Event handlers
  onSendMessage: (message: string) => Promise<void>;
  onClearChat?: () => void;
  
  // User context
  user?: User;
  userTier?: string;
  remainingMessages?: number;
}

export interface ChatMessageProps extends BaseProps {
  message: ChatMessage;
  isLatest?: boolean;
  showTimestamp?: boolean;
  showAvatar?: boolean;
  
  // Actions
  onCopy?: (content: string) => void;
  onReact?: (messageId: string, reaction: string) => void;
}

// =============================================
// LAYOUT COMPONENTS
// =============================================

export interface LayoutProps extends BaseProps {
  user?: User | null;
  showNavigation?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  
  // Layout options
  fullWidth?: boolean;
  centerContent?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export interface PageHeaderProps extends BaseProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: {
    label: string;
    href?: string;
    onClick?: () => void;
  }[];
  
  // Actions
  actions?: ReactNode;
  backButton?: {
    label?: string;
    onClick: () => void;
  };
}

// =============================================
// ANALYTICS COMPONENTS
// =============================================

export interface AnalyticsDashboardProps extends BaseProps, LoadingProps {
  user: User;
  dateRange: {
    start: Date;
    end: Date;
  };
  
  // Data
  metrics?: {
    completionRate: number;
    tasksCompleted: number;
    averageTaskTime: number;
    streakDays: number;
  };
  
  // Chart data
  chartData?: {
    daily: { date: string; completed: number; created: number }[];
    categories: { category: string; count: number; percentage: number }[];
    trends: { period: string; value: number; change: number }[];
  };
  
  // Options
  showCharts?: boolean;
  showInsights?: boolean;
  allowExport?: boolean;
}

// =============================================
// UTILITY TYPES
// =============================================

// Generic component with ref forwarding
export interface ComponentWithRef<T = HTMLElement> extends BaseProps {
  ref?: React.Ref<T>;
}

// Component that can be controlled or uncontrolled
export interface ControllableProps<T> {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
}

// Component with async actions
export interface AsyncActionProps {
  onSubmit?: () => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitText?: string;
  cancelText?: string;
}

// Component with keyboard navigation
export interface KeyboardNavigationProps {
  onKeyDown?: (e: React.KeyboardEvent) => void;
  tabIndex?: number;
  autoFocus?: boolean;
}

// Component with responsive design
export interface ResponsiveProps {
  mobile?: boolean;
  tablet?: boolean;
  desktop?: boolean;
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
}

// =============================================
// THEME AND STYLING
// =============================================

export interface ThemeProps {
  theme?: 'light' | 'dark' | 'system';
  primaryColor?: string;
  accentColor?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export interface ColorScheme {
  bg: string;
  light: string;
  text: string;
  border: string;
  hover?: string;
}

// Category colors (from TaskCard component)
export const CATEGORY_COLORS: Record<TaskCategory, ColorScheme> = {
  [TaskCategory.PERSONAL]: { bg: 'bg-indigo-500', light: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  [TaskCategory.RELATIONSHIP]: { bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  [TaskCategory.BABY]: { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  [TaskCategory.HOUSEHOLD]: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  [TaskCategory.HOME_PROJECTS]: { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  [TaskCategory.HEALTH]: { bg: 'bg-cyan-500', light: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  [TaskCategory.EVENTS]: { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  [TaskCategory.MAINTENANCE]: { bg: 'bg-slate-500', light: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  [TaskCategory.WORK]: { bg: 'bg-gray-500', light: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
};

// =============================================
// HOOK RETURN TYPES
// =============================================

export interface UseTaskFormReturn {
  formData: Partial<Task>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isEditing: boolean;
  isValid: boolean;
  hasChanges: boolean;
  
  // Methods
  updateField: (field: keyof Task, value: any) => void;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (field: keyof Task) => (value: string) => void;
  handleSubmit: (e?: FormEvent) => Promise<void>;
  resetForm: () => void;
  clearErrors: () => void;
}

export interface UseTasksReturn {
  tasks: Task[];
  activeTasks: Task[];
  completedTasks: Task[];
  projects: Task[];
  loading: boolean;
  error: string | null;
  
  // Actions
  createTask: (data: Partial<Task>) => Promise<Task>;
  updateTask: (id: TaskId, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (id: TaskId) => Promise<void>;
  completeTask: (id: TaskId) => Promise<Task>;
  refreshTasks: () => Promise<void>;
}

export interface UseVoiceRecorderReturn {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
  
  // Methods
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearTranscript: () => void;
  
  // Permissions
  permissionGranted: boolean;
  requestPermission: () => Promise<boolean>;
}