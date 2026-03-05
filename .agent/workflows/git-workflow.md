---
description: Branch-based development and Pull Request workflow
---

# Git Workflow: Feature Branches & Pull Requests

To ensure the stability of the production environment and maintain a clean commit history, all development MUST follow this workflow:

1.  **Branch Creation**: ALWAYS create a new feature branch for every task or user request.
    - Format: `feat/[task-description]` or `fix/[bug-description]`.
    - Command: `git checkout -b feat/task-name`
2.  **No Direct Pushes to Main**: Never push code directly to the `main` branch.
3.  **Pull Requests**: When a task is complete and verified:
    - Push the feature branch to the remote origin.
    - Notify the user with a link to create a Pull Request on GitHub.
    - ONLY merge the code into `main` after the user has reviewed and explicitly approved/merged on GitHub.
4.  **Cleanup**: After a merge, delete the local feature branch and switch back to `main` for the next task.
