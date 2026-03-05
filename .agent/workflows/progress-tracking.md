---
description: Policy for tracking progress in mvp-plan.md and task.md
---

# Progress Tracking Workflow

To ensure the user and the AI are always in sync, the following rules MUST be followed:

1.  **Real-time Updates**: Update the `mvp-plan.md` and the `task.md` artifact IMMEDIATELY after completing a subtask or a significant code change.
2.  **No Waiting for Approval**: Do not wait for a new turn or explicit user confirmation to mark a task as "Done" if the code has been written and verified.
3.  **Atomic Edits**: When performing a `replace_file_content` call for code, consider if a corresponding update to the `.md` progress files should be made in the same turn.
4.  **Legend Accuracy**: Ensure the symbols in `mvp-plan.md` (e.g., `[x]`, `[/]`, `[ ]`) accurately reflect the current state of the branch.
