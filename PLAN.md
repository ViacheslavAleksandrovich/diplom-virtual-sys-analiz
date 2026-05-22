# plan.md

# Virtual Training Simulator for the Distance Course "System Analysis"

## Project Goal

Develop an interactive web-based virtual training simulator for the distance-learning course **"System Analysis"** with:
- theoretical materials,
- interactive practical tasks,
- automatic answer checking,
- analytics and reporting,
- role-based access,
- gamification elements,
- support for the Analytic Hierarchy Process (AHP).

The system must support:
- students,
- teachers,
- administrators.

Architecture must follow a **Three-Tier Client–Server Architecture**.

---

# 1. Technology Stack

## Frontend
- React
- React Router
- Axios
- Context API or Redux Toolkit
- MathJax
- CSS Modules or Tailwind CSS

## Backend
- Python
- Django
- Django REST Framework
- JWT Authentication
- Celery (optional for async tasks)
- PostgreSQL ORM support

## Database
- PostgreSQL

## DevOps / Infrastructure
- Docker
- Docker Compose
- Nginx
- GitHub Actions (CI/CD)

---

# 2. System Architecture

## Presentation Tier (Frontend)
Responsibilities:
- UI rendering
- routing
- task interaction
- progress visualization
- API communication

Main components:
- Sidebar
- TheoryViewer
- TaskRunner
- FeedbackPanel
- StudentDashboard
- TeacherPanel

---

## Logic Tier (Backend)
Responsibilities:
- authentication
- business logic
- answer checking
- analytics
- reporting
- permissions

Apps:
- auth_app
- course_app
- checker_app
- analytics_app
- gamification_app

---

## Data Tier (Database)
Responsibilities:
- persistent storage
- analytics aggregation
- transaction integrity
- user progress tracking

Database:
- PostgreSQL

---

# 3. Functional Requirements

## Authentication
Features:
- registration
- login/logout
- JWT authorization
- password recovery
- role permissions

Roles:
- Student
- Teacher
- Admin

---

## Course System
Features:
- course modules
- theory materials
- multimedia attachments
- module ordering
- activation/deactivation

---

## Practical Tasks
Task types:
- quizzes/tests
- calculation tasks
- AHP matrix tasks
- model-building tasks

Difficulty levels:
- Level 1 — Reproductive
- Level 2 — Analytical
- Level 3 — Creative

---

## Automatic Checking
System must:
- validate answers
- calculate scores
- support tolerance ±0.01
- evaluate AHP consistency ratio (CR)
- provide pedagogical feedback

---

## Analytics
Features:
- student progress tracking
- module completion tracking
- task statistics
- average attempts
- success rates
- teacher reports and test outcome breakdowns

---

## Gamification
Features:
- achievements
- badges
- rankings
- bonus points

---

# 4. Database Design

## Tables

### Users
Fields:
- id
- username
- email
- password_hash
- role
- created_at
- is_active

---

### Groups
Fields:
- id
- title
- academic_year
- teacher_id

---

### CourseModules
Fields:
- id
- title
- description
- order_number
- is_active

---

### TheoryMaterials
Fields:
- id
- module_id
- title
- html_content
- attachments

---

### Tasks
Fields:
- id
- module_id
- type
- difficulty_level
- condition_text
- reference_answer
- explanation
- tolerance

---

### TaskResults
Fields:
- id
- student_id
- task_id
- submitted_answer
- status
- score
- started_at
- completed_at
- attempts_count

---

### ModuleProgress
Fields:
- id
- student_id
- module_id
- completion_percent
- total_score
- status

---

### Achievements
Fields:
- id
- title
- condition
- icon

---

# 5. API Design

## Authentication API
Endpoints:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout

---

## Course API
Endpoints:
- GET /api/modules
- GET /api/modules/:id
- GET /api/tasks/:id
- GET /api/theory/:id

---

## Task API
Endpoints:
- POST /api/tasks/:id/submit
- GET /api/results/:id
- GET /api/progress

---

## Teacher API
Endpoints:
- GET /api/teacher/statistics
- POST /api/tasks/create
- PUT /api/tasks/:id
- DELETE /api/tasks/:id

---

# 6. Frontend Structure

## Pages
- LoginPage
- RegisterPage
- DashboardPage
- ModulePage
- TaskPage
- TeacherDashboard
- AdminDashboard

---

## Components

### Sidebar
Functions:
- module navigation
- progress indicators

