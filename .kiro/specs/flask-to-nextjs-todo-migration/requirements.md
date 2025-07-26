# Requirements Document

## Introduction

This project involves migrating an existing Flask-based todo application to Next.js while maintaining 100% visual fidelity and functionality. The new application will be deployed on Vercel with Neon PostgreSQL as the database backend. The migration must preserve all existing features including the sidebar navigation, daily todo management, search functionality, and the distinctive visual design with custom fonts and styling.

## Requirements

### Requirement 1

**User Story:** As a user, I want the Next.js todo app to have identical visual appearance to the Flask version, so that I experience no disruption in the user interface.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL display the same sidebar layout with date navigation
2. WHEN viewing the main content area THEN the system SHALL show identical styling including custom MaruSC font, colors (#fff3e0 background, #2d2d2d sidebar), and component layouts
3. WHEN interacting with todo items THEN the system SHALL display the same button styles, spacing, and visual feedback as the original Flask app
4. WHEN using the search functionality THEN the system SHALL maintain the same search input styling and results display format

### Requirement 2

**User Story:** As a user, I want all existing todo management features to work identically in the Next.js version, so that I can continue using the app without learning new behaviors.

#### Acceptance Criteria

1. WHEN I add a new todo THEN the system SHALL support multi-line input with Shift+Enter for line breaks and Enter to submit
2. WHEN I view todos THEN the system SHALL display them in reverse chronological order (newest first) with completion status, creation/completion timestamps
3. WHEN I double-click a todo THEN the system SHALL toggle its completion status
4. WHEN I edit a todo THEN the system SHALL provide inline editing with textarea that auto-adjusts height
5. WHEN I delete a todo THEN the system SHALL remove it immediately without confirmation
6. WHEN I copy a todo THEN the system SHALL copy the content to clipboard and show visual feedback

### Requirement 3

**User Story:** As a user, I want the daily todo organization system to work exactly as before, so that I can manage tasks by date effectively.

#### Acceptance Criteria

1. WHEN the app loads THEN the system SHALL create today's todo table/collection if it doesn't exist
2. WHEN I switch between dates THEN the system SHALL load and display todos specific to that date
3. WHEN I view the sidebar THEN the system SHALL show all dates with todo data in descending chronological order
4. WHEN I right-click on a date THEN the system SHALL show context menu with copy, rename, and delete options
5. WHEN I copy a date list THEN the system SHALL duplicate all todos to a new date with "-copy" suffix
6. WHEN I rename a date THEN the system SHALL allow setting custom aliases for dates
7. WHEN I delete a date THEN the system SHALL remove all todos for that date after confirmation

### Requirement 4

**User Story:** As a user, I want the search functionality to work identically to find todos across all dates, so that I can locate specific tasks efficiently.

#### Acceptance Criteria

1. WHEN I enter search terms THEN the system SHALL search across all dates and highlight matching text
2. WHEN search results are displayed THEN the system SHALL show the date and timestamp for each matching todo
3. WHEN I clear search THEN the system SHALL return to the current date view
4. WHEN searching THEN the system SHALL support case-insensitive partial text matching

### Requirement 5

**User Story:** As a user, I want the export functionality to generate markdown files identical to the Flask version, so that I can backup and share my todos in the same format.

#### Acceptance Criteria

1. WHEN I export a date THEN the system SHALL generate a markdown file with format "MM.DD-todo.md"
2. WHEN the markdown is generated THEN the system SHALL separate completed and pending todos into distinct sections
3. WHEN exporting THEN the system SHALL include task counts and completion statistics
4. WHEN no todos exist for a date THEN the system SHALL generate a file with "今日无任务" message

### Requirement 6

**User Story:** As a developer, I want the application to use Neon PostgreSQL database, so that it can be deployed on Vercel with reliable cloud database storage.

#### Acceptance Criteria

1. WHEN the application starts THEN the system SHALL connect to Neon PostgreSQL using connection pooling
2. WHEN storing todos THEN the system SHALL use a table structure that supports the daily organization pattern
3. WHEN managing date aliases THEN the system SHALL store them in a separate table with proper relationships
4. WHEN performing database operations THEN the system SHALL handle connection errors gracefully
5. WHEN deploying to Vercel THEN the system SHALL use environment variables for database configuration

### Requirement 7

**User Story:** As a developer, I want the Next.js application to be optimized for Vercel deployment, so that it performs well in production.

#### Acceptance Criteria

1. WHEN building the application THEN the system SHALL use Next.js App Router for optimal performance
2. WHEN serving static assets THEN the system SHALL leverage Vercel's CDN for fonts and CSS
3. WHEN handling API requests THEN the system SHALL use Next.js API routes with proper error handling
4. WHEN the app loads THEN the system SHALL implement proper loading states and error boundaries
5. WHEN deployed THEN the system SHALL support serverless function execution within Vercel's limits

### Requirement 8

**User Story:** As a user, I want the application to maintain the same responsive behavior and keyboard shortcuts, so that my workflow remains unchanged.

#### Acceptance Criteria

1. WHEN using on mobile devices THEN the system SHALL maintain responsive layout with collapsible sidebar
2. WHEN typing in text areas THEN the system SHALL support the same keyboard shortcuts (Enter to submit, Shift+Enter for new line, Escape to cancel)
3. WHEN editing todos THEN the system SHALL auto-adjust textarea height based on content
4. WHEN using the sidebar THEN the system SHALL support collapse/expand functionality with the same toggle button behavior
