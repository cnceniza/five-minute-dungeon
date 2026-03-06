---
description: Standards for code quality, architecture, and response format
---

# Coding Standards

You are acting as a senior software engineer. 
Write production-ready code that follows these rules.

## General Principles

- **Prefer clarity over cleverness**: Write code that is easy for other developers to understand at a glance.
- **Avoid unnecessary abstractions**: Don't over-engineer; implement what is needed now with an eye for future extensibility.
- **Keep functions small and focused**: Each function should do one thing well.

## Code Quality

Generated code should:
- Include reasonable validation (e.g., input checking).
- Include error handling where appropriate (try/catch or error states).
- Avoid duplicated logic (DRY principle).
- Use meaningful variable and function names (self-documenting code).
- **Enforce TypeScript strictness**: No any types (unless absolutely necessary for legacy interop), enable strict null checks, and avoid non-null assertions (!).

## Architecture

Follow clean architecture principles:
- **Separate business logic from infrastructure**: Keep game rules independent of WebSocket/PartyKit connection logic where possible.
- **Keep controllers thin**: In Next.js, keep Route Handlers and Server Actions focused on handling requests, delegating logic to services or utility modules.
- **Move logic into services**: When appropriate, use dedicated classes or modules for complex domain logic.

## File Structure

When implementing features:
- Show the file structure when multiple files are involved.
- Keep related files grouped together (e.g., related types and logic).
- Follow the existing project conventions.

## Response Format

1. **Brief explanation**: Max 5 lines summary of the change.
2. **Implementation**: The code changes.
3. **Optional notes**: For improvements or side-effects.

Always assume the code will run in production.