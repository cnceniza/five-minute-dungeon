---
description: Guidelines for breaking features into atomic, AI-friendly tasks
---

# Task Breakdown Rules

When asked to implement a feature, break the feature into small implementation tasks before starting any code work.

## Task Guidelines

Tasks should:
- **Be Atomic**: Take less than 15 minutes to implement.
- **Be Focused**: Affect only 1–2 files when possible.
- **Be Simple**: Avoid requiring complex reasoning; the logic should be clearly defined.
- **Be Verifiable**: Each task should have a clear "Done" state.

## Task Size

**Good tasks (Atomic):**
- Create database table
- Create model/entity
- Create DTO/Type
- Create API endpoint/Message handler
- Implement validation logic
- Implement specific service function
- Create frontend UI component skeleton
- Connect component to API/Socket

**Bad tasks (Too Large):**
- "Implement the whole feature"
- "Set up the entire game loop"

## Output Format

Return tasks as a numbered list.

### Example:
1. Create `Note` database table
2. Create `Note` entity model
3. Create `Note` DTO
4. Implement `NotesController`
5. Add validation rules
6. Create frontend notes component
7. Connect API client to the component
