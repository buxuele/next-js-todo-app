# Design Document

## Overview

This design outlines the migration of a Flask todo application to Next.js 14 with App Router, deployed on Vercel with Neon PostgreSQL. The architecture emphasizes maintaining 100% visual fidelity while leveraging modern React patterns, server-side rendering, and serverless deployment capabilities.

## Architecture

### Technology Stack
- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Styling**: CSS Modules with custom properties, maintaining exact visual parity
- **Database**: Neon PostgreSQL with connection pooling
- **ORM**: Prisma for type-safe database operations
- **Deployment**: Vercel with serverless functions
- **State Management**: React hooks with context for global state

### Application Structure
```
src/
├── app/
│   ├── api/
│   │   └── todos/
│   │       ├── route.ts
│   │       ├── [id]/route.ts
│   │       ├── counts/route.ts
│   │       ├── copy-date/route.ts
│   │       └── export/[date]/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Sidebar/
│   ├── TodoList/
│   ├── TodoItem/
│   ├── SearchBar/
│   └── ContextMenu/
├── lib/
│   ├── database.ts
│   ├── types.ts
│   └── utils.ts
├── hooks/
│   ├── useTodos.ts
│   ├── useSearch.ts
│   └── useDateNavigation.ts
└── styles/
    └── components/
```

## Components and Interfaces

### Core Components

#### 1. Main Layout Component
```typescript
interface LayoutProps {
  children: React.ReactNode;
}

// Provides the sidebar + main content layout structure
// Manages global state for current date and sidebar collapse
```

#### 2. Sidebar Component
```typescript
interface SidebarProps {
  currentDate: string;
  onDateSelect: (date: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

// Features:
// - Date list generation from database
// - Active date highlighting
// - Context menu integration
// - Responsive collapse behavior
```

#### 3. TodoList Component
```typescript
interface TodoListProps {
  todos: Todo[];
  currentDate: string;
  isSearchMode: boolean;
  searchTerm?: string;
  onTodoUpdate: (id: number, updates: Partial<Todo>) => void;
  onTodoDelete: (id: number) => void;
}

// Features:
// - Reverse chronological display
// - Search result highlighting
// - Loading states
// - Empty state handling
```

#### 4. TodoItem Component
```typescript
interface TodoItemProps {
  todo: Todo;
  isSearchResult?: boolean;
  searchTerm?: string;
  onToggleComplete: () => void;
  onEdit: (content: string) => void;
  onDelete: () => void;
  onCopy: () => void;
}

// Features:
// - Inline editing with auto-resize textarea
// - Double-click completion toggle
// - Copy to clipboard functionality
// - Timestamp display formatting
```

#### 5. SearchBar Component
```typescript
interface SearchBarProps {
  onSearch: (term: string) => void;
  onClear: () => void;
  isSearchMode: boolean;
}

// Features:
// - Real-time search across all dates
// - Keyboard shortcuts (Enter to search)
// - Clear search functionality
```

#### 6. ContextMenu Component
```typescript
interface ContextMenuProps {
  isVisible: boolean;
  position: { x: number; y: number };
  targetDate: string;
  onCopyDate: (date: string) => void;
  onRenameDate: (date: string, newName: string) => void;
  onDeleteDate: (date: string) => void;
  onClose: () => void;
}

// Features:
// - Right-click context menu
// - Date list operations
// - Position calculation
```

## Data Models

### Database Schema (Prisma)

```prisma
model Todo {
  id          Int       @id @default(autoincrement())
  content     String
  completed   Boolean   @default(false)
  orderNum    Int       @default(0)
  date        String    // YYYY-MM-DD format
  createdAt   DateTime  @default(now())
  completedAt DateTime?
  
  @@index([date])
  @@index([date, orderNum])
}

model DateAlias {
  id        Int      @id @default(autoincrement())
  date      String   @unique // YYYY-MM-DD format
  alias     String
  createdAt DateTime @default(now())
}
```

### TypeScript Interfaces

