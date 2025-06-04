
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
