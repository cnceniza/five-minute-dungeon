---
description: Guidelines for system architecture and layered responsibilities
---

# Architecture Guidelines

Follow these architecture principles when generating code to ensure maintainability and separation of concerns.

## Backend (PartyKit & Next.js)

### PartyKit Server / API Routes (Controllers)
- **Role**: Entry points for the application.
- **Responsibilities**: 
  - Manage WebSocket connections/HTTP requests.
  - Basic input validation.
  - Delegate core business logic to services.
  - Format/Send responses or broadcasts.

### Services / Domain Logic
- **Role**: The "Brain" of the feature.
- **Responsibilities**:
  - Implement complex game rules (e.g., card play validation).
  - Manage game state transitions.
  - Coordinate between multiple data sources.
  - **Rule**: Should be independent of the "Transport" layer (PartyKit vs HTTP).

### Data Access Layer (Repositories/Supabase)
- **Role**: Persistence and external data.
- **Responsibilities**:
  - CRUD operations on Supabase/PostgreSQL.
  - Wrapping Supabase client calls.
  - **Rule**: Should not contain business logic; just data retrieval and storage.

## Frontend (Next.js App Router)

### UI Components
- **Role**: Presentation and user interaction.
- **Responsibilities**: Small, reusable, and focused strictly on the UI.
- **Rule**: Prefer "Dumb" components that take props; minimize logic inside JSX.

### State Management
- **Role**: Client-side data orchestration.
- **Responsibilities**:
  - Keep global state minimal.
  - Use `usePartySocket` for real-time game state.
  - Prefer local component state (`useState`) when possible.

### API/Client Layer
- **Role**: Communication with the backend.
- **Responsibilities**:
  - Centralize WebSocket hooks and Supabase client calls.
  - Separate API interaction from UI logic.

## General Principles
- **Loose Coupling**: Modules should interact through well-defined interfaces/types.
- **Composition over Inheritance**: Prefer building complex objects by combining simpler ones.
- **Evolutionary Design**: Structure code so that logic can be refactored without breaking the public protocol.
