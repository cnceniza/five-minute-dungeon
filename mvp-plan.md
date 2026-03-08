# 5 Minute Dungeon — Web Game MVP Plan

> **Stack:** Next.js (App Router) · PartyKit · Supabase  
> **Goal:** A fully functional, production-ready multiplayer web game MVP  
> **Philosophy:** Build the real-time core first. Layer in persistence, auth, and polish after the game loop is proven.

---

## Legend

- `[ ]` — To do
- `[x]` — Complete
- `[~]` — In progress
- `[!]` — Blocked / needs decision

---

## Step 1 — Project Scaffold & Tooling

> **Goal:** All three services (Next.js, PartyKit, Supabase) are installed, connected, and verified working together before any game logic is written. No surprises later.

### 1.1 Repository Setup

- [x] Create a new GitHub repository with a meaningful name
- [x] Initialize with a `.gitignore` for Node.js, `.env` files, and build artifacts
- [x] Set up branch strategy: `main` (production), `dev` (integration), feature branches per step
- [x] Add a root-level `README.md` with project description and local setup instructions
- [~] Enable GitHub branch protection on `main` (require PRs, no force push) (Skipped for now)

### 1.2 Next.js Initialization

- [x] Scaffold project using `create-next-app` with TypeScript, App Router, ESLint, and Tailwind CSS
- [x] Remove all boilerplate (default page content, global CSS resets, placeholder components)
- [x] Verify the dev server runs cleanly with zero errors or warnings
- [x] Configure `tsconfig.json` with strict mode enabled
- [x] Configure `next.config.ts` with any known environment variable validation at build time
- [x] Set up path aliases in `tsconfig.json` (e.g. `@/components`, `@/lib`, `@/types`)

### 1.3 Code Quality Tooling

- [x] Install and configure **Prettier** with a `.prettierrc` (consistent formatting across the team)
- [x] Extend ESLint config with `eslint-config-prettier` to avoid conflicts
- [x] Install **Husky** and **lint-staged** for pre-commit hooks
  - [x] Pre-commit: run Prettier format + ESLint fix on staged files
- [x] Install **commitlint** and enforce conventional commit messages (`feat:`, `fix:`, `chore:` etc.)
- [x] Verify hooks fire correctly on a test commit

### 1.4 Folder Structure

- [x] Establish and document the project folder structure before writing any feature code:
  ```
  app/                    → Next.js App Router pages
  components/             → Reusable UI components
    ui/                   → Primitive components (Button, Card, Badge, etc.)
    game/                 → Game-specific components
    lobby/                → Lobby-specific components
  lib/                    → Utility functions, helpers, constants
    partykit/             → PartyKit client helpers
    supabase/             → Supabase client helpers
    game/                 → Game logic (pure functions, no side effects)
  types/                  → Shared TypeScript type definitions
  hooks/                  → Custom React hooks
  party/                  → PartyKit server files
  public/                 → Static assets
  ```
- [x] Add a `types/index.ts` file as the single source of truth for all shared types (start empty, fill as you build)

### 1.5 Environment Variables

- [x] Create `.env.local` for local development secrets
- [x] Create `.env.example` with all required variable keys but no values (commit this)
- [x] Add `.env.local` to `.gitignore` — verify it is not tracked
- [x] Document each environment variable in `.env.example` with a comment explaining what it is and where to get it
- [x] Required variables to define now (values filled in later steps):
  - `NEXT_PUBLIC_PARTYKIT_HOST`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side only, never expose to client)

### 1.6 PartyKit Installation & Hello World

- [x] Install `partykit` and `partysocket` packages
- [x] Create `party/index.ts` — the main PartyKit server file
- [x] Write the minimal server: accept a connection, receive a message, echo it back to all connections
- [x] Configure `partykit.json` with project name and entry point
- [x] Run `npx partykit dev` and verify the local PartyKit server starts
- [x] Write a throwaway test page in Next.js that connects to the local PartyKit server, sends a message, and displays the echo response
- [x] Verify bi-directional communication works in the browser
- [x] Delete the throwaway test page after verification

