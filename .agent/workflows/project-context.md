# Project Context

This project is a production-grade software application: **5 Minute Dungeon (Web Version)**.

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **State management**: React Hooks (useState/useContext) + PartySocket (for real-time synchronization)

### Backend
- **Framework**: PartyKit (Real-time Game Logic) & Next.js API Routes (Persistence/Auth)
- **Language**: TypeScript
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)

### Infrastructure
- **Frontend Hosting**: Vercel (optimized for Next.js)
- **Real-time Server**: PartyKit Cloud (deployed to Cloudflare's Edge)
- **Database & Auth**: Supabase Cloud
- **Communication**: 
  - Real-time: JSON over WebSockets (via PartyKit)
  - Persistence/Auth: Supabase Client SDK (PostgREST)

## Engineering Goals

The project prioritizes:
- **Maintainable code**: Modular structure with clear separation of concerns.
- **Scalable architecture**: Real-time state handled by specialized servers (PartyKit).
- **Simple and readable implementations**: Avoid "clever" code; prefer clarity.
- **Minimal technical debt**: Use proper TypeScript types and follow linter/formatter rules.

## General Rules

- **Avoid unnecessary dependencies**: Leverage built-in Next.js and PartyKit features first.
- **Prefer built-in framework features**: Use App Router, Server Components, and PartyKit class-based servers.
- **Follow established conventions**: Use the existing `lib/supabase`, `party/`, and `types/` folder structures.
- **Keep modules loosely coupled**: Game logic should be independent of the UI rendering.

When generating code, assume this is a real production application.
