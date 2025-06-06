import { Card, CardRank } from '../types';

export const getCardValue = (card: Card): number => {
  switch (card.rank) {
    case 'ace':
      return 1;
    case 'jack':
      return 11;
    case 'queen':
      return 12;
    case 'king':
      return 13;
    default:
      return parseInt(card.rank);
  }
};

export const calculateHP = (cards: Card[]): number => {
  return cards.reduce((total, card) => total + getCardValue(card), 0);
};

export const canAttackSucceed = (attackValue: number, shieldValue: number): boolean => {
  return attackValue > shieldValue;
};

export const calculateDamage = (attackValue: number, shieldValue: number): number => {
  return Math.max(0, attackValue - shieldValue);
};

export const createDeck = (): Card[] => {
  const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: Card['rank'][] = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];
  
  const deck: Card[] = [];
  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push({ suit, rank });
    });
  });
  
  return shuffleDeck(deck);
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const drawCard = (deck: Card[]): { card: Card | null; remainingDeck: Card[] } => {
  if (deck.length === 0) {
    return { card: null, remainingDeck: [] };
  }
  
  const [drawnCard, ...remainingDeck] = deck;
  return { card: drawnCard, remainingDeck };
};

// Game Rules Validation Functions
export const validatePlayerSetup = (shieldCard: Card, hpCards: Card[]): boolean => {
  // Must have exactly one shield card
  if (!shieldCard) return false;
  
  // Must have at least one HP card
  if (hpCards.length === 0) return false;
  
  // All cards must be valid
  return [shieldCard, ...hpCards].every(card => 
    card && card.suit && card.rank && getCardValue(card) > 0
  );
};

export const validateAttack = (
  attackerStoredCards: Card[],
  storedCardIndices: number[],
  attackCard: Card,
  targetShield: Card | null
): { valid: boolean; reason?: string } => {
  // Check if stored card indices are valid
  if (storedCardIndices.some(index => index < 0 || index >= attackerStoredCards.length)) {
    return { valid: false, reason: 'Invalid stored card selection' };
  }
  
  // Check if attack card exists
  if (!attackCard) {
    return { valid: false, reason: 'No attack card available' };
  }
  
  return { valid: true };
};

export const calculateAttackResult = (
  attackCard: Card,
  storedCards: Card[],
  shieldCard: Card | null
): {
  totalAttackValue: number;
  shieldValue: number;
  damage: number;
  success: boolean;
} => {
  const attackValue = getCardValue(attackCard);
  const storedValue = storedCards.reduce((sum, card) => sum + getCardValue(card), 0);
  const totalAttackValue = attackValue + storedValue;
  
  const shieldValue = shieldCard ? getCardValue(shieldCard) : 0;
  const damage = calculateDamage(totalAttackValue, shieldValue);
  const success = canAttackSucceed(totalAttackValue, shieldValue);
  
  return {
    totalAttackValue,
    shieldValue,
    damage,
    success
  };
};

export const isGameOver = (playerStates: Record<string, any>): { gameOver: boolean; winner?: string } => {
  const activePlayers = Object.entries(playerStates).filter(
    ([_, state]) => !state.eliminated && state.hp >= 0
  );
  
  // Game is over when only one player remains
  if (activePlayers.length <= 1) {
    return {
      gameOver: true,
      winner: activePlayers.length === 1 ? activePlayers[0][0] : undefined
    };
  }
  
  return { gameOver: false };
};

export const getNextActivePlayer = (
  currentPlayerId: string,
  playerStates: Record<string, any>
): string | null => {
  const playerIds = Object.keys(playerStates);
  const currentIndex = playerIds.indexOf(currentPlayerId);
  
  if (currentIndex === -1) return null;
  
  // Find next active player
  for (let i = 1; i < playerIds.length; i++) {
    const nextIndex = (currentIndex + i) % playerIds.length;
    const nextPlayerId = playerIds[nextIndex];
    const nextPlayerState = playerStates[nextPlayerId];
    
    if (!nextPlayerState.eliminated && nextPlayerState.hp >= 0) {
      return nextPlayerId;
    }
  }
  
  return null;
};

// Card validation utilities
export const isValidCard = (card: Card): boolean => {
  const validSuits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const validRanks = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king'];
  
  return validSuits.includes(card.suit) && validRanks.includes(card.rank);
};

export const isDeckValid = (deck: Card[]): boolean => {
  // Standard deck should have 52 cards
  if (deck.length !== 52) return false;
  
  // Check for duplicates
  const cardSet = new Set(deck.map(card => `${card.suit}-${card.rank}`));
  if (cardSet.size !== 52) return false;
  
  // All cards should be valid
  return deck.every(isValidCard);
};