### 1.7 Supabase Installation & Hello World

- [x] Create a new Supabase project via the dashboard
- [x] Install `@supabase/supabase-js`
- [x] Create `lib/supabase/client.ts` — browser Supabase client (using anon key)
- [x] Create `lib/supabase/server.ts` — server-side Supabase client (using service role key, for API routes only)
- [x] Write a throwaway test: query a dummy table or use `supabase.from('...').select()` and log the response
- [x] Verify the Supabase connection returns a response (even an empty array is fine)
- [x] Delete throwaway test after verification

### 1.8 Deployment Baseline

- [x] Create a **Vercel** project linked to the GitHub repository
- [x] Add all environment variables to Vercel's project settings
- [x] Deploy the empty scaffold to Vercel — verify it builds and loads in production
- [x] Deploy the PartyKit server to Cloudflare via `npx partykit deploy`
- [x] Update `NEXT_PUBLIC_PARTYKIT_HOST` in Vercel to point to the deployed PartyKit URL
- [x] Smoke test: production build connects to deployed PartyKit (use the throwaway test temporarily if needed)
- [x] Set up automatic Vercel deployments on push to `main`

### ✅ Step 1 Done When:

- Dev server runs cleanly with no errors
- PartyKit echoes messages in the browser locally and in production
- Supabase responds to a query locally
- Production deployment exists on Vercel
- All environment variables are documented

---

## Step 2 — PartyKit Game Server (Core Logic)

> **Goal:** The entire game state machine lives on the PartyKit server and works correctly. This step has zero UI. Build and test game logic in isolation before rendering it.

### 2.1 Define Game Types

- [x] In `types/index.ts`, define all shared TypeScript interfaces:
  - [x] `Player` — id, name, hand (array of cards), isReady, isConnected
  - [x] `Card` — id, name, type (e.g. sword, shield, scroll, etc.), value
  - [x] `DungeonBoss` — id, name, requiredCards (what combination defeats it), currentHp (or resistance tracker)
  - [x] `GameRoom` — roomId, players, currentBoss, deck (remaining cards), phase, timer, winner
  - [x] `GamePhase` — `"waiting"` | `"countdown"` | `"playing"` | `"won"` | `"lost"`
  - [x] `ServerMessage` — a discriminated union of all messages the server can send to clients
  - [x] `ClientMessage` — a discriminated union of all messages clients can send to the server
- [x] Review types with the lens of: "can I serialize and deserialize this as JSON?" — adjust any types that can't be

### 2.2 Define the Message Protocol

- [x] Document every message type the server sends (outbound) and receives (inbound) before writing any code
- [x] Outbound (server → all clients):
  - [x] `state_update` — full game state snapshot sent after every action
  - [x] `player_joined` — a new player connected to the room
  - [x] `player_left` — a player disconnected
  - [x] `game_started` — game transitioned from waiting to playing
  - [x] `timer_tick` — authoritative countdown value (sent every second from the server)
  - [x] `game_over` — win or loss with reason
  - [x] `error` — invalid action attempted, with reason
- [x] Inbound (client → server):
  - [x] `set_name` — player sets their display name
  - [x] `set_ready` — player toggles their ready status
  - [x] `play_card` — player plays a card from their hand
  - [x] `use_ability` — player uses hero special ability (costs 3 discards)
  - [x] `request_state` — client requests a full state resync (for reconnection)

### 2.3 Server State Management

- [x] Set up the PartyKit server class in `party/index.ts`
- [x] Initialize `gameState` as an in-memory object on the server class (this persists for the lifetime of the room)
- [x] Implement `getInitialState(roomId: string): GameRoom` — a pure function that returns a fresh game state
- [x] Implement `onConnect(connection, room)`:
  - [x] Add the new player to state with a generated player ID
  - [x] Send the new player the full current game state immediately (`request_state` pattern)
  - [x] Broadcast `player_joined` to all other connections
