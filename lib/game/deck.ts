import type { Card, GameSymbol } from "../../types";

// ─────────────────────────────────────────────
// Card Definitions
// Each hero has a fixed deck of 40 cards (simplified for MVP).
// Cards are colour-coded by hero class in the physical game;
// here we encode them with named IDs so hands are fully traceable.
// ─────────────────────────────────────────────

/** Hand size per player count (from the official 5MD rules). */
export const HAND_SIZE: Record<number, number> = {
    2: 5,
    3: 4,
    4: 3,
    5: 3,
    6: 3,
};

/** Returns the starting hand size for a given number of players. */
export function getHandSize(playerCount: number): number {
    return HAND_SIZE[playerCount] ?? 3;
}

/**
 * Generates an individual player card.
 * This is a helper used by class-specific deck builders below.
 */
function makeCard(
    id: string,
    name: string,
    symbols: GameSymbol[],
    type: Card["type"] = "resource",
    targets?: Card["targets"]
): Card {
    return { id, name, symbols, type, targets };
}

/**
 * Generates a generic 20-card deck for testing.
 * In future steps this will be replaced with class-specific decks.
 * Each card has a unique ID so we can trace it through the game.
 */
function makeGenericDeck(heroId: string): Card[] {
    const deck: Card[] = [];

    // 4 × each symbol (20 resource cards)
    const symbols: GameSymbol[] = ["sword", "shield", "arrow", "jump", "scroll"];
    symbols.forEach((symbol) => {
        for (let i = 0; i < 4; i++) {
            deck.push(
                makeCard(`${heroId}-res-${symbol}-${i}`, `${symbol} card`, [symbol])
            );
        }
        // 1 double-symbol card per type
        deck.push(
            makeCard(
                `${heroId}-dbl-${symbol}`,
                `double ${symbol}`,
                [symbol, symbol]
            )
        );
    });

    // 5 action cards (Fireball-style: instantly defeats monsters)
    for (let i = 0; i < 5; i++) {
        deck.push(
            makeCard(
                `${heroId}-action-${i}`,
                "Fireball",
                [],
                "action",
                ["monster"]
            )
        );
    }

    return deck; // 25 cards per hero
}

/**
 * Creates the full shared deck for a game session.
 * For the MVP every player draws from the same pool.
 * Player IDs are passed in so we can generate uniquely-prefixed card IDs.
 */
export function createDeck(playerIds: string[]): Card[] {
    const allCards: Card[] = [];
    for (const id of playerIds) {
        allCards.push(...makeGenericDeck(id));
    }
    return allCards;
}

/**
 * Fisher-Yates shuffle — returns a new shuffled array.
 * The original array is NOT mutated (pure function).
 */
export function shuffleDeck<T>(deck: T[]): T[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    return shuffled;
}

/**
 * Deals cards from a shuffled deck.
 * Returns each player's hand and the remaining deck.
 *
 * @param deck       Shuffled deck to deal from
 * @param playerIds  Ordered list of player IDs
 * @param handSize   Number of cards per player
 */
export function dealHands(
    deck: Card[],
    playerIds: string[],
    handSize: number
): { hands: Record<string, Card[]>; remainingDeck: Card[] } {
    const hands: Record<string, Card[]> = {};
    let remaining = [...deck];

    for (const playerId of playerIds) {
        hands[playerId] = remaining.slice(0, handSize);
        remaining = remaining.slice(handSize);
    }

    return { hands, remainingDeck: remaining };
}

/**
 * Draws a single card from the top of the deck.
 * Returns the drawn card and the remaining deck.
 * Returns null if the deck is empty.
 */
export function drawCard(
    deck: Card[]
): { card: Card; remainingDeck: Card[] } | null {
    if (deck.length === 0) return null;
    const [card, ...remainingDeck] = deck;
    return { card: card!, remainingDeck };
}
