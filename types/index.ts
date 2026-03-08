/**
 * 5 Minute Dungeon — Core Symbols
 * Swords, Arrows, Scrolls, Jump, Shields — used to match dungeon cards.
 */
export type GameSymbol = "sword" | "shield" | "arrow" | "jump" | "scroll";

/**
 * The phase of the game room
 */
export type GamePhase = "waiting" | "countdown" | "playing" | "won" | "lost";

/**
 * Hero classes available in the game
 */
export type HeroClass =
    | "barbarian"
    | "paladin"
    | "ninja"
    | "huntress"
    | "wizard"
    | "knight"
    | "angel"
    | "sorceress"
    | "ranger"
    | "catfish"
    | "time-keeper"
    | "bard";

/**
 * A Player Card
 * Resource cards supply symbols. Action cards have instant effects.
 */
export interface Card {
    id: string;
    name: string;
    // Resource card symbols — may have 0 for pure Action cards  
    symbols: GameSymbol[];
    type: "resource" | "action";
    // What dungeon card types this action card can defeat (undefined = anything)
    targets?: Array<DungeonCardType>;
}

/**
 * The type of a dungeon card — matters for what can defeat it
 */
export type DungeonCardType = "monster" | "obstacle" | "person" | "event" | "mini-boss" | "boss";

/**
 * A Dungeon Card (Door Card, Event Card, Mini-Boss, or Boss)
 */
export interface DungeonCard {
    id: string;
    name: string;
    type: DungeonCardType;
    // Symbols required to defeat this card
    requiredSymbols: GameSymbol[];
    // Remaining unmatched symbols (updated as cards are played)
    remainingSymbols: GameSymbol[];
}

/**
 * Player State
 */
export interface Player {
    id: string;
    name: string;
    heroClass: HeroClass;
    hand: Card[];
    deckCount: number;
    isReady: boolean;
    isConnected: boolean;
    // Cards played to the center against the current dungeon card
    playedCards: Card[];
}

/**
 * The Global Game Room State (Source of Truth on the server)
 */
export interface GameRoom {
    roomId: string;
    phase: GamePhase;
    players: Record<string, Player>;
    // The current dungeon card all players are fighting
    currentDungeonCard: DungeonCard | null;
    // Number of cards remaining in the dungeon deck (not counting current card or boss)
    dungeonDeckCount: number;
    // Remaining seconds on the 5-minute clock (authoritative on server)
    timer: number;
    // Populated when game ends
    gameResult: "won" | "lost" | null;
}

/**
 * Communication Protocol: Client → Server
 * All messages must be serializable as JSON.
 */
export type ClientMessage =
    | { type: "SET_NAME"; name: string }
    | { type: "SET_HERO"; heroClass: HeroClass }
    | { type: "SET_READY"; ready: boolean }
    | { type: "PLAY_CARD"; cardId: string }
    | { type: "USE_ABILITY" } // Costs 3 discards, uses hero special ability
    | { type: "REQUEST_STATE" } // Client requests full resync (for reconnect)
    | { type: "LEAVE_GAME" };

/**
 * Communication Protocol: Server → Client
 * All messages must be serializable as JSON.
 */
export type ServerMessage =
    | { type: "STATE_SYNC"; state: GameRoom }
    | { type: "PLAYER_JOINED"; player: Player }
    | { type: "PLAYER_LEFT"; playerId: string }
    | { type: "GAME_STARTED" }
    | { type: "TIMER_TICK"; seconds: number }
    | { type: "DUNGEON_CARD_DEFEATED"; nextCard: DungeonCard | null }
    | { type: "GAME_OVER"; result: "won" | "lost" }
    | { type: "ERROR"; message: string };