### TheoryViewer
Functions:
- render HTML theory
- display formulas via MathJax

### TaskRunner
Functions:
- dynamic task rendering
- matrix input
- drag-and-drop hierarchy builder

### FeedbackPanel
Functions:
- show score
- show explanation
- show correct solution

### StudentDashboard
Functions:
- charts
- achievements
- recommendations

### TeacherPanel
Functions:
- group statistics
- task management
- analytics

---

# 7. AHP (Analytic Hierarchy Process) Module

## Features
System must:
- accept pairwise comparison matrices
- calculate priority vectors
- calculate consistency index
- calculate consistency ratio (CR)
- compare with reference solution

---

## Validation Rules
- acceptable error ±0.01
- CR threshold validation
- normalization correctness

---

# 8. Learning Methodology Logic

## Learning Flow

### Phase 1 — Learn
Features:
- theory reading
- comprehension checks

---

### Phase 2 — Practice
Features:
- unlimited attempts
- hints
- demo solution after third failure

---

### Phase 3 — Assess
Features:
- limited attempts
- timer
- grade submission to journal

---

# 9. Scoring System

## Score Rules
- first attempt → 100%
- second attempt → 70%
- third+ attempts → 50%
- hint used → 80% multiplier

---

## Completion Conditions

### Module Completion
Requirements:
- 80% theory viewed
- 70% practical tasks completed
- 60% assessment score

---

### Course Completion
Requirements:
- all modules completed
- overall score ≥ 60%
- at least one Level 3 task completed per module

---

# 10. Security Requirements

Must implement:
- JWT authorization
- RBAC permissions
- password hashing
- protected API routes
- input validation
- CSRF protection
- XSS protection
- SQL injection protection

---

# 11. Performance Requirements

Requirements:
- response time ≤ 2 seconds
- scalable architecture
- pagination support
- optimized SQL queries

---

# 12. Browser Compatibility

Must support:
- Chrome
- Firefox
- Edge
- Safari

(last two versions)

---

# 13. Development Phases

# Phase 1 — Project Initialization
Tasks:
- initialize repositories
- configure Docker
- setup Django project
- setup React project
- configure PostgreSQL
- configure environment variables

Deliverables:
- working local environment

---

# Phase 2 — Authentication System
Tasks:
- JWT auth
- registration/login
- RBAC roles
- protected routes

Deliverables:
- full auth flow

---

# Phase 3 — Database & Backend Core
Tasks:
- create models
- migrations
- serializers
- REST API
- permissions

Deliverables:
- stable backend API

---

# Phase 4 — Frontend Core
Tasks:
- routing
- layouts
- navigation
- API integration
- state management

Deliverables:
- functional SPA frontend

---

# Phase 5 — Theory Module
Tasks:
- theory viewer
- MathJax integration
- multimedia support

Deliverables:
- interactive learning module

---

# Phase 6 — Task System
Tasks:
- quiz engine
- calculation tasks
- matrix input
- drag-and-drop hierarchy builder

Deliverables:
- interactive practice environment

---

# Phase 7 — Automatic Checker
Tasks:
- answer validation
- AHP calculations
- scoring logic
- feedback generation

Deliverables:
- intelligent checking engine

---

# Phase 8 — Analytics & Progress
Tasks:
- dashboards
- statistics
- reports
- progress tracking

Deliverables:
- analytics system

---

# Phase 9 — Gamification
Tasks:
- achievements
- rankings
- bonus system

Deliverables:
- motivation system

---

# Phase 10 — Testing
Tasks:
- backend tests
- frontend tests
- API tests
- security testing
- browser compatibility testing

Deliverables:
- stable release candidate

---

# Phase 11 — Deployment
Tasks:
- production Docker setup
- Nginx configuration
- CI/CD pipeline
- HTTPS setup
- backup automation

Deliverables:
- production-ready application

---

# 14. Recommended Project Structure

## Backend
/backend
    /apps
        /auth_app
        /course_app
        /checker_app
        /analytics_app
        /gamification_app
    /config
    /requirements

---

## Frontend
/frontend
    /src
        /pages
        /components
        /layouts
        /services
        /hooks
        /store
        /utils

---

# 15. Final Result

The final system must provide:
- a complete online learning platform,
- interactive practical training,
- automatic knowledge assessment,
- detailed analytics,
- scalable architecture,
- support for distance education workflows,
- modern responsive UI,
- maintainable modular codebase.