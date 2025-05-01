# Weekly Habit Tracker

A comprehensive full-stack application for tracking daily habits and routines with robust MongoDB integration, user authentication, and a feature-rich React frontend.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [System Architecture](#system-architecture)
- [Data Models](#data-models)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Mobile Development](#mobile-app-development-strategy)
- [Contributing](#contributing)

## Overview

Weekly Habit Tracker helps users build and maintain habits by tracking daily activities, visualizing progress, and offering insights into habit formation. The application features a clean, intuitive interface with drag-and-drop capabilities and responsive design.

## Features

- **User Authentication**
  - JWT-based authentication system
  - Secure password handling with bcrypt
  - Password reset functionality
  
- **Activity Tracking**
  - Create, edit, and delete activities
  - Mark activities as complete/incomplete
  - Organize activities by time of day (morning, afternoon, evening)
  - Set recurring daily activities with day-specific scheduling
  
- **Habit Formation**
  - Track completion streaks
  - View insights and statistics
  - Activity completion tracking
  
- **Notes System**
  - Comprehensive notes for activities
  - Recurring notes
  - Next session notes
  - Session journal
  
- **User Preferences**
  - Light/dark theme support
  - Customizable daily targets
  - User profiles
  
- **Countdown Events**
  - Create and track countdown to important events
  
- **Offline Capabilities**
  - Multiple fallback mechanisms
  - Local storage for offline functionality
  - Data synchronization when reconnected

## Project Structure
# Weekly Habit Tracker Visual File Map

```
WeeklyHabitTracker/
Project Structure (Updated)
WeeklyHabitTracker/
│
├── README-COMPREHENSIVE.md           # Project documentation
│
├── backend/                          # Server-side code
│   ├── server.js                     # Main entry point ← Routes ← Controllers ← Models/Storage
│   │
│   ├── config/
│   │   └── db.js                     # MongoDB connection ← Used by server.js and controllers
│   │
│   ├── routes/
│   │   └── api.js                    # API endpoints → Links to controllers
│   │
│   ├── controllers/                  # Business logic ← Uses models & storage
│   │   ├── activities.js             # Activity operations
│   │   ├── auth.js                   # Authentication
│   │   ├── calendarEvents.js         # Calendar events
│   │   ├── countdownEvents.js        # Countdown events
│   │   ├── passwordReset.js          # Password reset
│   │   └── users.js                  # User management
│   │
│   ├── middleware/
│   │   └── auth.js                   # JWT verification ← Used by protected routes
│   │
│   ├── models/                       # Data schemas → Used by controllers
│   │   ├── Activity.js               # Activity model
│   │   ├── CalendarEvent.js          # Calendar event model
│   │   ├── CountdownEvent.js         # Countdown event model
│   │   ├── PasswordResetToken.js     # Reset token model
│   │   └── User.js                   # User model
│   │
│   └── storage/
│       └── inMemoryStorage.js        # Fallback storage ← Used when MongoDB is unavailable
│
└── frontend/                         # Client-side code
    ├── public/
    │   └── index.html                # HTML entry point
    │
    └── src/
        ├── index.js                  # JS entry point → Renders App
        ├── App.js                    # Main component → Routes to Pages
        ├── index.css                 # Global styles
        │
        ├── context/
        │   └── AuthContext.js        # Auth state ← Used by all protected components
        │
        ├── services/                 # API communication ↔ Backend APIs
        │   ├── api.js                # Core API functions ← Used by components
        │   ├── auth.js               # Auth service ← Used by auth flows
        │   └── countdownEvents.js    # Countdown services
        │
        ├── utils/
        │   ├── eventBus.js           # Pub/sub system ← Used for cross-component updates
        │   └── theme.js              # Theme utilities
        │
        └── components/
            ├── ActivityCard.js       # UI components ← Used by pages
            ├── ActivityDetail.js
            ├── ActivityForm.js
            ├── ActivityList.js       # ← Uses ActivityCard
            ├── BottomNavigation.js   # ← Used in PageWrapper
            ├── EventForm.js
            ├── Header.js             # ← Used in PageWrapper
            ├── PageWrapper.js        # ← Wraps all pages
            ├── ProtectedRoute.js     # ← Used by App.js for auth protection
            │
            ├── Habits/               # New modular components for habits functionality
            │   ├── index.js          # Re-exports components for easy imports
            │   ├── DayColumn.js      # Day column component
            │   ├── TimePeriod.js     # Period component (morning/afternoon/evening)
            │   ├── ActivityCard.js   # Individual activity card
            │   ├── DraggableActivity.js # Draggable activity wrapper
            │   ├── DroppableActivity.js # Droppable activity wrapper
            │   ├── NavigationHeader.js # Weekly view navigation header
            │   ├── CalendarEvent.js  # Calendar event component
            │   ├── EventFormModal.js # Event form modal wrapper
            │   └── utils/            # Utilities specific to habits
            │       ├── dateUtils.js  # Date formatting and calculation functions
            │       ├── activityUtils.js # Activity handling utilities
            │       └── styles.js     # Extracted CSS styles
            │
            └── Pages/                # Route destinations ← Use components, services
                ├── ActivitiesPage.js           # Activity management
                ├── ActivityDetailPage.js       # Activity details
                ├── CalendarPage.js             # [PLACEHOLDER]
                ├── CountdownPage.js            # Countdown events
                ├── HabitsPage.js               # Weekly habits view (refactored)
                ├── HabitsPage(stable).js       # [BACKUP]
                ├── HomePage.js                 # Dashboard
                ├── InsightsPage.js             # Analytics
                ├── LeaderboardPage.js          # [MOCKUP]
                ├── LoginPage.js                # Login screen
                ├── NotFoundPage.js             # 404 page
                ├── PasswordResetPage.js        # Reset flow
                ├── ProfilePage.js              # User profile
                ├── RegisterPage.js             # Registration
                ├── RequestResetPage.js         # Password reset request
                ├── ResetPasswordPage.js        # Set new password
                └── StreaksPage.js              # Habit streaks
                ```
Recent Refactoring: Habits Page Modularization
Overview
We successfully decomposed the monolithic HabitsPage component (previously over 2,500 lines) into a modular structure of smaller, focused components. This refactoring significantly improves code maintainability, readability, and facilitates future enhancements.
Key Improvements

Modular Component Structure:

Split the massive HabitsPage.js file into logical, single-responsibility components
Created a dedicated Habits/ directory to house all related components
Established clear component hierarchy and relationships


Clean Separation of Concerns:

UI components like DayColumn, TimePeriod, and ActivityCard focus solely on rendering
Interaction components like DraggableActivity and DroppableActivity handle drag-and-drop
Utilities are organized into dedicated files (dateUtils.js, activityUtils.js)


Styling Organization:

Extracted all CSS from the component into a dedicated styles.js file
Implemented as a template string to maintain compatibility with the existing approach
Styles are well-organized by component and functionality


Enhanced Maintainability:

Each component file is now a manageable size (typically <200 lines)
Clear interfaces between components via props
Easier to understand, debug, and extend functionality



Component Relationships
The new structure follows a hierarchical pattern:
```
HabitsPage
  └── Navigation Header
  └── Day Columns
       └── Time Periods (Morning/Afternoon/Evening)
            └── Calendar Events
            └── Droppable Activities
                 └── Draggable Activity Cards
  └── Event Form Modal
Each component handles its specific responsibilities while communicating with parent components through well-defined props and callbacks.
```

## Data Flow Diagram

```
┌───────────────────┐         ┌─────────────────┐         ┌────────────────┐
│   Frontend UI     │         │  Frontend       │         │ Backend APIs   │
│  (React Pages)    │◄────────┤   Services      │◄────────┤ (Controllers)  │
└───────┬───────────┘         └─────────────────┘         └────────┬───────┘
        │                                                          │
        │                                                          │
        ▼                                                          ▼
┌───────────────────┐         ┌─────────────────┐         ┌────────────────┐
│  Event Bus        │         │  Auth Context   │         │ Data Storage   │
│  (State Updates)  │         │  (User State)   │         │ (MongoDB/Memory│
└───────────────────┘         └─────────────────┘         └────────────────┘
```

## Key Component Relationships

1. **Authentication Flow**:
   - `LoginPage.js` → `auth.js` (service) → Backend `auth.js` (controller) → `User.js` (model)
   - Token stored in localStorage → `AuthContext.js` maintains authentication state

2. **Activity Management Flow**:
   - `ActivityForm.js` → `api.js` (createActivity) → Backend `activities.js` → `Activity.js` model
   - Updates published via `eventBus.js` → Subscribed components update UI

3. **Habit Tracking Flow**:
   - `HabitsPage.js` → `api.js` (toggleActivityCompletion) → Backend `activities.js` 
   - Events published → `InsightsPage.js` and `StreaksPage.js` update

4. **Fallback Mechanism**:
   - When MongoDB unavailable: Controllers → `inMemoryStorage.js` instead of models
   - Frontend services have localStorage fallbacks for offline operation

## UI Component Hierarchy

```
App
├── AuthContext (Provider)
│   └── PageWrapper
│       ├── Header
│       ├── [Page Component]
│       └── BottomNavigation
│
└── Protected Routes
    ├── HomePage
    │   └── ActivityList
    │       └── ActivityCard (multiple)
    │
    ├── HabitsPage
    │   └── Activity components with completion toggles
    │
    ├── ActivitiesPage
    │   └── ActivityList
    │
    └── etc.
```

Okay, I have reviewed the code folder. Here is the addendum for your `README.md` file explaining the frontend pages and the backend structure:

## README Addendum: Application Architecture Details

This addendum provides a more detailed explanation of how the frontend pages function and interact with the backend, as well as an overview of the backend architecture.

### Frontend Pages Explanation

The frontend is a React Single Page Application (SPA) built using components found in `frontend/src/components/`[cite: 1]. Navigation is handled by `react-router-dom`, and state management primarily uses React Context, particularly for authentication (`frontend/src/context/AuthContext.js`). API interactions are managed through services defined in `frontend/src/services/`.

Here's a breakdown of the main pages located in `frontend/src/components/Pages/`:

1.  **`HomePage.js`**
    * **Purpose**: Serves as the main dashboard after login. It displays the user's activities, likely grouped by time period (Morning, Afternoon, Evening).
    * **Functionality**: Fetches activities using `WorkspaceActivities` from `api.js`. Uses `ActivityList.js` to render activities, allowing users to mark them as complete via `toggleActivityCompletion` and potentially reorder or move them using `react-dnd`. Allows opening an `ActivityForm` modal to add or edit activities. Listens for `activity-completion-changed`, `activity-created`, `activity-updated`, and `activity-deleted` events via `EventBus` to update the view.
    * **Backend Communication**: Primarily interacts with `/api/activities` endpoints (GET, POST for completion)[cite: 6]. Uses the authentication token (`x-auth-token`) for protected routes[cite: 6].

2.  **`ActivitiesPage.js`**
    * **Purpose**: Provides a view to manage all activities, showing details like duration, period, recurrence, and notes previews.
    * **Functionality**: Fetches all activities using `WorkspaceActivities`. Displays activity details including previews of recurring and next-session notes for the current day. Allows users to navigate to the `ActivityDetailPage` for a specific activity.
    * **Backend Communication**: Uses the `/api/activities` (GET) endpoint[cite: 6].

3.  **`ActivityDetailPage.js`**
    * **Purpose**: Shows detailed information for a single activity, including a timer and comprehensive notes management.
    * **Functionality**: Loads activity data passed via `localStorage` (or fetches if ID mismatch). Includes a countdown timer based on activity duration. Manages different note types (session journal, recurring reminders, next session notes) with editing capabilities. Allows switching days for day-specific notes and saving notes via `updateActivity`. Users can mark the activity as complete.
    * **Backend Communication**: Interacts with `/api/activities/:id` (PUT for saving notes/settings) and `/api/activities/:id/complete` (POST for completion)[cite: 6].

4.  **`HabitsPage.js` (`This Week` View)**
    * **Purpose**: Displays activities and habits in a weekly calendar-like view, allowing users to see their schedule and track completions across days.
    * **Functionality**: Fetches activities and calendar events. Renders a multi-day view (initially 4 days: Today + 3 future). Allows navigation to past and future days. Displays activities and calendar events within their respective days and time periods (Morning, Afternoon, Evening). Uses `react-dnd` for dragging activities to reorder or change their period. Users can mark habits as complete directly on this view via `toggleHabitCompletion`. Fetches calendar events using `WorkspaceCalendarEvents` and allows adding/editing them via `EventForm.js`. Listens for `activity-completion-changed`, `activity-created`, `activity-updated`, and `activity-deleted` events via `EventBus` to refresh data.
    * **Backend Communication**: Fetches data using `/api/activities` (GET), `/api/events` (GET)[cite: 6]. Toggles completion via `/api/activities/:id/complete` (POST)[cite: 6]. Saves/updates events via `/api/events` (POST/PUT)[cite: 6]. Updates activity period/order via `/api/activities/:id` (PUT)[cite: 6].


    Frontend Connections for HabitsPage.js

  HabitsPage.js
  │
  ├── Components
  │   ├── PageWrapper.js
  │   │   └── (Wraps the entire page with common layout elements)
  │   │
  │   ├── NavigationHeader.js (Habits/NavigationHeader.js)
  │   │   └── (Controls navigation between days/weeks)
  │   │
  │   ├── DayColumn.js (Habits/DayColumn.js)
  │   │   ├── TimePeriod.js (Habits/TimePeriod.js)
  │   │   │   ├── DroppableActivity.js (Habits/DroppableActivity.js)
  │   │   │   │   └── DraggableActivity.js (Habits/DraggableActivity.js)
  │   │   │   └── CalendarEvent.js (Habits/CalendarEvent.js)
  │   │   └── (Renders individual day columns with activities and events)
  │   │
  │   └── EventFormModal.js (Habits/EventFormModal.js)
  │       └── (Form for creating/editing calendar events)
  │
  ├── Utilities
  │   ├── dateUtils.js (Habits/utils/dateUtils.js)
  │   │   └── (Date formatting and calculation functions)
  │   │
  │   └── styles.js (Habits/utils/styles.js)
  │       └── (CSS styles for the Habits components)
  │
  ├── Context
  │   ├── AuthContext.js (context/AuthContext.js)
  │   │   └── (User authentication state)
  │   │
  │   └── PreviewModeContext.js [implied] (context/PreviewModeContext.js)
  │       └── (For preview mode when not logged in)
  │
  ├── Services
  │   ├── api.js (services/api.js)
  │   │   └── (Core API functions for activities/habits and calendar
  events)
  │   │
  │   └── countdownEvents.js (services/countdownEvents.js)
  │       └── (API functions for countdown events)
  │
  └── Libraries
      ├── react-dnd (DndProvider, HTML5Backend)
      │   └── (Drag and drop functionality)
      │
      ├── react-dnd-touch-backend (TouchBackend)
      │   └── (Touch support for drag and drop on mobile)
      │
      └── react-i18next (useTranslation)
          └── (Internationalization support)



Backend Connections for HabitsPage.js

  HabitsPage.js
  │
  ├── API Endpoints Used
  │   │
  │   ├── Activities
  │   │   ├── GET /api/activities
  │   │   │   └── activitiesController.getActivities
  │   │   │       └── Activity model (models/Activity.js)
  │   │   │
  │   │   ├── POST /api/activities/:id/complete
  │   │   │   └── activitiesController.completeActivity
  │   │   │       └── Activity model (completions field)
  │   │   │
  │   │   └── PUT /api/activities/:id
  │   │       └── activitiesController.updateActivity
  │   │           └── (Updates activity period and order for dragging)
  │   │
  │   ├── Calendar Events
  │   │   ├── GET /api/events
  │   │   │   └── calendarEventsController.getCalendarEvents
  │   │   │       └── CalendarEvent model (models/CalendarEvent.js)
  │   │   │
  │   │   ├── POST /api/events
  │   │   │   └── calendarEventsController.createCalendarEvent
  │   │   │
  │   │   ├── PUT /api/events/:id
  │   │   │   └── calendarEventsController.updateCalendarEvent
  │   │   │
  │   │   └── DELETE /api/events/:id
  │   │       └── calendarEventsController.deleteCalendarEvent
  │   │
  │   └── Countdown Events
  │       ├── GET /api/countdown-events
  │       │   └── countdownEventsController.getCountdownEvents
  │       │       └── CountdownEvent model (models/CountdownEvent.js)
  │       │
  │       ├── POST /api/countdown-events
  │       │   └── countdownEventsController.createCountdownEvent
  │       │
  │       ├── PUT /api/countdown-events/:id
  │       │   └── countdownEventsController.updateCountdownEvent
  │       │
  │       ├── DELETE /api/countdown-events/:id
  │       │   └── countdownEventsController.deleteCountdownEvent
  │       │
  │       └── POST /api/countdown-events/:id/complete
  │           └── countdownEventsController.completeRecurringEvent
  │
  └── Data Flow
      ├── Authentication
      │   └── JWT token from localStorage sent in 'x-auth-token' header
      │       └── Verified by auth middleware (middleware/auth.js)
      │
      ├── Activity Management
      │   ├── Activities fetched from MongoDB via API
      │   ├── Loaded into state (activities, completions)
      │   ├── User actions update state optimistically
      │   └── Changes sent to backend (toggle completion, update
  period/order)
      │
      ├── Calendar Events
      │   ├── Events fetched from MongoDB via API
      │   ├── Loaded into state (calendarEvents)
      │   ├── User actions trigger EventFormModal
      │   └── Changes sent to backend (create, update, delete)
      │
      └── Countdown Events
          ├── Events fetched from MongoDB via API
          ├── Loaded into state (countdownEvents)
          ├── Converted to calendar format for display
          └── Changes sent to backend (create, update, delete, complete)

  The HabitsPage.js component is quite complex and serves as a central hub
  for displaying and managing habits and events in a weekly calendar view.
  It uses a combination of React context for authentication, drag-and-drop
  libraries for interaction, and multiple API services to communicate with
  the backend.

  Key features include:
  1. Displaying activities/habits organized by day and time period
  (morning/afternoon/evening)
  2. Supporting drag-and-drop reordering of activities between time periods
  3. Tracking habit completion status
  4. Managing calendar events and countdown events
  5. Responsive design with mobile touch support

  The backend connections are primarily through the API endpoints defined
  in api.js and countdownEvents.js, which communicate with various
  controllers on the server side. These controllers interact with MongoDB
  models to store and retrieve data.

5.  **`LoginPage.js`** & **`RegisterPage.js`**
    * **Purpose**: Handle user authentication (Login) and new user creation (Register).
    * **Functionality**: Collect user credentials (email/password for login, name/email/password for register). Validate input (e.g., password length). Call corresponding functions (`login`, `register`) from `auth.js` service. Display errors if authentication/registration fails. On success, save token and user info to `localStorage` and navigate to the home page (`/`).
    * **Backend Communication**: Interact with `/api/auth/login` and `/api/auth/register` endpoints (POST)[cite: 6].

6.  **`PasswordResetPage.js`**
    * **Purpose**: Allows users to request a password reset link and set a new password using a token.
    * **Functionality**: Handles three steps: requesting a reset link via email, verifying the token received (potentially via URL parameter), and setting a new password. Uses services `requestPasswordReset`, `verifyResetToken`, and `resetPassword` from `auth.js`.
    * **Backend Communication**: Interacts with `/api/auth/password-reset/request` (POST), `/api/auth/password-reset/verify/:token` (GET), and `/api/auth/password-reset/reset` (POST)[cite: 6].

7.  **`ProfilePage.js`**
    * **Purpose**: Displays user profile information and allows editing settings and preferences.
    * **Functionality**: Fetches the user's profile data using `getUserProfile`. Displays user details like name, email, avatar, bio, join date, theme preference, and daily target. Allows users to edit profile fields, manage personal goals, and change theme settings. Saves changes using `updateUserProfile`. Applies the selected theme using `applyTheme` from `theme.js`. Indicates whether data is being fetched from MongoDB or local storage fallback.
    * **Backend Communication**: Uses `/api/users/profile` endpoints (GET for fetching, PUT for updating)[cite: 6].

8.  **`StreaksPage.js`**
    * **Purpose**: Shows the user's current and longest streaks for each habit, along with overall completion stats.
    * **Functionality**: Fetches activities, filtering for those marked as habits (`isHabit: true`). Calculates current and longest streaks based on completion data stored in the `completions` field of each habit object. Displays streak information, total completions, and days since creation for each habit. Allows marking habits as complete for the current day using `toggleActivityCompletion`. Listens for `activity-completion-changed`, `activity-created`, `activity-updated`, and `activity-deleted` events via `EventBus` to refresh data.
    * **Backend Communication**: Uses `/api/activities` (GET) to fetch habits[cite: 6]. Uses `/api/activities/:id/complete` (POST) to mark completion[cite: 6].

9.  **`InsightsPage.js`**
    * **Purpose**: Provides analytics on habit completion, including a monthly calendar heatmap and overall statistics.
    * **Functionality**: Fetches activities, filtering for habits. Calculates daily completion percentages for the selected month and year based on the `completions` data for each active habit on that day. Renders a calendar grid color-coded by completion percentage. Calculates and displays statistics like average completion, perfect days (monthly, yearly, total), and the master streak (days with 100% completion of all active habits). Allows navigation between months. Listens for `activity-completion-changed`, `activity-created`, `activity-updated`, and `activity-deleted` events via `EventBus` to refresh data.
    * **Backend Communication**: Uses `/api/activities` (GET) to fetch habits and their completion data[cite: 6].

10. **`CountdownPage.js`**
    * **Purpose**: Allows users to create and track countdowns to specific dates and times.
    * **Functionality**: Fetches countdown events using `WorkspaceCountdownEvents`. Displays existing countdowns, showing the time remaining (days, hours, minutes, seconds). Allows adding new countdown events with name, date/time, and optional description/notes using `createCountdownEvent`. Allows editing notes for existing events via `updateCountdownEvent`. Allows deleting events using `deleteCountdownEvent`. Uses different background/progress colors based on proximity to the event date. Includes fallback to `localStorage` if the API is unavailable.
    * **Backend Communication**: Uses `/api/countdown-events` endpoints (GET, POST, PUT, DELETE)[cite: 6].
```Countdown Page Functionality
The Countdown Page provides comprehensive event tracking with both one-time and recurring events, offering users a visual representation of time remaining until important dates and activities.
Key Features
Dual Event Creation Interfaces

One-Time Events: Track specific dates like birthdays, deadlines, and special occasions
Recurring Events: Track repeating events like meetings, workouts, and routines

Flexible Recurrence Patterns

Daily: Set events that repeat every day or on specific days of the week
Weekly: Schedule events for selected days each week with customizable intervals
Monthly: Create events that occur on specific days of each month
Yearly: Set up annual events like birthdays and anniversaries

Visual Progress Tracking

Color-coded progress bars indicate time remaining
Visual cues for past-due events
Color customization for different event types
Countdown displays in days, hours, minutes, and seconds

Event Management

Add detailed descriptions and notes to any event
Edit notes at any time to keep information current
"Complete & Reset" function for recurring events that automatically schedules the next occurrence
Delete events that are no longer needed

User Experience Enhancements

Separate, focused interfaces for different event types
Intuitive time selection for recurring events
Clear visual separation between one-time and recurring events
Automatic calculation of next occurrence dates
Clear description of recurrence patterns (e.g., "Repeats weekly on Mon, Wed, Fri")

Implementation Details
The page implements a responsive card-based UI with real-time countdown updates. Events are stored in MongoDB with fallback to localStorage for offline functionality. Recurring events use sophisticated date calculation algorithms to determine the next occurrence based on pattern settings.
When a recurring event is completed, the system automatically calculates the next occurrence date according to the defined pattern, adjusting for day selection in daily/weekly events, and appropriate day/month combinations for monthly/yearly events.
This comprehensive countdown system allows users to track both specific deadlines and regular routines in a unified, visually appealing interface.
###Updates to the Countdownpage: New State Variables

Added otEventHasDuration, otEventEndDate, otEventIsAllDay for one-time events
Added rEventHasDuration, rEventDuration, rEventIsAllDay for recurring events

New Helper Functions

Time Functions:

setDefaultEndTime: Sets default end time 1 hour after start time
handleOtEventDateChange: Updates end time when start time changes
generateTimeOptions: Creates time options in 5-minute intervals
determinePeriod: Assigns morning/afternoon/evening based on event time


Period Management:

spansMultiplePeriods: Checks if an event spans multiple periods
getEventPeriods: Returns all applicable periods for an event


Display Formatting:

formatEventTimeDisplay: Enhanced to show duration information



Form Changes

One-time Event Form:

Added checkbox for "All-day event"
Added checkbox for "Event has duration"
Added conditional end time input that appears when duration is checked
Set 5-minute intervals for time inputs using step="300"


Recurring Event Form:

Added similar checkboxes for all-day and duration options
Replaced time input with dropdown showing 5-minute intervals
Added duration dropdown when event has duration checked



Data Model Integration

Updated addOneTimeEvent and addRecurringEvent functions to include new fields
Added period calculation based on start time
Included hasDuration, endDate, and isAllDay in API calls

UI Display Enhancements

Enhanced event cards to show duration information when available
Added "All day" badge for all-day events
Updated time display format to show duration appropriately

Default Events

Updated sample/default events to include new duration fields

This implementation satisfies all the requirements you mentioned:

✅ Time selection simplified to 5-minute intervals
✅ Added end time/duration functionality
✅ Included all-day event option
✅ Improved terminology for clarity
✅ Added period assignment based on event time
✅ Prepared for calendar view integration

The code maintains backward compatibility with existing events while adding new capabilities. It also preserves all the existing functionality like event completion, notes editing, and recurring event handling.

```


11. *`LeaderboardPage.js`**: 
 ../LEADERBOARD_README.md                                                 │ │
│ │                                                                          │ │
│ │ # Leaderboard Feature Documentation                                      │ │
│ │                                                                          │ │
│ │ This document provides a comprehensive overview of the leaderboard       │ │
│ │ feature implemented in the Weekly Habit Tracker application. It covers   │ │
│ │ the database models, API routes, controllers, frontend components, and   │ │
│ │ how they all work together.                                              │ │
│ │                                                                          │ │
│ │ ## Table of Contents                                                     │ │
│ │ 1. [System Overview](#system-overview)                                   │ │
│ │ 2. [Database Models](#database-models)                                   │ │
│ │ 3. [Backend Routes](#backend-routes)                                     │ │
│ │ 4. [Backend Controllers](#backend-controllers)                           │ │
│ │ 5. [Frontend Services](#frontend-services)                               │ │
│ │ 6. [Frontend Components](#frontend-components)                           │ │
│ │ 7. [Data Flow](#data-flow)                                               │ │
│ │ 8. [Feature Functionality](#feature-functionality)                       │ │
│ │ 9. [Future Enhancements](#future-enhancements)                           │ │
│ │                                                                          │ │
│ │ ## System Overview                                                       │ │
│ │                                                                          │ │
│ │ The leaderboard feature allows users to:                                 │ │
│ │                                                                          │ │
│ │ 1. View categorized global leaderboards of habit streaks                 │ │
│ │ 2. Sync their own habits to these leaderboards                           │ │
│ │ 3. Compete with other users by maintaining streaks                       │ │
│ │ 4. Suggest new categories for leaderboards                               │ │
│ │                                                                          │ │
│ │ The system uses real habit completion data to calculate streaks,         │ │
│ │ ensuring that leaderboards reflect actual user progress and consistency. │ │
│ │                                                                          │ │
│ │ ## Database Models                                                       │ │
│ │                                                                          │ │
│ │ ### `LeaderboardCategory.js`                                             │ │
│ │ Located at: `/backend/models/LeaderboardCategory.js`                     │ │
│ │ ```                                                                         │ │
│ │ ```javascript                                                            │ │
│ │ // Schema fields:                                                        │ │
│ │ {                                                                        │ │
│ │   name: String,           // Category name (e.g., "Sleeping", "Reading") │ │
│ │   emoji: String,          // Visual representation (e.g., "😴", "📚")    │ │
│ │   description: String,    // Detailed description of the category        │ │
│ │   createdAt: Date,        // When the category was created               │ │
│ │   isActive: Boolean       // Whether the category is approved and        │ │
│ │ visible                                                                  │ │
│ │ }                                                                        │ │
│ │ ```                                                                      │ │
│ │  ```                                                                        │ │
│ │ ```### `LeaderboardEntry.js`                                                │ │
│ │ Located at: `/backend/models/LeaderboardEntry.js`                        │ │
│ │                                                                          │ │
│ │ ```javascript                                                            │ │
│ │ // Schema fields:                                                        │ │
│ │ {                                                                        │ │
│ │   userId: String,                       // User's unique identifier      │ │
│ │   categoryId: ObjectId,                 // Reference to the category     │ │
│ │   activityId: ObjectId,                 // Reference to the user's       │ │
│ │ activity                                                                 │ │
│ │   username: String,                     // Display name on leaderboard   │ │
│ │   avatar: String,                       // Visual representation of user │ │
│ │   currentStreak: Number,                // Current streak (days)         │ │
│ │   lastUpdated: Date,                    // When the entry was last       │ │
│ │ updated                                                                  │ │
│ │   showOnLeaderboard: Boolean            // Whether to display in         │ │
│ │ rankings                                                                 │ │
│ │ }                                                                        │ │
│ │ ```                                                                      │ │
│ │                                                                          │ │
│ │ ## Backend Routes                                                        │ │
│ │ ```                                                                         │ │
│ │ All leaderboard routes are defined in `/backend/routes/api.js` under the │ │
│ │  leaderboard section:                                                    │ │
│ │                                                                          │ │
│ │ | HTTP Method | Route | Controller Function | Description |              │ │
│ │ |-------------|-------|---------------------|-------------|              │ │
│ │ | GET | `/api/leaderboard/categories` | `getCategories` | Fetch all      │ │
│ │ active leaderboard categories |                                          │ │
│ │ | GET | `/api/leaderboard/categories/:categoryId/entries` |              │ │
│ │ `getCategoryEntries` | Get all entries for a specific category |         │ │
│ │ | POST | `/api/leaderboard/entries` | `addEntry` | Add a habit to a      │ │
│ │ leaderboard |                                                            │ │
│ │ | DELETE | `/api/leaderboard/categories/:categoryId/entries` |           │ │
│ │ `removeEntry` | Remove a habit from a leaderboard |                      │ │
│ │ | POST | `/api/leaderboard/categories/suggest` | `suggestCategory` |     │ │
│ │ Suggest a new leaderboard category |                                     │ │
│ │ | GET | `/api/leaderboard/user/synced-habits` | `getUserSyncedHabits` |  │ │
│ │ Get all habits a user has synced to leaderboards |                       │ │
│ │ | GET | `/api/leaderboard/user/available-habits` |                       │ │
│ │ `getUserHabitsForSync` | Get user's habits available for syncing |       │ │
│ │ | POST | `/api/leaderboard/update` | `updateLeaderboardEntries` | Update │ │
│ │  all leaderboard entries (admin/cron) |                                  │ │
│ │   ```                                                                       │ │
│ │ All routes are protected by the `authMiddleware` to ensure only          │ │
│ │ authenticated users can access them.                                     │ │
│ │                                                                          │ │
│ │ ## Backend Controllers                                                   │ │
│ │      ```                                                                    │ │
│ │ The leaderboard controller is defined in                                 │ │
│ │ `/backend/controllers/leaderboard.js` and contains the following key     │ │
│ │ functions:                                                               │ │
│ │                                                                          │ │
│ │ ### Core Functions                                                       │ │
│ │                                                                          │ │
│ │ - `getCategories`: Fetches all active categories and enriches them with  │ │
│ │ stats (participant count, top streak)                                    │ │
│ │ - `getCategoryEntries`: Retrieves all entries for a specific category,   │ │
│ │ sorted by streak                                                         │ │
│ │ - `addEntry`: Syncs a user's habit to a leaderboard category             │ │
│ │ - `removeEntry`: Removes a habit from a leaderboard (hides rather than   │ │
│ │ deletes)                                                                 │ │
│ │ - `suggestCategory`: Allows users to suggest new categories (inactive    │ │
│ │ until approved)                                                          │ │
│ │ - `getUserSyncedHabits`: Gets all habits a user has synced to            │ │
│ │ leaderboards                                                             │ │
│ │ - `getUserHabitsForSync`: Gets user's habits available for syncing       │ │
│ │ - `updateLeaderboardEntries`: Updates all leaderboard entries (intended  │ │
│ │ for cron job)                                                            │ │
│ │                                                                          │ │
│ │ ### Helper Functions                                                     │ │
│ │                                                                          │ │
│ │ - `calculateStreak`: Calculates the current streak for an activity based │ │
│ │  on completion data                                                      │ │
│ │ - `seedInitialCategories`: Automatically seeds initial categories when   │ │
│ │ the app first accesses them                                              │ │
│ │        ```                                                                  │ │
│ │ ## Frontend Services                                                     │ │
│ │                                                                          │ │
│ │ The leaderboard API interactions are managed in                          │ │
│ │ `/frontend/src/services/leaderboard.js`, which provides these functions: │ │
│ │                                                                          │ │
│ │ - `fetchLeaderboardCategories`: Get all available categories             │ │
│ │ - `fetchCategoryEntries`: Get entries for a specific category            │ │
│ │ - `syncHabitToLeaderboard`: Connect a habit to a leaderboard             │ │
│ │ - `removeHabitFromLeaderboard`: Remove a habit from a leaderboard        │ │
│ │ - `suggestLeaderboardCategory`: Suggest a new category                   │ │
│ │ - `fetchUserSyncedHabits`: Get user's synced habits                      │ │
│ │ - `fetchUserHabitsForSync`: Get user's habits available for syncing      │ │
│ │                                                                          │ │
│ │ Each function handles API communication, error handling, and response    │ │
│ │ processing.                                                              │ │
│ │                                                                          │ │
│ │ ## Frontend Components                                                   │ │
│ │                                                                          │ │
│ │ The main leaderboard interface is in                                     │ │
│ │ `/frontend/src/components/Pages/LeaderboardPage.js`. It includes:        │ │
│ │                                                                          │ │
│ │ ### Main Views                                                           │ │
│ │ 1. **Categories Grid**: Shows all available leaderboard categories       │ │
│ │ 2. **Leaderboard View**: Displays rankings for a selected category       │ │
│ │ 3. **Sync Modal**: Allows users to select a habit to sync with a         │ │
│ │ category                                                                 │ │
│ │ 4. **New Category Modal**: Form to suggest new leaderboard categories    │ │
│ │                                                                          │ │
│ │ ### Key State Management                                                 │ │
│ │ - Tracking selected categories                                           │ │
│ │ - Managing sync modal state                                              │ │
│ │ - Handling habit selection                                               │ │
│ │ - Fetching and displaying leaderboard data                               │ │
│ │ - Error and loading states                                               │ │
│ │                                                                          │ │
│ │ ## Data Flow                                                             │ │
│ │                                                                          │ │
│ │ 1. **Initial Load**:                                                     │ │
│ │    - LeaderboardPage component mounts                                    │ │
│ │    - Categories are fetched from backend                                 │ │
│ │    - If no categories exist, they are auto-seeded                        │ │
│ │    - UI displays available categories                                    │ │
│ │                                                                          │ │
│ │ 2. **Category Selection**:                                               │ │
│ │    - User selects a category                                             │ │
│ │    - Backend fetches all entries for that category                       │ │
│ │    - Entries are sorted by streak and displayed                          │ │
│ │                                                                          │ │
│ │ 3. **Syncing a Habit**:                                                  │ │
│ │    - User clicks "Sync Your Habit" on a category                         │ │
│ │    - Modal shows user's available habits                                 │ │
│ │    - User selects a habit to sync                                        │ │
│ │    - Backend creates a LeaderboardEntry linking the user, habit, and     │ │
│ │ category                                                                 │ │
│ │    - Leaderboard refreshes to show the new entry                         │ │
│ │                                                                          │ │
│ │ 4. **Updating Streaks**:                                                 │ │
│ │    - When habits are marked complete, streaks are calculated             │ │
│ │    - These are automatically reflected in leaderboard rankings           │ │
│ │    - Rankings update automatically when data changes                     │ │
│ │                                                                          │ │
│ │ ## Feature Functionality                                                 │ │
│ │                                                                          │ │
│ │ ### Category System                                                      │ │
│ │ - **Predefined Categories**: System starts with common habit categories  │ │
│ │ - **Category Suggestions**: Users can suggest new categories             │ │
│ │ - **Approval System**: Suggestions require approval to become active     │ │
│ │                                                                          │ │
│ │ ### Streak Calculation                                                   │ │
│ │ - Based on consecutive days of completion                                │ │
│ │ - Breaks if user misses more than one day                                │ │
│ │ - Uses the same algorithm as the Streaks page                            │ │
│ │ - Updates automatically with habit completions                           │ │
│ │                                                                          │ │
│ │ ### User Privacy                                                         │ │
│ │ - Users control which habits they sync to leaderboards                   │ │
│ │ - Can remove habits from leaderboards at any time                        │ │
│ │ - Uses display name rather than email or full identity                   │ │
│ │                                                                          │ │
│ │ ### UI/UX Considerations                                                 │ │
│ │ - Consistent styling with the rest of the application                    │ │
│ │ - Responsive design for mobile and desktop                               │ │
│ │ - Clear feedback and loading states                                      │ │
│ │ - Error handling and user guidance                                       │ │
│ │                                                                          │ │
│ │ ## Future Enhancements                                                   │ │
│ │                                                                          │ │
│ │ 1. **Admin Dashboard**:                                                  │ │
│ │    - Interface for approving/rejecting category suggestions              │ │
│ │    - Managing existing categories                                        │ │
│ │    - Moderating leaderboard entries                                      │ │
│ │                                                                          │ │
│ │ 2. **Social Features**:                                                  │ │
│ │    - Friend connections between users                                    │ │
│ │    - Private leaderboards for friend groups                              │ │
│ │    - Challenges and competitions                                         │ │
│ │                                                                          │ │
│ │ 3. **Achievements**:                                                     │ │
│ │    - Badges and rewards for reaching milestones                          │ │
│ │    - Special recognition for long streaks                                │ │
│ │    - Weekly/monthly champions                                            │ │
│ │                                                                          │ │
│ │ 4. **Analytics**:                                                        │ │
│ │    - Trends in category popularity                                       │ │
│ │    - User engagement metrics                                             │ │
│ │    - Heat maps of active times/days                                      │ │
│ │                                                                          │ │
│ │ ---                                                                      │ │
│ │                                                                          │ │
│ │ ## Installation and Setup                                                │ │
│ │                                                                          │ │
│ │ To use the leaderboard feature:                                          │ │
│ │                                                                          │ │
│ │ 1. Make sure MongoDB is running or configured                            │ │
│ │ 2. Restart the backend server to load the new code                       │ │
│ │ 3. The system will automatically seed initial categories on first access │ │
│ │ 4. Frontend will automatically connect to the leaderboard endpoints      │ │
│ │                                                                          │ │
│ │ ## Troubleshooting                                                       │ │
│ │                                                                          │ │
│ │ - If categories don't appear, check MongoDB connection and restart the   │ │
│ │ backend                                                                  │ │
│ │ - If habits aren't appearing in the sync dialog, check the backend logs  │ │
│ │ for debug info                                                           │ │
│ │ - For activities that aren't marked as habits, use the fallback that     │ │
│ │ shows all activities 
```

    * **`NotFoundPage.js`**: Displays a 404 error for invalid routes.

### Backend Explanation

The backend is a Node.js application using the Express framework (`backend/server.js` [cite: 2]). It handles API requests, interacts with the database, and manages user authentication.

* **Core Components**:
    * **`server.js`**[cite: 2]: The main entry point. Sets up the Express app, middleware (CORS, JSON parsing), database connection, and API routes. Serves static frontend assets in production[cite: 2]. Loads environment variables based on `NODE_ENV`[cite: 2].
    * **`routes/api.js`**[cite: 6]: Defines all API endpoints (e.g., `/auth/login`, `/activities`, `/users/:userId`, `/countdown-events`). It maps these routes to specific controller functions and applies authentication middleware (`authMiddleware`) to protected routes[cite: 6].
    * **`controllers/`**[cite: 7]: Contain the logic for handling requests for each resource type (activities, auth, users, countdowns, etc.). Controllers interact with models to perform CRUD operations and prepare responses.
    * **`models/`**: Define Mongoose schemas for the data structures (User, Activity, CountdownEvent, CalendarEvent, PasswordResetToken). These schemas enforce data validation and structure before saving to MongoDB. `User.js` includes password hashing logic using `bcryptjs`.
    * **`middleware/auth.js`**: Middleware function used to protect routes. It verifies the JWT token (`x-auth-token` header) sent with requests. If valid, it attaches the user's information (`userId`, `email`) to the request object (`req.user`) for use in controllers.
    * **`config/db.js`**: Handles the connection to the MongoDB database using Mongoose. It reads the connection string from environment variables (`MONGODB_URI`) and includes logic to check the connection status (`isMongoConnected`).
    * **`storage/inMemoryStorage.js`**: Provides an in-memory data storage fallback used by controllers when the MongoDB connection fails, ensuring basic functionality even if the database is unavailable[cite: 7].

* **Communication Flow**:
    1.  **Frontend → Backend**: The React frontend makes HTTP requests (GET, POST, PUT, DELETE) to the API endpoints defined in `routes/api.js`[cite: 6]. API calls are typically initiated from service files (`frontend/src/services/`). For protected routes, the JWT token stored in `localStorage` is included in the `x-auth-token` header.
    2.  **Backend (Routing & Middleware)**: Express receives the request. It routes the request based on the URL path to the appropriate function in `routes/api.js`[cite: 6]. If the route is protected, the `authMiddleware` runs first to verify the JWT token.
    3.  **Backend (Controller)**: The matched controller function (e.g., `activitiesController.getActivities`) processes the request. It might extract data from the request body or parameters.
    4.  **Backend (Controller ↔ Model/DB)**: The controller interacts with the corresponding Mongoose model (e.g., `Activity.js`) to perform database operations (find, save, update, delete). The model interacts with the MongoDB database via the connection established in `db.js`. If the DB connection fails, controllers utilize the `inMemoryStorage` module as a fallback[cite: 7].
    5.  **Backend → Frontend**: The controller sends an HTTP response (usually JSON data or a status code) back to the frontend.
    6.  **Frontend (Handling Response)**: The frontend service receives the response. The component that initiated the request updates its state based on the response data, triggering a UI re-render. The `EventBus` is often used to notify other components (like `StreaksPage` or `InsightsPage`) about data changes (e.g., `activity-completion-changed`), allowing them to refresh their own data.

* **Authentication**: Uses JSON Web Tokens (JWT). On successful login/register, the backend (`authController`) generates a token signed with a secret key (`JWT_SECRET` [cite: 1]) and sends it to the frontend. The frontend stores this token in `localStorage` and sends it back in the `x-auth-token` header for subsequent requests to protected endpoints. The `authMiddleware` verifies this token on the backend.


## System Architecture

### Overview

The Weekly Habit Tracker follows a modern three-tier architecture:

1. **Frontend**: React-based client application
2. **Backend**: Node.js/Express API server
3. **Database**: MongoDB for persistent storage

The system includes multiple fallback mechanisms to ensure data availability even in offline scenarios:

```
User Request → Frontend → Backend API → MongoDB
                            ↓ (fallback)
                     In-memory Storage
          ↓ (client-side fallback)
    Browser localStorage
```

### Tech Stack

#### Backend
- **Node.js** with **Express.js** framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **cors** for cross-origin requests
- **dotenv** for environment variables

#### Frontend
- **React.js** Single Page Application
- **React Router** for navigation
- **Context API** for state management
- **Material UI** components
- **React Bootstrap**
- **react-dnd** for drag-and-drop functionality

### Authentication Flow

1. User registers or logs in through the frontend
2. Backend validates credentials and issues a JWT token
3. Token is stored in browser localStorage
4. All subsequent API requests include the token in the `x-auth-token` header
5. Protected routes verify the token before processing requests

## Data Models

### User

```javascript
{
  userId: String,        // Unique identifier
  name: String,          // User's display name
  email: String,         // Unique email address
  password: String,      // Hashed password
  avatar: String,        // Optional profile image
  goals: Array,          // User's goals
  theme: String,         // UI theme preference
  dailyTarget: String,   // Number of activities to complete daily
  joinDate: Date,        // When user joined
  bio: String            // Optional user biography
}
```

### Activity

```javascript
{
  name: String,          // Activity name
  duration: Number,      // Activity duration in minutes
  period: String,        // Morning, afternoon, or evening
  repeatDays: [Number],  // Days of week to repeat (0-6)
  isHabit: Boolean,      // Whether this is a habit
  userId: String,        // Owner of this activity
  daySpecificNotes: Boolean, // Enable day-specific notes
  notes: Object,         // General notes for activity
  recurringNotes: Object, // Recurring notes
  nextSessionNotes: Object // Notes for next session
}
```

### CountdownEvent

```javascript
{
  name: String,          // Event name
  date: Date,            // Event date
  description: String,   // Event description
  userId: String,        // Owner of this event
  color: String,         // UI color for this event
  isPublic: Boolean      // Whether this event is public
}
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local instance or Atlas cloud database)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd WeeklyHabitTracker
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

### Configuration

###  Drag and Drop impelementation

'Getting it to work' READTHIS FIRST 
Root Cause
The core issue is that the server is not persisting the order field in the database or including it in the response when the PUT /activities/:id endpoint is called. The client sends the order field in the request body (e.g., order: 0 for "Run 1.5 km", order: 30 for "read"), but the server either:

Ignores the order field during the update (possibly due to a schema mismatch or incorrect update logic).
Saves the order field but does not include it in the response.
Has a schema that does not define the order field, causing it to be stripped or ignored.
As a result, when loadActivities fetches the activities after the update, the order field is undefined for all activities, and the client-side sorting falls back to the _id field, causing the UI to display the activities in their original order (or an order based on _id).


Fix
To resolve this issue, you need to ensure that the server correctly handles the order field during the PUT /activities/:id update and includes it in the response. Below are the steps to fix the issue, including server-side and client-side changes.

1. Update Server-Side Logic
Assuming you’re using a Node.js/Express backend with MongoDB (based on the API structure), you need to verify and update the PUT /activities/:id endpoint to handle the order field correctly.

Steps:

Check the Schema: Ensure that the order field is defined in the MongoDB schema for the Activity model. If it’s not defined, MongoDB will ignore it when saving the document.
Update the Endpoint: Modify the endpoint to update the order field and return the updated document, including the order field.



⏺ Activity and Event Ordering System Implementation

  Overview

  We implemented a database-backed ordering system for both activities and
  events that ensures consistent positioning across views while maintaining
   drag-and-drop functionality. This allows activities to be positioned
  relative to fixed timeline events, with the ordering persisted in the
  database for cross-device synchronization.

  Problem Statement

  Previously, activity ordering was stored only in localStorage, which
  caused:
  1. Inconsistent ordering across different devices
  2. Loss of order data when clearing browser storage
  3. Inability to position activities relative to events in a consistent
  way
  4. No synchronization between HomePage and HabitsPage views

  Solution Architecture

  1. Database Schema Updates

  - Added order field to Activity model with default value of 0
  - Added order field to CountdownEvent model with default value of 0
  - Added order field to CalendarEvent model with default value of 0

  2. Pre-Save Hooks

  Implemented automatic order calculation in pre-save hooks:

  For CountdownEvent:
  // Add pre-save hook to calculate period and order based on time
  CountdownEventSchema.pre('save', function(next) {
    if (this.isAllDay) {
      this.period = null;
      this.order = -500; // Place all-day events at the top
    } else if (this.date) {
      const eventDate = new Date(this.date);
      const hour = eventDate.getHours();
      const minute = eventDate.getMinutes();

      // Calculate time-based order value
      const timeBasedOrder = hour * 60 + minute;

      // Determine period based on hour
      if (hour < 12) {
        this.period = 'morning';
        // Morning events: order -100 to -1 based on time
        this.order = -100 + (timeBasedOrder / (12 * 60)) * 100;
      } else if (hour < 17) { // 5 PM
        this.period = 'afternoon';
        // Afternoon events: order -100 to -1 based on time
        this.order = -100 + ((timeBasedOrder - 12 * 60) / (5 * 60)) * 100;
      } else {
        this.period = 'evening';
        // Evening events: order -100 to -1 based on time
        this.order = -100 + ((timeBasedOrder - 17 * 60) / (7 * 60)) * 100;
      }
    }
    next();
  });

  For CalendarEvent:
  // Similar pre-save hook to calculate order based on time
  CalendarEventSchema.pre('save', function(next) {
    if (this.startTime === 'All day') {
      this.order = -500;
    } else {
      // Time-based ordering logic
      // ...
    }
    next();
  });

  3. Frontend Order Management System

  HomePage.js Updates:
  - Replaced localStorage-based order retrieval with direct database order
  usage
  - Implemented optimistic UI updates for order changes
  - Added direct database updates for activity reordering
  - Updated period change logic to maintain order values

  HabitsPage.js Updates:
  - Updated to prioritize database-stored order values
  - Modified sorting logic to interleave events and activities by order
  - Preserved localStorage approach for future dates (hypothetical
  planning)
  - Added order awareness to event retrieval and conversion

  4. Sorting Logic

  For mixing events and activities in the same timeline:
  // Sort by order, using time-based order for events and database order 
  for habits
  periodItems.sort((a, b) => {
    // Get order values, accounting for undefined values
    const orderA = a.type === 'habit' ? (a.data.order || 0) : (a.data.order
   || -50);
    const orderB = b.type === 'habit' ? (b.data.order || 0) : (b.data.order
   || -50);

    return orderA - orderB;
  });

  5. Order Range Conventions

  We established consistent order ranges to ensure proper positioning:
  - Events: Negative order values (-500 to -1)
    - All-day events: -500
    - Time-based events: -100 to -1 (based on time of day)
  - Activities: Positive order values (0+)
    - Default: 0, 10, 20, 30, etc. (increments of 10)

  This ensures events appear in chronological order but always before
  user-arranged activities, allowing activities to be positioned relative
  to fixed time-based events.

  Key Benefits

  1. Cross-Device Synchronization: Activity ordering is now stored in the
  database and synced across devices
  2. Temporal Awareness: Events are automatically ordered by their time
  within periods
  3. Mixed Display: Events and activities appear together with proper
  ordering
  4. Flexible Positioning: Activities can be positioned before, after, or
  between events
  5. Persistent Arrangement: Order persists across sessions and devices
  6. View Synchronization: HabitsPage and HomePage now share the same
  ordering system
  7. Optimistic Updates: UI updates immediately while database changes
  happen in the background

  Implementation Notes

  - Future day ordering still uses localStorage to support hypothetical
  planning
  - The pre-save hooks automatically assign order values to new events
  - Negative order values for events ensure they appear before activities
  - The system maintains backward compatibility with existing data
  - Existing records need server restart to use the new schema changes

  Technical Design Decisions

  1. Used pre-save hooks rather than controller logic to ensure consistent
  order calculation
  2. Implemented time-based ordering for events (-100 to -1) to maintain
  chronological positioning
  3. Used separate order ranges for events vs. activities to maintain clear
   separation
  4. Created a specific sort function that handles both entity types
  together
  5. Preserved localStorage for future days as a feature rather than a
  limitation



#### Backend Configuration

Create a `.env` file in the backend directory:

```
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/habit-tracker
# For MongoDB Atlas, use:
# MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# Server Configuration
PORT=4000
NODE_ENV=development

# JWT Secret (for authentication)
JWT_SECRET=your-secret-key-here
```

#### Frontend Configuration

Create a `.env` file in the frontend directory:

```
REACT_APP_API_URL=http://localhost:4000/api
```

### Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```
For development with hot reload:
```bash
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

3. Access the application at http://localhost:3000

## API Documentation

### Authentication Endpoints

- **POST /api/auth/register** - Register a new user
  - Request body: `{ name, email, password }`
  - Returns: User data and JWT token

- **POST /api/auth/login** - Login an existing user
  - Request body: `{ email, password }`
  - Returns: User data and JWT token

- **GET /api/auth/me** - Get current user profile
  - Requires: `x-auth-token` header
  - Returns: User profile data

- **POST /api/auth/password-reset** - Request password reset
  - Request body: `{ email }`
  - Returns: Success message

- **POST /api/auth/password-reset/:token** - Reset password with token
  - Request body: `{ password }`
  - Returns: Success message

### Activities Endpoints

- **GET /api/activities** - Get all activities for a user
  - Required query params: `userId`
  - Requires: `x-auth-token` header

- **POST /api/activities** - Create a new activity
  - Request body: `{ name, duration, period, userId, repeatDays, isHabit, daySpecificNotes, notes }`
  - Requires: `x-auth-token` header

- **PUT /api/activities/:id** - Update an activity
  - Request body: Activity fields to update
  - Requires: `x-auth-token` header

- **DELETE /api/activities/:id** - Delete an activity
  - Requires: `x-auth-token` header

- **POST /api/activities/:id/complete** - Toggle activity completion
  - Request body: `{ userId, date }`
  - Requires: `x-auth-token` header

### Countdown Events Endpoints

- **GET /api/events** - Get all countdown events
  - Requires: `x-auth-token` header

- **POST /api/events** - Create a new countdown event
  - Request body: `{ name, date, description, color }`
  - Requires: `x-auth-token` header

- **GET /api/events/:id** - Get a countdown event
  - Requires: `x-auth-token` header

- **PUT /api/events/:id** - Update a countdown event
  - Request body: Event fields to update
  - Requires: `x-auth-token` header

- **DELETE /api/events/:id** - Delete a countdown event
  - Requires: `x-auth-token` header

### Users Endpoints

- **GET /api/users/profile** - Get user profile
  - Requires: `x-auth-token` header

- **PUT /api/users/profile** - Update user profile
  - Request body: Profile fields to update
  - Requires: `x-auth-token` header

- **PATCH /api/users/settings** - Update user settings
  - Request body: Settings to update
  - Requires: `x-auth-token` header

## Deployment

### VPS Deployment (Digital Ocean, AWS EC2, etc.)

1. Set up a VPS with Node.js and MongoDB
2. Clone the repository to your server
3. Configure environment variables including MongoDB connection
4. Use PM2 or similar for process management:
```bash
npm install -g pm2
cd backend
pm2 start server.js
```
5. For the frontend, build the production version:
```bash
cd frontend
npm run build
```
6. Serve the built frontend with nginx or similar

### MongoDB Setup

For a VPS deployment, you have two options:

1. **Local MongoDB on the VPS**:
```bash
# Install MongoDB on your VPS
sudo apt update
sudo apt install -y mongodb
sudo systemctl enable mongodb
sudo systemctl start mongodb
```

2. **MongoDB Atlas**:
   - Create a free MongoDB Atlas account
   - Set up a cluster and database
   - Get your connection string and update the `.env` file

## Troubleshooting

### MongoDB Connection Issues

If you have problems connecting to MongoDB:

1. Check your connection string in the `.env` file
2. Ensure MongoDB is running if using a local instance
3. Check network permissions (firewall, security groups)
4. The application will automatically fall back to in-memory storage

### Authentication Issues

If login or registration fails:

1. Check the server logs for detailed error messages
2. Ensure JWT_SECRET is properly set in the `.env` file
3. Check that the token is being properly stored in localStorage
4. Verify token is being sent with each request in the `x-auth-token` header

### CORS Issues

If you're experiencing cross-origin request problems:

1. Verify the frontend is connecting to the correct backend URL
2. Check that CORS is properly configured in the backend server
3. Ensure all API URLs are correctly formatted in the frontend

### Port Conflicts
- The backend runs on port 4000 by default
- The frontend runs on port 3000 by default
- If you have port conflicts, you can change these in the respective `.env` files

## Mobile App Development Strategy

Converting this web application to a mobile app would require significant effort due to the web-specific technologies used. Based on analysis, here's the recommended strategy for future mobile development:

### Recommended Approach

1. **Keep Backend As-Is**: 
   - The Express/MongoDB backend is already well-structured for API consumption
   - Authentication system can be reused with minor modifications

2. **Rebuild Frontend with React Native**:
   - Rather than converting existing components, rebuild the UI from scratch
   - Use React Native best practices and native UI components
   - Focus on mobile-friendly interaction patterns

3. **Reuse Business Logic**:
   - Extract and port core business logic from the web version
   - Maintain the same data models and API interfaces
   - Adapt localStorage persistence to use AsyncStorage

4. **Key Challenges to Address**:
   - Replace web-specific drag-and-drop with React Native gesture handlers
   - Redesign notifications for mobile platforms
   - Implement more robust offline sync capabilities
   - Enhance authentication with biometrics/secure storage

This approach will be more successful than a direct conversion attempt, as the web app makes extensive use of DOM APIs, CSS, and web-specific libraries that don't have direct equivalents in React Native.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Change log
Changes Made

Environment Configuration

Created separate environment files (.env.development and .env.production) for different deployment contexts
Modified server.js to load the appropriate environment file based on NODE_ENV
Set up proper MongoDB connection URI and JWT secret in environment files


Package Configuration

Updated frontend package.json with correct proxy setting ("proxy": "http://localhost:4000")
Removed conflicting root-level package.json and components.json
Added development and production scripts in backend package.json


API Configuration

Kept the relative API URL in frontend (API_URL = '/api') for flexibility across environments
Fixed port mismatches between frontend and backend


MongoDB Connection

Successfully connected to MongoDB Atlas
Implemented proper fallback to in-memory storage when MongoDB is unavailable

###
New Central Event system for updating habits synchronously on the habits page, the insights page and the streaks page 
 Here's a brief summary:
  - InsightsPage, StreaksPage, and HabitsPage all use the EventBus to
  listen for activity updates
  - api.js handles backend calls and publishes events through the EventBus
  when data changes
  - eventBus.js provides a publish/subscribe pattern for components to
  communicate without tight coupling

  very ample logging


### VPS SETUP 
Digital Ocean Deployment Plan
1. Server Setup

Create a Digital Ocean droplet (recommend Ubuntu 20.04 or newer)
Install Node.js (same version as your development environment)
Install PM2 for process management
Set up Nginx as a reverse proxy

2. Application Deployment

Clone your repository to the droplet
Create .env.production in the backend directory with production settings
Run npm install in both frontend and backend directories
Build the frontend with npm run build

3. Environment Configuration

Update .env.production with appropriate settings:
PORT=4000
NODE_ENV=production
MONGODB_URI=mongodb+srv://williamzachmorris:09XwE1w6akIYmfX1@habits.smzvges.mongodb.net/habits?retryWrites=true&w=majority&appName=habits
JWT_SECRET=x9Zs7w5uT2qO0mK8iG6eC4aY3bW1jL9p

Make sure your MongoDB Atlas IP whitelist includes your droplet's IP

4. Nginx Configuration

Set up Nginx to serve the static frontend files and proxy API requests:
nginxserver {
  listen 80;
  server_name yourdomain.com;  # Or your droplet's IP

  # Serve frontend static files
  location / {
    root /path/to/your/frontend/build;
    try_files $uri /index.html;
  }

  # Proxy API requests to Node.js backend
  location /api {
    proxy_pass http://localhost:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}


5. Starting the Application

Start the backend with PM2:
bashcd /path/to/backend
NODE_ENV=production pm2 start server.js --name "habit-tracker-api"
pm2 save
pm2 startup  # Follow instructions to enable PM2 on system boot


6. Security Considerations

Set up a firewall (UFW) allowing only ports 22 (SSH), 80 (HTTP), and 443 (HTTPS)
Consider adding HTTPS with Let's Encrypt
Secure MongoDB Atlas connection (ensure passwords are not in public repositories)
Consider using environment variables on the server instead of .env files

7. Testing

Test the full application flow after deployment
Verify all API endpoints work correctly
Test user registration and login
Ensure MongoDB connection is stable

This plan leverages your existing setup's strength of using relative API URLs and environment-specific configurations, making the transition to a VPS smooth and maintainable.