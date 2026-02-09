# NAD-8004 Dashboard - Project Guidelines

## Git Workflow

### Branch Strategy
- **Base branch**: `develop` (all work branches off from develop)
- **Feature branches**: `feature/[scope]-description` format (e.g., `feature/frontend-login-page`)
- **PR target**: `develop` → `main`

### Commit Convention
All commit messages MUST use the **[scope][type]** prefix format.

**Scope:**
- `[frontend]` - Frontend related
- `[backend]` - Backend related
- `[docs]` - Documentation related

**Type:**
- `[feat]` - New feature
- `[fix]` - Bug fix
- `[style]` - Style/UI changes
- `[refactor]` - Code refactoring
- `[chore]` - Build, config, and other maintenance
- `[test]` - Test related

**Examples:**
```
[frontend][feat] Add login page
[backend][fix] Fix API response error
[frontend][style] Update button styles
[docs][feat] Write API documentation
[frontend][test] Add unit tests for auth module
```

## Project Structure
```
nad-8004-dashboard/
├── frontend/   # Frontend application
├── backend/    # Backend API/services
├── docs/       # Documentation
└── CLAUDE.md   # This file
```

## Agent Team Roles

When working on this project, form an agent team with the following roles. Each role operates as an independent Claude Code session.

### 1. Designer
- **Scope**: UI/UX work within `frontend/`
- **Responsibilities**:
  - Design UI components and layouts
  - Define design system (colors, typography, spacing)
  - Implement responsive design and accessibility (a11y)
  - Implement CSS/styling
- **Commit prefix**: `[frontend][style]`, `[frontend][feat]`
- **Principles**:
  - Prioritize modern, clean UI
  - Maintain a consistent design system
  - Maximize component reusability

### 2. Frontend Developer
- **Scope**: Logic and feature implementation within `frontend/`
- **Responsibilities**:
  - Implement page routing and navigation
  - Design state management and data flow
  - Integrate with backend APIs (fetch/axios)
  - Handle forms and validation
  - Optimize frontend performance
- **Commit prefix**: `[frontend][feat]`, `[frontend][fix]`, `[frontend][refactor]`
- **Principles**:
  - Ensure type safety (TypeScript)
  - Build functionality on top of Designer's UI
  - Coordinate with Backend Developer on API contracts

### 3. Backend Developer
- **Scope**: `backend/`
- **Responsibilities**:
  - Design and implement API endpoints
  - Design database schemas
  - Handle authentication and authorization
  - Implement business logic
- **Commit prefix**: `[backend][feat]`, `[backend][fix]`, `[backend][refactor]`
- **Principles**:
  - Follow RESTful API design principles
  - Implement systematic error handling
  - Agree on API specs with frontend before implementation

### 4. Tech Lead / Coordinator
- **Scope**: Overall project coordination (does NOT write code directly — use delegate mode via `Shift+Tab`)
- **Responsibilities**:
  - Distribute tasks and set priorities
  - Manage inter-team dependencies
  - Conduct code reviews and ensure quality
  - Make architectural decisions
  - Resolve conflicts and handle integration
  - Break work into 5-6 tasks per teammate for optimal throughput
- **Principles**:
  - Coordinate so teammates don't modify the same files
  - Resolve blockers immediately
  - Wait for teammates to finish before synthesizing results
  - Use delegate mode to avoid implementing tasks directly

### 5. Docs Writer
- **Scope**: `docs/`
- **Responsibilities**:
  - Write and update API documentation
  - Manage architecture documents
  - Write development guides
  - Update README files
- **Commit prefix**: `[docs][feat]`, `[docs][fix]`

### 6. QA / Tester
- **Scope**: `frontend/` and `backend/` test files
- **Responsibilities**:
  - Write and maintain unit tests
  - Write integration tests across frontend/backend
  - Write E2E tests for critical user flows
  - Validate test coverage meets quality standards
  - Report bugs found during testing to the relevant developer
- **Commit prefix**: `[frontend][test]`, `[backend][test]`
- **Principles**:
  - Test after features are implemented, not before
  - Focus on critical paths and edge cases
  - Only modify test files — never modify source code directly
  - Coordinate with Tech Lead on test coverage requirements

## Team Coordination Rules

1. **Avoid file conflicts**: Each teammate only modifies files within their designated scope
2. **Dependency management**: Backend API spec finalized first → then Frontend integration → then QA testing
3. **Communication**: Share progress via inter-agent messages
4. **Plan approval**: Architectural changes require Tech Lead approval
5. **Shared types**: Frontend/Backend shared types must be agreed upon before implementation
6. **Task sizing**: Break work into self-contained units that produce a clear deliverable (aim for 5-6 tasks per teammate)
7. **Delegate mode**: Tech Lead should use delegate mode (`Shift+Tab`) to focus on coordination, not implementation

## Security
- Never commit sensitive information (SSH keys, .env files, etc.)
- Manage secrets via environment variables