- [x] Implement `onClose(connection, room)`:
  - [x] Mark the player as disconnected in state (don't remove — they may reconnect)
  - [x] If no players remain, reset room state after a grace period (e.g. 30 seconds)
  - [x] Broadcast `player_left` to remaining connections
- [x] Implement `onMessage(message, sender, room)`:
  - [x] Parse message as JSON — wrap in try/catch, send `error` back to sender on parse failure
  - [x] Dispatch to handler based on `message.type` using a switch statement
  - [x] After every state mutation, call a `broadcastState()` helper

### 2.4 Implement Game Logic — Pure Functions

- [ ] Create `lib/game/deck.ts`:
  - [ ] `createDeck(): Card[]` — generates the full card deck
  - [ ] `shuffleDeck(deck: Card[]): Card[]` — Fisher-Yates shuffle
  - [ ] `dealHands(deck: Card[], playerCount: number): { hands: Card[][], remainingDeck: Card[] }` — deals cards
- [ ] Create `lib/game/boss.ts`:
  - [ ] `createBossList(): DungeonBoss[]` — returns all bosses in order
  - [ ] `checkBossDefeated(boss: DungeonBoss, playedCards: Card[]): boolean` — validates if played cards defeat the boss
- [ ] Create `lib/game/validation.ts`:
  - [ ] `canPlayCard(player: Player, card: Card, gameState: GameRoom): boolean` — validates a card play action
  - [ ] `isValidPlayerAction(action: ClientMessage, gameState: GameRoom): { valid: boolean, reason?: string }` — top-level action validator
- [ ] All functions in this folder must be **pure** (no side effects, same input = same output) — makes them easy to unit test

### 2.5 Implement Message Handlers

- [ ] `handleSetName(playerId, name, state)`:
  - [ ] Validate name is non-empty and under 20 characters
  - [ ] Update player name in state
- [ ] `handleSetReady(playerId, state)`:
  - [ ] Toggle player's `isReady` flag
  - [ ] Check if all connected players are ready → if yes, trigger game start
- [ ] `handlePlayCard(playerId, cardId, state)`:
  - [ ] Validate it is currently the playing phase
  - [ ] Validate the card exists in the player's hand
  - [ ] Remove card from player's hand
  - [ ] Add card to "played pile" against current boss
  - [ ] Check if boss is defeated → if yes, advance to next boss or trigger win
  - [ ] Check if deck is empty and boss not defeated → trigger loss
- [ ] `handleRequestState(connection, state)`:
  - [ ] Send full current state to that single connection only (not broadcast)

### 2.6 Timer Implementation

- [ ] Implement server-side countdown timer using `room.storage` alarms or `setInterval` on the server:
  - [ ] When game starts, record `startTime` and `durationSeconds` (300 = 5 minutes) in state
  - [ ] Every second, compute `remainingSeconds = durationSeconds - (now - startTime) / 1000`
  - [ ] Broadcast `timer_tick` with `remainingSeconds` to all clients
  - [ ] When `remainingSeconds <= 0`, trigger game loss
- [ ] Timer must live **entirely on the server** — clients display what the server tells them, never compute their own time
- [ ] Handle pause/resume if needed (e.g. if all players disconnect temporarily)

### 2.7 State Broadcast Helper

- [ ] Implement `broadcastState(room, state)`:
  - [ ] Serialize the full game state to JSON
  - [ ] Call `room.broadcast(serializedState)`
  - [ ] Optionally persist state to PartyKit storage so it survives room hibernation
- [ ] Implement `sendToConnection(connection, message)`:
  - [ ] Sends a message to a single connection (used for errors and state resync)

### 2.8 Reconnection Handling

- [ ] When a player reconnects (same player ID joins again):
  - [ ] Detect it is a reconnect by matching stored player ID in state
  - [ ] Mark player as connected again
  - [ ] Send them the full current game state immediately
  - [ ] Do not re-deal cards — their hand should be preserved
- [ ] Define player ID persistence strategy: store player ID in `localStorage` on the client, send it in the connection URL or first message

### 2.9 Testing the Server in Isolation

- [ ] Write a simple Node.js script (or use a tool like `wscat`) to connect to the PartyKit dev server and simulate a full game:
  - [ ] Two connections join
  - [ ] Both set names
  - [ ] Both set ready
  - [ ] Game starts, hands are dealt (verify in logged state)
  - [ ] Connection 1 plays a valid card
  - [ ] Connection 1 plays an invalid card (verify error response)
  - [ ] Timer reaches zero (verify loss state)
- [ ] Fix any bugs found before proceeding to UI

### ✅ Step 2 Done When:

- Full game state machine runs on the server
- All message types are handled and validated
- Timer is server-authoritative
- A full game can be played via raw WebSocket messages with no UI
- All pure game logic functions behave correctly when tested manually

---

## Step 3 — Lobby Flow (UI + Real-Time Connection)

> **Goal:** Players can create a room, share a code, join, see each other in the lobby, ready up, and start the game. The game screen is still just a placeholder at this point.

### 3.1 Home Page (`/`)

- [ ] Build `app/page.tsx` — the landing / entry page
- [ ] Add a text input for the player's display name
- [ ] Validate name on the client: non-empty, max 20 characters, trimmed
- [ ] Add two buttons: "Create Room" and "Join Room"
- [ ] "Create Room" flow:
  - [ ] Generate a short, readable room code (e.g. 6 uppercase alphanumeric characters) on the client
  - [ ] Store player name and player ID in `localStorage` (or a Zustand/context store)
  - [ ] Navigate to `/lobby/[roomId]`
- [ ] "Join Room" flow:
  - [ ] Show a second input for entering a room code
  - [ ] Validate the room code format before navigating
  - [ ] Navigate to `/lobby/[roomId]`
- [ ] Handle edge case: if player already has a stored name, pre-fill the input

### 3.2 Lobby Page (`/lobby/[roomId]`)

- [ ] Build `app/lobby/[roomId]/page.tsx`
- [ ] Mark the component with `'use client'`
- [ ] On mount, establish a PartyKit connection to the room using the `roomId` from the URL
- [ ] Send `set_name` message immediately after connecting with the stored player name
- [ ] Display the room code prominently with a "Copy" button for sharing
- [ ] Display the player list:
  - [ ] Each player's name
  - [ ] Ready / Not Ready status indicator
  - [ ] Connection status (online/offline)
- [ ] Add a "Ready" toggle button for the local player
- [ ] Show a "Waiting for players..." message if fewer than 2 players are present
- [ ] Show a "Waiting for all players to ready up..." message if not everyone is ready
- [ ] When all players are ready, show a "Starting in 3..." countdown (cosmetic)
- [ ] Handle disconnection: show a toast/banner if connection to PartyKit is lost, attempt reconnect

### 3.3 PartyKit Client Hook

- [ ] Create `hooks/usePartyKit.ts` — a custom hook that encapsulates all PartyKit client logic:
  - [ ] Accepts `roomId` and `playerId` as parameters
  - [ ] Manages the `PartySocket` connection lifecycle (connect on mount, disconnect on unmount)
  - [ ] Exposes `gameState`, `sendMessage`, `connectionStatus`
  - [ ] Parses incoming messages and updates local `gameState` via `useState` or `useReducer`
  - [ ] Handles reconnection automatically (PartySocket does this natively, just expose the status)
- [ ] All components use this hook — no raw WebSocket calls in components

### 3.4 State Management on the Client

- [ ] Decide on client-side state strategy:
  - [ ] `useReducer` inside `usePartyKit` hook is sufficient for MVP — the server is the source of truth, client just mirrors it
  - [ ] Avoid complex global state (Zustand, Redux) at this stage — add if needed later
- [ ] Client state shape should mirror the `GameRoom` type from `types/index.ts`
- [ ] Every `state_update` message from the server replaces the entire local state — no merging, no diffing

### 3.5 Navigation Guard

- [ ] If a player navigates to `/lobby/[roomId]` without a stored player name, redirect them to `/` with the room code pre-filled in the join input
- [ ] If a player navigates to `/game/[roomId]` directly without being in an active game, redirect to `/`

### 3.6 Lobby → Game Transition

- [ ] When the server sends `game_started`, all clients navigate to `/game/[roomId]` simultaneously
- [ ] The navigation must happen from inside the `usePartyKit` hook (or via a `useEffect` watching game phase)
- [ ] Use `router.push('/game/[roomId]')` from Next.js — do not use a link the player clicks
- [ ] The PartyKit connection must **persist across the navigation** — do not disconnect and reconnect
  - [ ] Approach: lift the `usePartyKit` hook to a layout-level context provider so the connection survives page transitions

### 3.7 Error States

- [ ] Room not found: if PartyKit returns an error connecting to the room, show a clear message and a "Back to Home" button
- [ ] Room full: if server rejects connection because room is at max players, show a message
- [ ] Name taken: if server rejects the name as duplicate, prompt player to choose another

### ✅ Step 3 Done When:

- Two players on different browsers can enter a room together
- Both players can see each other's names and ready status in real time
- Both players readying up triggers navigation to the game page (even if game page is blank)
- Losing connection shows a visible indicator and auto-reconnects

---

## Step 4 — Core Game Loop (UI)

> **Goal:** The actual card game is playable end-to-end with text-only UI. No images, no animations. Players can play cards, see the boss, and reach a win or loss condition.

### 4.1 Game Page Layout (`/game/[roomId]`)

- [ ] Build `app/game/[roomId]/page.tsx`
- [ ] Mark with `'use client'`
- [ ] Reuse the same `usePartyKit` hook — game state already flows through it
- [ ] Design the layout as a single screen (no scrolling) with distinct zones:
  - **Top zone:** Current dungeon boss info (name, required cards to defeat it, boss "HP" or resistance counter)
  - **Middle zone:** Shared play area — cards played this round against the boss
  - **Right/left panel:** Other players' hands (shown as card counts, not the actual cards)
  - **Bottom zone:** Local player's hand — the cards they can play

### 4.2 Boss Display Component

- [ ] Build `components/game/BossCard.tsx`
- [ ] Display (text only):
  - Boss name
  - What card types are needed to defeat it
  - Visual progress indicator (e.g. "3 of 5 required cards played")
- [ ] Highlight when the boss is defeated (green flash or text change) before advancing

### 4.3 Player Hand Component

- [ ] Build `components/game/PlayerHand.tsx`
- [ ] Render each card in the local player's hand as a clickable button/box
- [ ] Each card shows: card name and card type
- [ ] On click: call `sendMessage({ type: 'play_card', cardId: card.id })`
- [ ] Disable all cards when:
  - It is not the playing phase
  - An action is currently being processed (optimistic lock to prevent double-clicks)
- [ ] Show a "waiting" state if the server hasn't dealt cards yet

### 4.4 Played Cards Area

- [ ] Build `components/game/PlayedCards.tsx`
- [ ] Show all cards that have been played against the current boss this round
- [ ] Each card shows: player name who played it, card name, card type
- [ ] Auto-scroll or wrap if many cards have been played

### 4.5 Other Players Panel

- [ ] Build `components/game/PlayerList.tsx`
- [ ] For each other player, display:
  - Player name
  - Number of cards remaining in hand
  - Connected / Disconnected status
- [ ] Do not show the actual cards in other players' hands (game rule + hide information)

### 4.6 Optimistic UI for Card Plays

- [ ] When a player clicks a card, immediately remove it from their local hand display before the server confirms
- [ ] If the server responds with `error`, add the card back to the hand and show the error message
- [ ] This prevents the UI feeling laggy while waiting for the server round-trip

### 4.7 Game Over Screen

- [ ] Build `components/game/GameOver.tsx`
- [ ] Triggered when server sends `game_over` message
- [ ] Show two states:
  - **Win:** "You escaped the dungeon! All bosses defeated." + boss count
  - **Loss:** "The dungeon claims you! Time ran out." or "Deck exhausted."
- [ ] Show a summary: bosses defeated, total cards played, time elapsed
- [ ] Add a "Play Again" button:
  - [ ] Resets the room state on the server
  - [ ] Returns all players to the lobby page

### 4.8 Boss Advancement

- [ ] When a boss is defeated, show a brief transition state ("Boss Defeated!") before the next boss appears
- [ ] The server controls when the next boss appears — client just renders state changes
- [ ] If this is the final boss and it's defeated, server sends `game_over` with win state

### 4.9 Error Feedback

- [ ] When server sends `error` (e.g. invalid card play), display a non-blocking toast notification
- [ ] Toast shows the reason (e.g. "That card type doesn't match the boss requirement")
- [ ] Toast disappears after 3 seconds

### ✅ Step 4 Done When:

- A complete game can be played from deal to game-over with 2+ players
- Cards are dealt, played, validated, and bosses are defeated or the game is lost
- Win and loss screens appear correctly
- Play Again returns players to lobby and a new game can start immediately

---

## Step 5 — Timer & Win/Loss Conditions (Polish)

> **Goal:** The 5-minute countdown is server-driven, accurate, and visible to all players. All win/loss edge cases are handled correctly.

### 5.1 Timer Display Component

- [ ] Build `components/game/GameTimer.tsx`
- [ ] Display remaining time as `MM:SS` (e.g. `04:32`)
- [ ] Timer value comes **only** from `gameState.remainingSeconds` — never computed client-side
- [ ] Apply visual urgency states:
  - [ ] Under 60 seconds: change timer color to yellow
  - [ ] Under 30 seconds: change timer color to red
  - [ ] Under 10 seconds: add a subtle pulsing animation

### 5.2 Server Timer Accuracy

- [ ] Verify the server's timer drift is acceptable (< 1 second error over 5 minutes)
- [ ] Test by running a game to completion and comparing wall clock vs game timer
- [ ] If drift is observed, switch to an absolute timestamp approach:
  - [ ] Server stores `gameEndTimestamp = Date.now() + 300000` at game start
  - [ ] Each `timer_tick` sends `remainingMs = gameEndTimestamp - Date.now()`
  - [ ] Client displays `Math.max(0, Math.floor(remainingMs / 1000))`

### 5.3 All Win Conditions

- [ ] Verify and test each win path:
  - [ ] All bosses defeated before timer reaches zero → `game_over` with `{ result: 'win' }`
  - [ ] Final boss defeated with exactly 0 seconds remaining → still a win (timer checked after boss check)

### 5.4 All Loss Conditions

- [ ] Verify and test each loss path:
  - [ ] Timer reaches zero while any boss remains → `game_over` with `{ result: 'loss', reason: 'timeout' }`
  - [ ] Deck runs out of cards while current boss is not defeated → `game_over` with `{ result: 'loss', reason: 'deck_empty' }`

### 5.5 Disconnection During Active Game

- [ ] Define and implement the disconnection policy:
  - **Option A (recommended for MVP):** If a player disconnects, mark them as offline but continue the game. Their cards remain in hand and cannot be played until they reconnect.
  - **Option B:** If the host disconnects, pause the game for up to 60 seconds waiting for reconnect, then end the session.
- [ ] Implement chosen policy on the server
- [ ] Show a banner in the UI when a teammate is disconnected

### 5.6 Pause / Resume (Optional for MVP)

- [ ] Decide if pause is in scope for MVP — recommended to defer to post-MVP
- [ ] If deferred, add to the backlog as a known future feature

### 5.7 Play Again Flow

- [ ] "Play Again" sends a `reset_room` message to the server
- [ ] Server resets state to initial, keeps same players
- [ ] All clients navigate back to lobby page
- [ ] Players must ready up again before a new game starts (prevents accidental instant restart)

### ✅ Step 5 Done When:

- Timer counts down accurately and identically on all clients
- All win and loss conditions trigger `game_over` correctly
- Disconnection mid-game does not crash the server or desync other clients
- Play Again successfully resets and starts a fresh game

---

## Step 6 — Supabase Integration (Auth + Persistence)

> **Goal:** Players have persistent identities, match results are saved, and the foundation for future features (stats, history, leaderboards) exists.

### 6.1 Database Schema Design

- [ ] Design tables in Supabase (SQL):

  ```sql
  players
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
    username    text NOT NULL UNIQUE
    created_at  timestamptz DEFAULT now()

  game_sessions
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid()
    room_code     text NOT NULL
    started_at    timestamptz
    ended_at      timestamptz
    result        text CHECK (result IN ('win', 'loss'))
    loss_reason   text
    bosses_defeated int DEFAULT 0
    duration_seconds int

  game_players (join table)
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
    game_session_id uuid REFERENCES game_sessions(id)
    player_id       uuid REFERENCES players(id)
    cards_played    int DEFAULT 0
    joined_at       timestamptz DEFAULT now()
  ```

- [ ] Run migrations in Supabase SQL editor
- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Write RLS policies:
  - `players`: users can read all players, only update their own record
  - `game_sessions`: authenticated users can read all, insert new sessions (service role only updates)
  - `game_players`: authenticated users can read all

### 6.2 Supabase Auth Setup

- [ ] Enable **Email/Password** auth in Supabase dashboard
- [ ] Enable **Anonymous sign-in** (for players who don't want to register) — Supabase supports this natively
- [ ] Configure email confirmation settings (disable for MVP to reduce friction — enable post-launch)
- [ ] Configure redirect URLs for your Vercel domain in Supabase Auth settings

### 6.3 Auth Pages

- [ ] Build `app/auth/page.tsx` — a single page with tabs for Sign In / Sign Up
- [ ] Sign Up form: email, username, password, confirm password
  - [ ] Client-side validation before submission
  - [ ] On success: create a `players` record in the database, then redirect to home
- [ ] Sign In form: email, password
  - [ ] On success: redirect to home
- [ ] Anonymous play option: "Continue as Guest" button
  - [ ] Creates an anonymous Supabase session
  - [ ] Player sets a display name (stored only in session, not persisted)
- [ ] Add a "Sign Out" option in the nav/header

### 6.4 Auth State Management

- [ ] Create `lib/supabase/auth.ts` with helper functions:
  - [ ] `getSession(): Promise<Session | null>`
  - [ ] `signIn(email, password)`
  - [ ] `signUp(email, password, username)`
  - [ ] `signOut()`
- [ ] Create `hooks/useAuth.ts` — a hook that exposes `user`, `session`, `isLoading`
- [ ] Use `supabase.auth.onAuthStateChange()` to keep auth state in sync
- [ ] Protect routes: `/lobby/[roomId]` and `/game/[roomId]` require a session (redirect to `/auth` if not signed in)

### 6.5 Saving Match Results

- [ ] After `game_over` is confirmed on the PartyKit server, trigger a save:
  - [ ] PartyKit server calls a Next.js API route (server-to-server, using service role key) to persist the result
  - [ ] API route: `POST /api/game/complete`
  - [ ] Payload: `{ roomCode, result, lossReason, bosses_defeated, duration_seconds, playerIds[] }`
- [ ] Build `app/api/game/complete/route.ts`:
  - [ ] Validate the request payload
  - [ ] Insert a `game_sessions` record
  - [ ] Insert `game_players` records for each participant
  - [ ] Return `{ success: true }` or structured error

### 6.6 Player Profile Page (Simple)

- [ ] Build `app/profile/page.tsx`
- [ ] Show: username, total games played, total wins, total losses, win rate
- [ ] Query computed from `game_sessions` and `game_players` tables
- [ ] Only accessible to authenticated (non-anonymous) users

### 6.7 Security Hardening

- [ ] Verify `.env.local` is not committed — check git history
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is only used in `lib/supabase/server.ts` and API routes — never in client code
- [ ] Audit all API routes: ensure they validate session before performing any write operations
- [ ] Review all RLS policies: attempt unauthorized reads/writes from the Supabase dashboard to verify they are blocked
- [ ] Add rate limiting to the `/api/game/complete` route (simple: check for duplicate room codes within a time window)

### 6.8 Error Handling & Resilience

- [ ] If the Supabase write fails after game over, the game should **not** break for the players — the error is logged server-side and the game over screen still shows
- [ ] Add error logging: use `console.error` for now, with a note to replace with a proper logging service post-MVP
- [ ] Test the unhappy path: Supabase is down — does the game still work? (It should — Supabase is persistence only, not real-time gameplay)

### ✅ Step 6 Done When:

- Players can register, sign in, and play as a guest
- Match results are saved to Supabase after each game
- A simple profile page shows a player's game history
- No secrets are exposed to the client
- RLS policies prevent unauthorized data access

---

## Cross-Cutting Concerns (Apply Throughout All Steps)

### Error Handling Standards

- [ ] All async functions use try/catch — no unhandled promise rejections
- [ ] All user-facing errors show a human-readable message, not a raw exception
- [ ] Server errors are logged with enough context to debug (room ID, player ID, action attempted)

### TypeScript Standards

- [ ] No `any` types — use `unknown` and narrow it, or define proper types
- [ ] All function parameters and return types are explicitly typed
- [ ] Shared types live in `types/index.ts` — never define the same type in two places

### Component Standards

- [ ] Every component has a single responsibility
- [ ] Props are typed with explicit interfaces (no inline object types for props)
- [ ] Components do not contain business logic — they call functions from `lib/`
- [ ] Loading, error, and empty states are handled in every component that fetches data

### Performance Baselines

- [ ] Page load time under 2 seconds on a standard connection
- [ ] Game state updates render within 100ms of receiving a server message
- [ ] No unnecessary re-renders: use `React.memo` and `useCallback` where profiling shows it helps (profile first, optimize second)

### Accessibility Basics

- [ ] All interactive elements (buttons, inputs) are keyboard accessible
- [ ] Color is not the only indicator of state (e.g. ready/not ready uses both color and text/icon)
- [ ] Proper HTML semantics: `<button>` for actions, `<input>` for inputs, headings in order

---

## Post-MVP Backlog (Do Not Build Now)

> These are features to track but explicitly out of scope for the MVP.

- [ ] Card artwork and visual design
- [ ] Sound effects and background music
- [ ] Animations (card plays, boss defeats, timer urgency)
- [ ] Spectator mode
- [ ] Pause / resume functionality
- [ ] Public matchmaking (play with strangers)
- [ ] Different dungeon themes / card sets
- [ ] In-game chat
- [ ] Leaderboards
- [ ] Mobile responsiveness polish
- [ ] Push notifications ("Your friend invited you to a game")
- [ ] Replay system
- [ ] Progressive Web App (PWA) support

---

## Quick Reference — Key Decisions Made

| Decision            | Choice                    | Reason                                                 |
| ------------------- | ------------------------- | ------------------------------------------------------ |
| Frontend framework  | Next.js (App Router)      | Folder-based routing, familiar DX                      |
| Real-time layer     | PartyKit (Cloudflare)     | Room-based model, serverless, cheap at small scale     |
| Database + Auth     | Supabase                  | Full BaaS, Postgres, built-in auth, generous free tier |
| Styling             | Tailwind CSS              | Utility-first, fast to iterate                         |
| TypeScript          | Strict mode               | Catch bugs at compile time, not runtime                |
| State on client     | Server is source of truth | Client mirrors server state, no complex sync logic     |
| Timer authority     | Server only               | Prevents cheating and clock drift                      |
| Game logic location | PartyKit server           | Server-authoritative, validates all actions            |
