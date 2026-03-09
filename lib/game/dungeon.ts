import type { DungeonCard, GameSymbol } from "../../types";

// ─────────────────────────────────────────────
// Dungeon Card Definitions
// Based on the 5MD rulebook (5md-rules.md).
// MVP includes a representative set of each card type.
// ─────────────────────────────────────────────

function makeDungeonCard(
    id: string,
    name: string,
    type: DungeonCard["type"],
    requiredSymbols: GameSymbol[]
): DungeonCard {
    return {
        id,
        name,
        type,
        requiredSymbols,
        remainingSymbols: [...requiredSymbols],
    };
}

/**
 * The full dungeon deck for Boss #1 (Baby Barbarian).
 * Contains Door Cards (monsters, obstacles, people) + Event Cards.
 * In the physical game these are shuffled before play.
 */
export const BOSS_1_DUNGEON_CARDS: DungeonCard[] = [
    // Monsters — defeated with swords / arrows
    makeDungeonCard("d-m-01", "Goblin", "monster", ["sword"]),
    makeDungeonCard("d-m-02", "Skeleton", "monster", ["arrow", "arrow"]),
    makeDungeonCard("d-m-03", "Orc", "monster", ["sword", "sword"]),
    makeDungeonCard("d-m-04", "Troll", "monster", ["sword", "sword", "arrow"]),
    makeDungeonCard("d-m-05", "Witchling", "monster", ["scroll", "sword"]),
    makeDungeonCard("d-m-06", "Bat Swarm", "monster", ["arrow"]),

    // Obstacles — require jumps, shields
    makeDungeonCard("d-o-01", "Pit Trap", "obstacle", ["jump"]),
    makeDungeonCard("d-o-02", "Stone Wall", "obstacle", ["shield", "shield"]),
    makeDungeonCard("d-o-03", "Cursed Chest", "obstacle", ["scroll", "jump"]),

    // People — bystanders who need rescuing
    makeDungeonCard("d-p-01", "Frightened Merchant", "person", ["shield"]),
    makeDungeonCard("d-p-02", "Lost Child", "person", ["jump", "shield"]),

    // Events — require immediate all-player actions
    makeDungeonCard("d-e-01", "Cave-In!", "event", ["shield", "shield", "jump"]),
    makeDungeonCard("d-e-02", "Darkness Falls", "event", ["scroll", "scroll"]),
];

/**
 * Boss #1: Baby Barbarian
 * Players must match these symbols to win the dungeon.
 * Bosses cannot be defeated by Action Cards or hero abilities per the rules.
 */
export const BOSS_1: DungeonCard = makeDungeonCard(
    "boss-1",
    "Baby Barbarian",
    "boss",
    ["sword", "sword", "sword", "shield", "jump"]
);

/**
 * Returns the shuffled dungeon deck with the boss removed (handled separately).
 * Mini-bosses (challenge cards) would be injected here in a later step.
 */
export function createDungeonDeck(
    doorCards: DungeonCard[],
    miniBosse: DungeonCard[] = []
): DungeonCard[] {
    // Official rule: 2 challenge (mini-boss) cards per player are added.
    // The caller is responsible for slicing the right number of mini-bosses.
    return [...doorCards, ...miniBosse];
}

/**
 * Applies a played symbol to a dungeon card.
 * Returns the updated card with the symbol removed from remainingSymbols.
 * Pure function — does NOT mutate the original card.
 */
export function applySymbol(
    card: DungeonCard,
    symbol: GameSymbol
): DungeonCard {
    const idx = card.remainingSymbols.indexOf(symbol);
    if (idx === -1) return card; // Symbol doesn't match; no change

    const remainingSymbols = [
        ...card.remainingSymbols.slice(0, idx),
        ...card.remainingSymbols.slice(idx + 1),
    ];

    return { ...card, remainingSymbols };
}

/**
 * Returns true if a dungeon card has been fully defeated
 * (all required symbols have been played).
 */
export function isDungeonCardDefeated(card: DungeonCard): boolean {
    return card.remainingSymbols.length === 0;
}
