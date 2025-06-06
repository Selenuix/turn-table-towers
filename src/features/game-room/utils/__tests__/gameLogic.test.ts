
import { describe, it, expect } from 'vitest';
import {
  getCardValue,
  calculateHP,
  canAttackSucceed,
  calculateDamage,
  createDeck,
  shuffleDeck,
  drawCard,
  validatePlayerSetup,
  validateAttack,
  calculateAttackResult,
  isGameOver,
  getNextActivePlayer,
  isValidCard,
  isDeckValid
} from '../gameLogic';
import { Card } from '../../types';

describe('Game Logic', () => {
  describe('Card Values', () => {
    it('should return correct values for number cards', () => {
      expect(getCardValue({ suit: 'hearts', rank: '2' })).toBe(2);
      expect(getCardValue({ suit: 'hearts', rank: '10' })).toBe(10);
    });

    it('should return correct values for face cards', () => {
      expect(getCardValue({ suit: 'hearts', rank: 'ace' })).toBe(1);
      expect(getCardValue({ suit: 'hearts', rank: 'jack' })).toBe(11);
      expect(getCardValue({ suit: 'hearts', rank: 'queen' })).toBe(12);
      expect(getCardValue({ suit: 'hearts', rank: 'king' })).toBe(13);
    });
  });

  describe('HP Calculation', () => {
    it('should calculate total HP from multiple cards', () => {
      const cards: Card[] = [
        { suit: 'hearts', rank: '5' },
        { suit: 'spades', rank: 'jack' },
        { suit: 'diamonds', rank: 'ace' }
      ];
      expect(calculateHP(cards)).toBe(17); // 5 + 11 + 1
    });

    it('should return 0 for empty card array', () => {
      expect(calculateHP([])).toBe(0);
    });
  });

  describe('Attack Logic', () => {
    it('should determine attack success correctly', () => {
      expect(canAttackSucceed(10, 5)).toBe(true);
      expect(canAttackSucceed(5, 10)).toBe(false);
      expect(canAttackSucceed(5, 5)).toBe(false);
    });

    it('should calculate damage correctly', () => {
      expect(calculateDamage(10, 5)).toBe(5);
      expect(calculateDamage(5, 10)).toBe(0);
      expect(calculateDamage(5, 5)).toBe(0);
    });
  });

  describe('Deck Management', () => {
    it('should create a valid 52-card deck', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(52);
      expect(isDeckValid(deck)).toBe(true);
    });

    it('should shuffle deck differently', () => {
      const originalDeck = createDeck();
      const shuffledDeck = shuffleDeck([...originalDeck]);
      
      // Extremely unlikely to be identical after shuffle
      expect(shuffledDeck).not.toEqual(originalDeck);
      expect(shuffledDeck).toHaveLength(52);
    });

    it('should draw card from deck', () => {
      const deck: Card[] = [
        { suit: 'hearts', rank: 'ace' },
        { suit: 'spades', rank: 'king' }
      ];
      
      const { card, remainingDeck } = drawCard(deck);
      expect(card).toEqual({ suit: 'hearts', rank: 'ace' });
      expect(remainingDeck).toHaveLength(1);
      expect(remainingDeck[0]).toEqual({ suit: 'spades', rank: 'king' });
    });

    it('should handle empty deck', () => {
      const { card, remainingDeck } = drawCard([]);
      expect(card).toBeNull();
      expect(remainingDeck).toHaveLength(0);
    });
  });

  describe('Player Setup Validation', () => {
    it('should validate correct player setup', () => {
      const shieldCard: Card = { suit: 'hearts', rank: 'king' };
      const hpCards: Card[] = [
        { suit: 'spades', rank: '5' },
        { suit: 'diamonds', rank: 'queen' }
      ];
      
      expect(validatePlayerSetup(shieldCard, hpCards)).toBe(true);
    });

    it('should reject setup without shield', () => {
      const hpCards: Card[] = [{ suit: 'spades', rank: '5' }];
      expect(validatePlayerSetup(null as any, hpCards)).toBe(false);
    });

    it('should reject setup without HP cards', () => {
      const shieldCard: Card = { suit: 'hearts', rank: 'king' };
      expect(validatePlayerSetup(shieldCard, [])).toBe(false);
    });
  });

  describe('Attack Validation', () => {
    const attackerStoredCards: Card[] = [
      { suit: 'hearts', rank: '5' },
      { suit: 'spades', rank: 'jack' }
    ];
    const attackCard: Card = { suit: 'diamonds', rank: 'queen' };

    it('should validate correct attack', () => {
      const result = validateAttack(attackerStoredCards, [0], attackCard, null);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid stored card indices', () => {
      const result = validateAttack(attackerStoredCards, [5], attackCard, null);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid stored card selection');
    });

    it('should reject attack without attack card', () => {
      const result = validateAttack(attackerStoredCards, [0], null as any, null);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('No attack card available');
    });
  });

  describe('Attack Result Calculation', () => {
    it('should calculate attack result correctly', () => {
      const attackCard: Card = { suit: 'hearts', rank: '8' };
      const storedCards: Card[] = [{ suit: 'spades', rank: '5' }];
      const shieldCard: Card = { suit: 'diamonds', rank: '10' };
      
      const result = calculateAttackResult(attackCard, storedCards, shieldCard);
      
      expect(result.totalAttackValue).toBe(13); // 8 + 5
      expect(result.shieldValue).toBe(10);
      expect(result.damage).toBe(3); // 13 - 10
      expect(result.success).toBe(true);
    });

    it('should handle no shield scenario', () => {
      const attackCard: Card = { suit: 'hearts', rank: '5' };
      const storedCards: Card[] = [];
      
      const result = calculateAttackResult(attackCard, storedCards, null);
      
      expect(result.totalAttackValue).toBe(5);
      expect(result.shieldValue).toBe(0);
      expect(result.damage).toBe(5);
      expect(result.success).toBe(true);
    });
  });

  describe('Game Over Logic', () => {
    it('should detect game over with one player remaining', () => {
      const playerStates = {
        'player1': { hp: 10, eliminated: false },
        'player2': { hp: 0, eliminated: true },
        'player3': { hp: 0, eliminated: true }
      };
      
      const result = isGameOver(playerStates);
      expect(result.gameOver).toBe(true);
      expect(result.winner).toBe('player1');
    });

    it('should not detect game over with multiple players', () => {
      const playerStates = {
        'player1': { hp: 10, eliminated: false },
        'player2': { hp: 5, eliminated: false },
        'player3': { hp: 0, eliminated: true }
      };
      
      const result = isGameOver(playerStates);
      expect(result.gameOver).toBe(false);
      expect(result.winner).toBeUndefined();
    });
  });

  describe('Next Player Logic', () => {
    it('should find next active player', () => {
      const playerStates = {
        'player1': { hp: 10, eliminated: false },
        'player2': { hp: 0, eliminated: true },
        'player3': { hp: 5, eliminated: false }
      };
      
      const nextPlayer = getNextActivePlayer('player1', playerStates);
      expect(nextPlayer).toBe('player3'); // Skip eliminated player2
    });

    it('should handle wrap-around to first player', () => {
      const playerStates = {
        'player1': { hp: 10, eliminated: false },
        'player2': { hp: 5, eliminated: false },
        'player3': { hp: 0, eliminated: true }
      };
      
      const nextPlayer = getNextActivePlayer('player2', playerStates);
      expect(nextPlayer).toBe('player1'); // Wrap around, skip eliminated player3
    });

    it('should return null for invalid current player', () => {
      const playerStates = {
        'player1': { hp: 10, eliminated: false }
      };
      
      const nextPlayer = getNextActivePlayer('invalid', playerStates);
      expect(nextPlayer).toBeNull();
    });
  });

  describe('Card Validation', () => {
    it('should validate correct cards', () => {
      expect(isValidCard({ suit: 'hearts', rank: 'ace' })).toBe(true);
      expect(isValidCard({ suit: 'spades', rank: 'king' })).toBe(true);
      expect(isValidCard({ suit: 'diamonds', rank: '10' })).toBe(true);
    });

    it('should reject invalid cards', () => {
      expect(isValidCard({ suit: 'invalid' as any, rank: 'ace' })).toBe(false);
      expect(isValidCard({ suit: 'hearts', rank: 'invalid' as any })).toBe(false);
    });
  });

  describe('Deck Validation', () => {
    it('should validate complete standard deck', () => {
      const deck = createDeck();
      expect(isDeckValid(deck)).toBe(true);
    });

    it('should reject incomplete deck', () => {
      const incompleteDeck = createDeck().slice(0, 51);
      expect(isDeckValid(incompleteDeck)).toBe(false);
    });

    it('should reject deck with duplicates', () => {
      const duplicateDeck = [
        { suit: 'hearts', rank: 'ace' },
        { suit: 'hearts', rank: 'ace' }, // Duplicate
        ...createDeck().slice(2)
      ];
      expect(isDeckValid(duplicateDeck)).toBe(false);
    });
  });
});
