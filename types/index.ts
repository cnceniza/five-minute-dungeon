/**
 * 5 Minute Dungeon — Core Symbols
 * These are the basic resources used to defeat monsters.
 */
export type GameSymbol = "sword" | "shield" | "arrow" | "jump" | "scroll";

/**
 * The phase of the game room
 */
export type GamePhase = "waiting" | "countdown" | "playing" | "won" | "lost";

/**
 * A Player Card
 */
export interface Card {
    id: string;
    name: string;
    symbols: GameSymbol[];
    type: "resource" | "action";
    value?: number; // For specific action cards that might have a numeric value
}

/**
 * A Monster or Boss to defeat
 */
export interface Monster {
    id: string;
    name: string;
    requiredSymbols: GameSymbol[]; // What combination defeats it
    type: "monster" | "obstacle" | "boss";
    currentResistance: GameSymbol[]; // Remaining symbols needed to defeat it
    image?: string;
}

/**
 * Player State
 */
export interface Player {
    id: string;
    name: string;
    hand: Card[];
    isReady: boolean;
    isConnected: boolean;
    class: "barbarian" | "paladin" | "ninja" | "huntress" | "wizard";
    deckCount: number;
}

/**
 * The Global Game Room State (The Source of Truth)
 */
export interface GameRoom {
    roomId: string;
    players: Record<string, Player>;
    currentMonster: Monster | null;
    monsterDeckCount: number;
    phase: GamePhase;
    timer: number; // In seconds
    winner: string | null; // Player ID or "team"
}

/**
 * Communication Protocol: Client → Server
 */
export type ClientMessage =
    | { type: "JOIN_GAME"; name: string; class: Player["class"] }
    | { type: "SET_READY"; ready: boolean }
    | { type: "START_GAME" }
    | { type: "PLAY_CARD"; cardId: string }
    | { type: "DRAW_CARD" }
    | { type: "LEAVE_GAME" };

/**
 * Communication Protocol: Server → Client
 */
export type ServerMessage =
    | { type: "STATE_SYNC"; state: GameRoom }
    | { type: "PLAYER_JOINED"; player: Player }
    | { type: "PLAYER_LEFT"; playerId: string }
    | { type: "GAME_STARTED" }
    | { type: "TIMER_TICK"; seconds: number }
    | { type: "MONSTER_DEFEATED"; nextMonster: Monster | null }
    | { type: "GAME_OVER"; result: "won" | "lost"; winner?: string }
    | { type: "ERROR"; message: string };
