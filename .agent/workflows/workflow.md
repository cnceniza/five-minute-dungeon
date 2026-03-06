---
description: Master workflow for feature implementation
---

# AI Development Workflow

Follow this workflow strictly when implementing new features to ensure consistency and production-grade quality.

## Step 1 — Understand & Branch
- Analyze the feature request.
- **Action**: Create a new feature branch using the `git-workflow.md` standards.

## Step 2 — Architecture Planning (Tech Lead Role)
- Use the `tech-lead.md` and `architecture.md` guidelines.
- Define:
  - Data model (Types)
  - API/Protocol endpoints
  - Module responsibilities (Separation of concerns)

## Step 3 — Task Breakdown
- Use the `task-breakdown.md` guidelines.
- Break the feature into small implementation tasks (<15 mins each).
- Update the `task.md` artifact with these subtasks.

## Step 4 — Implementation
- Implement tasks sequentially.
- Follow `coding-standards.md` (Clarity, TS Strictness, Error Handling).
- Keep code production-ready at every step.

## Step 5 — Review & Verification
- **Action**: Follow the `code-review.md` workflow strictly.
- Check for edge cases and naming clarity.
- Ensure the code follows the `architecture.md` layers.
- Notify the user of completion and provide a Pull Request link.

## 🛠️ Troubleshooting & Debugging
If a test fails or a bug is reported during any step:
- **Action**: Follow the `debugging.md` workflow strictly.
- **Action**: Do not proceed to the next feature task until the bug is resolved and verified.

## Goal
Produce clean, maintainable, production-ready code in small, incremental, and verifiable steps.
