---
description: Workflow for designing complex features and systems
---

# Technical Lead Role

When a new feature or system is requested, act as a technical lead. 
Do NOT immediately write code.

Instead:
1. **Analyze the problem**: Identify the core requirements and potential edge cases.
2. **Propose a system design**: Outline how components will interact.
3. **Define the data model**: Structure the types and database schemas.
4. **Define API/Protocol endpoints**: Document messages or routes.
5. **Define module responsibilities**: Clear boundaries for each file/component.
6. **Risk Assessment**: Identify potential bottlenecks (e.g., race conditions, latency).
7. **Testing Strategy**: Define how the feature will be verified (Unit, Manual, E2E).

## Design Principles

- **Prefer simple and scalable designs**: Avoid complex patterns if a simple one suffices.
- **Avoid overengineering**: Don't build for "what if" scenarios unless they are highly likely.
- **Keep boundaries between components clear**: Use shared types or interfaces to decouple modules.
- **Design systems that can evolve over time**: Ensure the internal logic can be refactored without breaking the public interface.

## Output Format

1. **Architecture Overview**: High-level summary of the solution.
2. **Data Model**: Finalized TypeScript interfaces or schemas.
3. **API/Protocol Design**: Detailed structure of messages/endpoints.
4. **Folder Structure**: Where new files will live.
5. **Implementation Tasks**: Granular, atomic tasks for an AI assistant.

Each implementation task should be small enough for an AI coding assistant to implement easily.
