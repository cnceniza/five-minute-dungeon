import type * as Party from "partykit/server";
import type { ClientMessage, GameRoom, Player, ServerMessage } from "../types";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Returns a blank GameRoom for a newly created room. */
function getInitialState(roomId: string): GameRoom {
  return {
    roomId,
    phase: "waiting",
    players: {},
    currentDungeonCard: null,
    dungeonDeckCount: 0,
    timer: 300, // 5 minutes
    gameResult: null,
  };
}

/** Serialise and send a ServerMessage to a single connection. */
function sendTo(conn: Party.Connection, message: ServerMessage): void {
  conn.send(JSON.stringify(message));
}

/** Serialise and broadcast a ServerMessage to every connection in the room. */
function broadcast(room: Party.Room, message: ServerMessage): void {
  room.broadcast(JSON.stringify(message));
}

/**
 * Broadcast the full game state to every connection.
 * Called after every state mutation so all clients stay in sync.
 */
function broadcastState(room: Party.Room, state: GameRoom): void {
  broadcast(room, { type: "STATE_SYNC", state });
}

// ─────────────────────────────────────────────
// Message handlers (stubs — logic added in 2.5)
// ─────────────────────────────────────────────

function handleSetName(
  playerId: string,
  name: string,
  state: GameRoom
): GameRoom {
  const player = state.players[playerId];
  if (!player) return state;

  const trimmed = name.trim().slice(0, 20);
  if (!trimmed) return state;

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: { ...player, name: trimmed },
    },
  };
}

function handleSetHero(
  playerId: string,
  heroClass: Player["heroClass"],
  state: GameRoom
): GameRoom {
  const player = state.players[playerId];
  if (!player) return state;

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: { ...player, heroClass },
    },
  };
}

function handleSetReady(
  playerId: string,
  ready: boolean,
  state: GameRoom
): GameRoom {
  const player = state.players[playerId];
  if (!player) return state;

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: { ...player, isReady: ready },
    },
  };
}

// TODO 2.5 — Implement play card & ability logic using lib/game/
function handlePlayCard(_playerId: string, _cardId: string, state: GameRoom): GameRoom {
  return state; // stub
}

function handleUseAbility(_playerId: string, state: GameRoom): GameRoom {
  return state; // stub
}

// ─────────────────────────────────────────────
// PartyKit Server
// ─────────────────────────────────────────────

export default class GameServer implements Party.Server {
  /** In-memory source of truth. Lives for the lifetime of the room. */
  private state: GameRoom;

  constructor(readonly room: Party.Room) {
    this.state = getInitialState(room.id);
  }

  /**
   * A new WebSocket connection has been established.
   * Add the player to state, send them the current state, and
   * notify everyone else that they joined.
   */
  onConnect(conn: Party.Connection): void {
    const newPlayer: Player = {
      id: conn.id,
      name: `Player ${Object.keys(this.state.players).length + 1}`,
      heroClass: "barbarian",
      hand: [],
      deckCount: 0,
      isReady: false,
      isConnected: true,
      playedCards: [],
    };

    this.state = {
      ...this.state,
      players: {
        ...this.state.players,
        [conn.id]: newPlayer,
      },
    };

    // Send full state to the joining player immediately
    sendTo(conn, { type: "STATE_SYNC", state: this.state });

    // Notify everyone else
    conn.send; // already sent above
    broadcast(this.room, { type: "PLAYER_JOINED", player: newPlayer });
  }

  /**
   * A WebSocket connection has closed.
   * Mark the player disconnected — don't remove them so they can reconnect.
   * If no one is left, schedule a state reset.
   */
  onClose(conn: Party.Connection): void {
    const player = this.state.players[conn.id];
    if (!player) return;

    this.state = {
      ...this.state,
      players: {
        ...this.state.players,
        [conn.id]: { ...player, isConnected: false },
      },
    };

    broadcast(this.room, { type: "PLAYER_LEFT", playerId: conn.id });

    // If all players have disconnected, reset state after 30 seconds
    const allDisconnected = Object.values(this.state.players).every(
      (p) => !p.isConnected
    );
    if (allDisconnected) {
      setTimeout(() => {
        const stillAllDisconnected = Object.values(this.state.players).every(
          (p) => !p.isConnected
        );
        if (stillAllDisconnected) {
          this.state = getInitialState(this.room.id);
        }
      }, 30_000);
    }
  }

  /**
   * A message was received from a client.
   * Parse as JSON and dispatch to the appropriate handler.
   * Broadcast updated state after every mutation.
   */
  onMessage(raw: string, sender: Party.Connection): void {
    let message: ClientMessage;

    try {
      message = JSON.parse(raw) as ClientMessage;
    } catch {
      sendTo(sender, { type: "ERROR", message: "Invalid JSON payload." });
      return;
    }

    switch (message.type) {
      case "SET_NAME":
        this.state = handleSetName(sender.id, message.name, this.state);
        break;

      case "SET_HERO":
        this.state = handleSetHero(sender.id, message.heroClass, this.state);
        break;

      case "SET_READY":
        this.state = handleSetReady(sender.id, message.ready, this.state);
        break;

      case "PLAY_CARD":
        this.state = handlePlayCard(sender.id, message.cardId, this.state);
        break;

      case "USE_ABILITY":
        this.state = handleUseAbility(sender.id, this.state);
        break;

      case "REQUEST_STATE":
        sendTo(sender, { type: "STATE_SYNC", state: this.state });
        return; // Not a mutation — don't broadcast

      case "LEAVE_GAME": {
        // Treat as a disconnect (onClose will also fire, but handle explicitly)
        const player = this.state.players[sender.id];
        if (player) {
          this.state = {
            ...this.state,
            players: {
              ...this.state.players,
              [sender.id]: { ...player, isConnected: false },
            },
          };
        }
        break;
      }

      default: {
        // Exhaustive check — TypeScript will error if a case is missed
        const _exhaustive: never = message;
        sendTo(sender, { type: "ERROR", message: "Unknown message type." });
        return;
      }
    }

    broadcastState(this.room, this.state);
  }
}
