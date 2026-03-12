import type * as Party from "partykit/server";
import type { Card, ClientMessage, DungeonCard, GameRoom, Player, ServerMessage } from "../types";
import { createDeck, dealHands, drawCard, getHandSize, shuffleDeck } from "../lib/game/deck";
import {
  BOSS_1,
  BOSS_1_DUNGEON_CARDS,
  applySymbol,
  createDungeonDeck,
  drawDungeonCard,
  isDungeonCardDefeated,
} from "../lib/game/dungeon";
import { allPlayersReady, canPlayCard, isOutOfCards } from "../lib/game/validation";

// ─────────────────────────────────────────────
// Pure Helpers
// ─────────────────────────────────────────────

/** Returns a blank GameRoom for a newly created room. */
function getInitialState(roomId: string): GameRoom {
  return {
    roomId,
    phase: "waiting",
    players: {},
    currentDungeonCard: null,
    dungeonDeckCount: 0,
    timer: 300,
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

/** Broadcast the full game state to every connection. */
function broadcastState(room: Party.Room, state: GameRoom): void {
  broadcast(room, { type: "STATE_SYNC", state });
}

// ─────────────────────────────────────────────
// Pure Message Handlers (operate only on GameRoom)
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

  // Cannot change ready status once game has started
  if (state.phase !== "waiting") return state;

  return {
    ...state,
    players: { ...state.players, [playerId]: { ...player, isReady: ready } },
  };
}

// ─────────────────────────────────────────────
// PartyKit Server
// ─────────────────────────────────────────────

export default class GameServer implements Party.Server {
  /** Serializable game state — broadcast to all clients. */
  private state: GameRoom;

  /** Server-side draw pile (not sent to clients to avoid spoilers). */
  private playerDrawPile: Card[] = [];

  /** Server-side dungeon deck (not sent to clients). */
  private dungeonDeck: DungeonCard[] = [];

  /** The boss card for the current run. MVP always uses Boss #1. */
  private boss: DungeonCard = BOSS_1;

  /** Pending room reset timer. */
  private resetTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly room: Party.Room) {
    this.state = getInitialState(room.id);
  }

  // ── Lifecycle ─────────────────────────────

  onConnect(conn: Party.Connection): void {
    // Cancel any pending room reset
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
      this.resetTimeout = null;
    }

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
      players: { ...this.state.players, [conn.id]: newPlayer },
    };

    sendTo(conn, { type: "STATE_SYNC", state: this.state });
    broadcast(this.room, { type: "PLAYER_JOINED", player: newPlayer });
  }

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

    const allDisconnected = Object.values(this.state.players).every(
      (p) => !p.isConnected
    );
    if (allDisconnected) {
      if (this.resetTimeout) clearTimeout(this.resetTimeout);
      this.resetTimeout = setTimeout(() => {
        const stillAllDisconnected = Object.values(this.state.players).every(
          (p) => !p.isConnected
        );
        if (stillAllDisconnected) {
          this.state = getInitialState(this.room.id);
          this.playerDrawPile = [];
          this.dungeonDeck = [];
          this.boss = BOSS_1;
          this.resetTimeout = null;
        }
      }, 30_000);
    }
  }

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

      case "SET_READY": {
        this.state = handleSetReady(sender.id, message.ready, this.state);
        // Auto-start when every connected player is ready (min 2 players)
        const connected = Object.values(this.state.players).filter(
          (p) => p.isConnected
        );
        if (connected.length >= 2 && allPlayersReady(this.state)) {
          this.startGame();
          // startGame already broadcasts
          return;
        }
        break;
      }

      case "PLAY_CARD": {
        const error = this.playCard(sender.id, message.cardId);
        if (error) {
          sendTo(sender, { type: "ERROR", message: error });
          return;
        }
        // playCard already broadcasts (handles win/loss transitions)
        return;
      }

      case "USE_ABILITY": {
        const error = this.useAbility(sender.id);
        if (error) {
          sendTo(sender, { type: "ERROR", message: error });
          return;
        }
        break;
      }

      case "REQUEST_STATE":
        sendTo(sender, { type: "STATE_SYNC", state: this.state });
        return; // Not a mutation

      case "LEAVE_GAME": {
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
        const _exhaustive: never = message;
        sendTo(sender, { type: "ERROR", message: "Unknown message type." });
        return;
      }
    }

    broadcastState(this.room, this.state);
  }

  // ── Private Game Methods ───────────────────

  /**
   * Initialises and starts the game.
   * - Builds + shuffles the player card deck and deals hands.
   * - Builds + shuffles the dungeon deck and draws the first card.
   * - Transitions phase to "playing".
   */
  private startGame(): void {
    const playerIds = Object.keys(this.state.players).filter(
      (id) => this.state.players[id]?.isConnected
    );
    const handSize = getHandSize(playerIds.length);

    // Build player draw pile
    const rawDeck = shuffleDeck(createDeck(playerIds));
    const { hands, remainingDeck } = dealHands(rawDeck, playerIds, handSize);
    this.playerDrawPile = remainingDeck;

    // Build dungeon deck
    this.dungeonDeck = shuffleDeck(createDungeonDeck(BOSS_1_DUNGEON_CARDS));
    this.boss = { ...BOSS_1 }; // fresh copy

    // Draw the first dungeon card
    const firstDraw = drawDungeonCard(this.dungeonDeck);
    this.dungeonDeck = firstDraw?.remainingDeck ?? [];
    const firstCard = firstDraw?.card ?? null;

    // Update each player's hand in state
    const updatedPlayers = { ...this.state.players };
    for (const id of playerIds) {
      const player = updatedPlayers[id];
      if (!player) continue;
      updatedPlayers[id] = {
        ...player,
        hand: hands[id] ?? [],
        deckCount: hands[id]?.length ?? 0,
        playedCards: [],
        isReady: true,
      };
    }

    this.state = {
      ...this.state,
      phase: "playing",
      players: updatedPlayers,
      currentDungeonCard: firstCard,
      dungeonDeckCount: this.dungeonDeck.length + 1, // +1 for boss at the end
      timer: 300,
      gameResult: null,
    };

    broadcast(this.room, { type: "GAME_STARTED" });
    broadcastState(this.room, this.state);
  }

  /**
   * Handles a player playing a card against the current dungeon card.
   * Returns an error string if the action is invalid, or null on success.
   */
  private playCard(playerId: string, cardId: string): string | null {
    if (this.state.phase !== "playing") {
      return "The game is not currently active.";
    }

    const player = this.state.players[playerId];
    if (!player) return "Player not found.";

    const card = player.hand.find((c) => c.id === cardId);
    if (!card) return "Card not found in hand.";

    if (!this.state.currentDungeonCard) return "No dungeon card to play against.";

    const validation = canPlayCard(player, card, this.state);
    if (!validation.valid) return validation.reason ?? "Invalid card play.";

    // Remove the card from the player's hand
    const newHand = player.hand.filter((c) => c.id !== cardId);

    let updatedDungeonCard: DungeonCard = this.state.currentDungeonCard;

    // Apply each of the card's symbols to the dungeon card
    if (card.type === "resource") {
      for (const symbol of card.symbols) {
        updatedDungeonCard = applySymbol(updatedDungeonCard, symbol);
      }
    } else if (card.type === "action") {
      // Action cards with no targets instant-defeat non-boss cards
      if (!card.targets || card.targets.includes(updatedDungeonCard.type)) {
        updatedDungeonCard = { ...updatedDungeonCard, remainingSymbols: [] };
      }
    }

    // Update player state
    const updatedPlayer: Player = {
      ...player,
      hand: newHand,
      playedCards: [...player.playedCards, card],
    };

    this.state = {
      ...this.state,
      players: { ...this.state.players, [playerId]: updatedPlayer },
      currentDungeonCard: updatedDungeonCard,
    };

    // Check if the dungeon card has been fully defeated
    if (isDungeonCardDefeated(updatedDungeonCard)) {
      this.advanceDungeonCard();
      return null; // advanceDungeonCard handles broadcast
    }

    // Check loss: all hands empty and draw pile empty
    if (isOutOfCards(this.state) && this.playerDrawPile.length === 0) {
      this.triggerGameOver("lost");
      return null;
    }

    broadcastState(this.room, this.state);
    return null;
  }

  /**
   * Draws the next dungeon card.
   * If the dungeon deck is empty, the boss fight begins.
   * If the boss is defeated, the game is won.
   */
  private advanceDungeonCard(): void {
    // Clear played cards from all players for the new round
    const clearedPlayers = { ...this.state.players };
    for (const id of Object.keys(clearedPlayers)) {
      const p = clearedPlayers[id];
      if (p) clearedPlayers[id] = { ...p, playedCards: [] };
    }

    if (this.dungeonDeck.length > 0) {
      // Draw next door card
      const next = drawDungeonCard(this.dungeonDeck);
      this.dungeonDeck = next?.remainingDeck ?? [];

      this.state = {
        ...this.state,
        players: clearedPlayers,
        currentDungeonCard: next?.card ?? null,
        dungeonDeckCount: this.dungeonDeck.length + 1, // +1 for boss
      };

      broadcast(this.room, { type: "DUNGEON_CARD_DEFEATED", nextCard: next?.card ?? null });
      broadcastState(this.room, this.state);
      return;
    }

    // Dungeon deck empty — face the boss
    if (this.state.currentDungeonCard?.type !== "boss") {
      this.state = {
        ...this.state,
        players: clearedPlayers,
        currentDungeonCard: this.boss,
        dungeonDeckCount: 0,
      };

      broadcast(this.room, { type: "DUNGEON_CARD_DEFEATED", nextCard: this.boss });
      broadcastState(this.room, this.state);
      return;
    }

    // The boss was just defeated — VICTORY!
    this.triggerGameOver("won");
  }

  /**
   * Transitions the game to over state (win or loss).
   */
  private triggerGameOver(result: "won" | "lost"): void {
    this.state = {
      ...this.state,
      phase: result,
      gameResult: result,
    };

    broadcast(this.room, { type: "GAME_OVER", result });
    broadcastState(this.room, this.state);
  }

  /**
   * Handles the USE_ABILITY action.
   * Per 5MD rules: costs 3 discards from the player's hand.
   * Hero-specific effects are a TODO for future steps.
   */
  private useAbility(playerId: string): string | null {
    if (this.state.phase !== "playing") {
      return "The game is not currently active.";
    }

    const player = this.state.players[playerId];
    if (!player) return "Player not found.";

    const ABILITY_COST = 3;
    if (player.hand.length < ABILITY_COST) {
      return `You need at least ${ABILITY_COST} cards in hand to use your ability.`;
    }

    // Discard 3 cards (from the end of the hand — arbitrary order for now)
    const newHand = player.hand.slice(0, player.hand.length - ABILITY_COST);

    this.state = {
      ...this.state,
      players: {
        ...this.state.players,
        [playerId]: { ...player, hand: newHand },
      },
    };

    // TODO 2.6+ — Apply hero-specific ability effects based on player.heroClass
    return null;
  }
}
