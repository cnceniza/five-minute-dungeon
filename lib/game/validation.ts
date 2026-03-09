import type { Card, DungeonCard, GameRoom, Player } from "../../types";

// ─────────────────────────────────────────────
// Validation — Pure Rules Engine
// These functions implement the "A card laid is a card played"
// and Boss-restriction rules from 5md-rules.md.
// All functions are pure: same input always returns same output,
// and nothing is mutated.
// ─────────────────────────────────────────────

export interface ValidationResult {
    valid: boolean;
    reason?: string;
}

/**
 * Checks whether a player can play a given card against the current dungeon card.
 *
 * Rules enforced:
 * 1. The game must be in the "playing" phase.
 * 2. The card must exist in the player's hand.
 * 3. If facing a Boss, only cards whose symbols match a remaining required
 *    symbol are allowed (no non-matching resource cards, no action cards
 *    that target monster/obstacle/person per the 5MD rules).
 */
export function canPlayCard(
    player: Player,
    card: Card,
    gameState: GameRoom
): ValidationResult {
    if (gameState.phase !== "playing") {
        return { valid: false, reason: "The game is not currently active." };
    }

    const cardInHand = player.hand.some((c) => c.id === card.id);
    if (!cardInHand) {
        return { valid: false, reason: "Card is not in your hand." };
    }

    const currentCard = gameState.currentDungeonCard;
    if (!currentCard) {
        return { valid: false, reason: "No dungeon card is currently active." };
    }

    // Boss-specific restrictions (from 5md-rules.md):
    // - You cannot play non-matching resource cards against a Boss.
    // - Action cards that target monster/obstacle/person cannot be used on a Boss.
    if (currentCard.type === "boss") {
        return validateBossPlay(card, currentCard);
    }

    // For all other card types, any card may be played.
    return { valid: true };
}

/**
 * Applies Boss-fight restrictions.
 * A card is valid against the Boss only if:
 * - It is a resource card with at least one symbol that still needs to be matched, OR
 * - It is an action card with no type restriction (targets all types).
 */
function validateBossPlay(
    card: Card,
    bossCard: DungeonCard
): ValidationResult {
    if (card.type === "resource") {
        const hasMatchingSymbol = card.symbols.some((sym) =>
            bossCard.remainingSymbols.includes(sym)
        );
        if (!hasMatchingSymbol) {
            return {
                valid: false,
                reason:
                    "You cannot play non-matching cards against a Boss. Only matching symbols are allowed.",
            };
        }
        return { valid: true };
    }

    if (card.type === "action") {
        // Action cards with specific targets (monster/obstacle/person) are
        // not usable against a Boss (Bosses are their own category).
        const restrictedTargets: Array<string> = ["monster", "obstacle", "person"];
        const isRestricted = card.targets?.some((t) =>
            restrictedTargets.includes(t)
        );
        if (isRestricted) {
            return {
                valid: false,
                reason:
                    "This action card cannot target a Boss. Bosses are their own category.",
            };
        }
        return { valid: true };
    }

    return { valid: true };
}

/**
 * Checks if the game-over loss condition is met:
 * - All players have empty hands AND the dungeon deck is empty.
 */
export function isOutOfCards(gameState: GameRoom): boolean {
    const allHandsEmpty = Object.values(gameState.players).every(
        (p) => p.hand.length === 0
    );
    return allHandsEmpty && gameState.dungeonDeckCount === 0;
}

/**
 * Checks if all connected players have set their isReady flag.
 * Used to auto-start the game in handleSetReady.
 */
export function allPlayersReady(gameState: GameRoom): boolean {
    const connectedPlayers = Object.values(gameState.players).filter(
        (p) => p.isConnected
    );
    if (connectedPlayers.length === 0) return false;
    return connectedPlayers.every((p) => p.isReady);
}