```typescript
interface Todo {
  id: number;
  content: string;
  completed: boolean;
  order: number;
  date: string;
  createdAt: string;
  completedAt?: string;
}

interface DateAlias {
  id: number;
  date: string;
  alias: string;
  createdAt: string;
}

interface TodoCounts {
  [date: string]: number;
}

interface SearchResult extends Todo {
  highlightedContent: string;
}
```

## API Design

### REST Endpoints

#### Todos Management
- `GET /api/todos?date=YYYY-MM-DD` - Get todos for specific date
- `POST /api/todos` - Create new todo
- `PUT /api/todos/[id]` - Update todo
- `DELETE /api/todos/[id]?date=YYYY-MM-DD` - Delete todo
- `POST /api/todos/[id]/copy?date=YYYY-MM-DD` - Copy todo

#### Date Operations
- `GET /api/todos/counts` - Get todo counts by date
- `DELETE /api/todos/date/[date]` - Delete all todos for date
- `POST /api/todos/copy-date` - Copy all todos from one date to another

#### Date Aliases
- `GET /api/date-aliases` - Get all date aliases
- `POST /api/date-aliases` - Set/update date alias
- `DELETE /api/date-aliases/[date]` - Delete date alias

#### Export
- `GET /api/todos/export/[date]` - Export todos as markdown

### API Response Format
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## Styling Strategy

### CSS Architecture
- Use CSS Modules for component-scoped styles
- Maintain exact pixel-perfect matching with Flask version
- Custom properties for theme consistency
- Responsive breakpoints matching original design

### Font Integration
- Host MaruSC-Medium.ttf in public/fonts/
- Implement font-face declarations in globals.css
- Fallback to system fonts (Microsoft YaHei, Arial)

### Key Style Specifications
```css
:root {
  --bg-primary: #fff3e0;
  --bg-secondary: #fff7ed;
  --sidebar-bg: #2d2d2d;
  --border-color: #000;
  --text-primary: #000;
  --text-secondary: #888;
  --accent-color: #b77b00;
}
```

## State Management

### Global State (React Context)
```typescript
interface AppState {
  currentDate: string;
  sidebarCollapsed: boolean;
  searchMode: boolean;
  searchTerm: string;
  todos: Todo[];
  dateAliases: Record<string, string>;
  todoCounts: TodoCounts;
}
```

### Custom Hooks
- `useTodos(date: string)` - Manage todos for specific date
- `useSearch()` - Handle search functionality
- `useDateNavigation()` - Manage date switching and sidebar
- `useContextMenu()` - Handle right-click menu state

## Database Integration

### Connection Management
- Use Prisma with connection pooling for Neon
- Environment-based configuration
- Graceful error handling and retries
- Connection timeout management

### Query Optimization
- Index on date and orderNum fields
- Batch operations for date copying
- Efficient search across all dates
- Proper transaction handling for multi-step operations

## Error Handling

### Client-Side Error Boundaries
- Component-level error boundaries
- Graceful degradation for network failures
- User-friendly error messages
- Retry mechanisms for failed operations

### Server-Side Error Handling
- Structured error responses
- Database connection error recovery
- Input validation and sanitization
- Rate limiting protection

## Testing Strategy

### Unit Testing
- Component testing with React Testing Library
- Hook testing with custom test utilities
- API route testing with mock database
- Utility function testing

### Integration Testing
- End-to-end user workflows
- Database integration testing
- API endpoint integration tests
- Cross-browser compatibility testing

### Performance Testing
- Bundle size optimization
- Database query performance
- Serverless function cold start optimization
- Client-side rendering performance

## Deployment Configuration

### Vercel Setup
- Environment variables for database connection
- Build optimization settings
- Serverless function configuration
- Static asset optimization

### Database Migration
- Prisma migration scripts
- Data seeding for development
- Production database setup
- Backup and recovery procedures

## Security Considerations

### Input Validation
- Content sanitization for XSS prevention
- SQL injection protection via Prisma
- Rate limiting on API endpoints
- CSRF protection for state-changing operations

### Authentication (Future Enhancement)
- Prepared for user authentication integration
- Session management strategy
- Data isolation between users
- Secure cookie handling