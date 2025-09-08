# TypeScript Migration Strategy for Betterish

## Overview
This document outlines a phased approach to migrate the Betterish codebase from JavaScript to TypeScript, ensuring minimal disruption while maximizing type safety benefits.

## Why TypeScript?
- **Type Safety**: Catch errors at compile time instead of runtime
- **Better IDE Support**: Enhanced autocomplete, refactoring, and navigation
- **Self-Documenting Code**: Types serve as inline documentation
- **Easier Refactoring**: Confidence when making large-scale changes
- **Team Scalability**: Easier onboarding and collaboration

## Migration Phases

### Phase 1: Setup & Configuration (Week 1)
- [x] Install TypeScript and necessary dependencies
- [x] Configure tsconfig.json for Next.js
- [x] Set up type checking in CI/CD pipeline
- [x] Add TypeScript support to existing build process
- [ ] Configure ESLint for TypeScript

### Phase 2: Core Types & Interfaces (Week 2)
Priority: Define shared types that will be used across the application

1. **Data Models** (`types/models.ts`)
   - [ ] User type
   - [ ] Task interface
   - [ ] Project interface
   - [ ] Event interface
   - [ ] Subscription types

2. **API Types** (`types/api.ts`)
   - [ ] API response types
   - [ ] API error types
   - [ ] Request payload types

3. **Component Props** (`types/components.ts`)
   - [ ] Common prop types
   - [ ] Theme types
   - [ ] Layout types

### Phase 3: Utilities & Services (Week 3)
Convert pure functions and services first (lowest risk)

1. **Utilities**
   - [ ] lib/errorHandler.js → .ts
   - [ ] lib/duplicateHandler.js → .ts
   - [ ] lib/seasonalTasks.js → .ts
   - [ ] lib/patternTracking.js → .ts

2. **Services**
   - [ ] lib/services/TaskService.js → .ts
   - [ ] lib/firebase-client.js → .ts
   - [ ] lib/firebase-admin.js → .ts

### Phase 4: Hooks (Week 4)
Convert React hooks (medium complexity)

- [ ] hooks/useErrorHandler.js → .ts
- [ ] hooks/useTaskForm.js → .ts
- [ ] hooks/useTasks.js → .ts
- [ ] hooks/useNotifications.js → .ts
- [ ] hooks/useDebounce.js → .ts
- [ ] hooks/useSwipeGesture.js → .ts

### Phase 5: Components - Leaf Components (Week 5)
Start with components that don't have children

1. **Mobile Components**
   - [ ] components/mobile/TaskCard.js → .tsx
   - [ ] components/mobile/MobileHeader.js → .tsx
   - [ ] components/mobile/QuickAddButton.js → .tsx
   - [ ] components/mobile/SuggestionsDrawer.js → .tsx

2. **UI Components**
   - [ ] components/LoadingSpinner.js → .tsx
   - [ ] components/ErrorBoundary.js → .tsx
   - [ ] components/ErrorNotification.js → .tsx
   - [ ] components/GlobalErrorHandler.js → .tsx

### Phase 6: Components - Container Components (Week 6)
Convert complex components

- [ ] components/MobileDashboard.js → .tsx
- [ ] components/TaskForm.js → .tsx
- [ ] components/TaskBreakdown.js → .tsx
- [ ] components/ProjectCard.js → .tsx
- [ ] components/EmergencyMode.js → .tsx

### Phase 7: Context & State Management (Week 7)
Convert context providers and state management

- [ ] contexts/TaskContext.js → .tsx
- [ ] contexts/AuthContext.js → .tsx (if exists)
- [ ] State management types

### Phase 8: Pages & API Routes (Week 8)
Convert Next.js pages and API routes

1. **Pages**
   - [ ] app/page.js → .tsx
   - [ ] app/dashboard/page.js → .tsx
   - [ ] app/login/page.js → .tsx
   - [ ] app/layout.js → .tsx

2. **API Routes**
   - [ ] app/api/ai/breakdown/route.js → .ts
   - [ ] app/api/ai/mentor/route.js → .ts
   - [ ] Other API routes

## Implementation Guidelines

### 1. Incremental Adoption
- Use `allowJs: true` in tsconfig.json to allow gradual migration
- Convert one file at a time
- Run type checking alongside existing tests

### 2. Type Definition Strategy
```typescript
// Start with basic types
type TaskId = string;
type UserId = string;

// Build up to complex interfaces
interface Task {
  id: TaskId;
  userId: UserId;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Use enums for constants
enum TaskStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  SNOOZED = 'snoozed',
  ARCHIVED = 'archived'
}
```

### 3. Strict Mode Progression
Start with lenient settings and gradually increase strictness:

```json
// Initial tsconfig.json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false
  }
}

// After Phase 4
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}

// Final (Phase 8)
{
  "compilerOptions": {
    "strict": true
  }
}
```

### 4. Common Patterns

#### Component Props
```typescript
interface TaskCardProps {
  task: Task;
  onComplete: (id: TaskId) => void;
  onSnooze?: (id: TaskId, until: Date) => void;
  isFirst?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onComplete, 
  onSnooze, 
  isFirst = false 
}) => {
  // Component implementation
};
```

#### API Responses
```typescript
interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
```

#### Firebase Types
```typescript
import { Firestore, DocumentData } from 'firebase/firestore';

interface FirebaseTask extends DocumentData {
  title: string;
  status: TaskStatus;
  // ... other fields
}
```

## Success Metrics

### Code Quality
- [ ] 0 TypeScript errors in strict mode
- [ ] 100% of codebase migrated
- [ ] Type coverage > 90%

### Developer Experience
- [ ] Reduced debugging time
- [ ] Faster feature development
- [ ] Better code review process

### Runtime Safety
- [ ] Reduced runtime errors by 50%
- [ ] Eliminated type-related bugs
- [ ] Improved error messages

## Tools & Resources

### Required Packages
```json
{
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0"
  }
}
```

### VS Code Extensions
- TypeScript Vue Plugin
- ESLint
- Prettier

### Type Checking Scripts
```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch"
  }
}
```

## Migration Checklist

### Per-File Migration Steps
1. [ ] Rename file extension (.js → .ts/.tsx)
2. [ ] Add type annotations to function parameters
3. [ ] Add return type annotations
4. [ ] Define interfaces for objects
5. [ ] Replace `any` with specific types
6. [ ] Add JSDoc comments for complex types
7. [ ] Run type checker
8. [ ] Run tests
9. [ ] Update imports in other files

## Common Gotchas & Solutions

### 1. Third-party Libraries Without Types
```typescript
// Create a declarations file: types/untyped-module.d.ts
declare module 'untyped-library' {
  export function someFunction(param: any): any;
}
```

### 2. Event Handlers
```typescript
// Correct typing for event handlers
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  // ...
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  // ...
};
```

### 3. Async Functions
```typescript
// Properly type async functions
const fetchTasks = async (): Promise<Task[]> => {
  const response = await fetch('/api/tasks');
  return response.json();
};
```

## Timeline
- **Total Duration**: 8 weeks
- **Daily Commitment**: 2-3 hours
- **Review Points**: End of each phase
- **Full Migration Target**: End of Q1 2025

## Next Steps
1. Install TypeScript dependencies
2. Create initial tsconfig.json
3. Convert first utility file as proof of concept
4. Set up pre-commit hooks for type checking
5. Train team on TypeScript basics

---

*This is a living document and will be updated as the migration progresses.*