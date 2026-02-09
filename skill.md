# NAD-8004 Dashboard - Project Skills & Guidelines

## Project Overview
NAD-8004 Dashboard is a full-stack hackathon project with separate frontend, backend, and documentation components.

## Repository Structure
```
nad-8004-dashboard/
├── docs/       # Project documentation
├── frontend/   # Frontend application
├── backend/    # Backend API/services
└── .ssh/       # SSH keys (gitignored)
```

## Development Guidelines

### Git Workflow
- Use feature branches for new features
- Commit messages should be descriptive
- Always include co-author line: `Co-Authored-By: Warp <agent@warp.dev>`
- This repository uses a specific SSH key (`.ssh/ai-agent-deploy-key`)

### SSH Configuration
- SSH key is stored in `.ssh/ai-agent-deploy-key` (repo-specific)
- Git config uses local settings (not global)
- Never commit SSH keys (protected by .gitignore)

### Code Style
- Use consistent formatting across all subprojects
- Follow language-specific best practices
- Document all major functions and APIs

## Security
- SSH keys are repo-specific and gitignored
- No secrets should be committed to the repository
- Use environment variables for sensitive data

## Getting Started
1. Clone the repository
2. Review README files in each subdirectory
3. Set up local environment for frontend and backend
4. Follow deployment guidelines in docs/
