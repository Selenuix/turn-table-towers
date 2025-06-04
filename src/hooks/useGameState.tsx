
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameState, Card, PlayerState } from '@/features/game-room/types';
import { getCardValue } from '@/features/game-room/utils/gameLogic';

export const useGameState = (roomId: string, userId: string) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const isMountedRef = useRef<boolean>(true);
  const intervalRef = useRef<number | null>(null);
  // Fetch interval in milliseconds (5 seconds)
  const FETCH_INTERVAL = 5000;

  const fetchGameState = useCallback(async () => {
    if (!roomId) return;

    try {
      console.log('Fetching game state for room:', roomId);

      // Use .maybeSingle() instead of .single() to handle cases with no data
      const { data, error } = await supabase
        .from('game_states')
        .select('*')
        .eq('room_id', roomId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching game state:', error);
        throw error;
      }

      // Transform the data to match our GameState interface if data exists
      if (data) {
        console.log('Game state found:', data);
        const transformedGameState: GameState = {
          id: data.id,
          room_id: data.room_id,
          current_player_id: data.current_player_id,
          deck: data.deck,
          discard_pile: data.discard_pile,
          created_at: data.created_at,
          updated_at: data.updated_at,
          player_states: (data.player_states as Record<string, any>) || {}
        };
        if (isMountedRef.current) {
          setGameState(transformedGameState);
        }
      } else {
        // No game state found - this is expected if the game hasn't started yet
        console.log('No game state found for room:', roomId);
        if (isMountedRef.current) {
          setGameState(null);
        }
      }
    } catch (err) {
      console.error('Error fetching game state:', err);
      if (isMountedRef.current) {
        setError(err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [roomId]);

  const setupFetchInterval = useCallback(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Set up a new interval for fetching game state
    intervalRef.current = window.setInterval(() => {
      if (isMountedRef.current) {
        console.log('Fetching game state on interval');
        fetchGameState();
      }
    }, FETCH_INTERVAL);
  }, [fetchGameState]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!roomId) {
      setLoading(false);
      return;
    }

    // Fetch initial data
    fetchGameState();

    // Set up interval for fetching game state
    setupFetchInterval();

    return () => {
      isMountedRef.current = false;

      // Clean up interval on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [roomId, userId, fetchGameState, setupFetchInterval]);

  const setupPlayerCards = async (shieldIndex: number, hpIndices: number[]) => {
    try {
      console.log('Setting up player cards:', { shieldIndex, hpIndices });

      const { data, error } = await supabase
        .rpc('update_player_cards', {
          p_room_id: roomId,
          p_player_id: userId,
          p_shield_index: shieldIndex,
          p_hp_indices: hpIndices
        });

      if (error) {
        console.error('Error setting up player cards:', error);
        throw error;
      }

      console.log('Player cards setup successful:', data);
      return { data, error: null };
    } catch (err) {
      console.error('Error setting up player cards:', err);
      return { data: null, error: err };
    }
  };

  const performGameAction = async (action: string, data?: any) => {
    try {
      console.log('Performing game action:', action, data);

      if (!gameState) {
        throw new Error('Game state not found');
      }

      // Create a deep copy of the game state to modify
      const updatedGameState = JSON.parse(JSON.stringify(gameState));
      const currentPlayerState = updatedGameState.player_states[userId];

      if (!currentPlayerState) {
        throw new Error('Player state not found');
      }

      switch (action) {
        case 'change_own_shield': {
          // Draw a card from the deck
          if (updatedGameState.deck.length === 0) {
            throw new Error('Deck is empty');
          }

          const newCard = updatedGameState.deck.pop();

          // If player already has a shield, move it to discard pile
          if (currentPlayerState.shield) {
            updatedGameState.discard_pile.push(currentPlayerState.shield);
          }

          // Set the new card as shield
          currentPlayerState.shield = newCard;

          // Move to next player
          const playerIds = Object.keys(updatedGameState.player_states);
          const currentPlayerIndex = playerIds.indexOf(userId);
          const nextPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
          updatedGameState.current_player_id = playerIds[nextPlayerIndex];

          break;
        }

        case 'change_other_shield': {
          // Check if target player exists
          const targetId = data?.targetId;
          if (!targetId || !updatedGameState.player_states[targetId]) {
            throw new Error('Invalid target player');
          }

          // Draw a card from the deck
          if (updatedGameState.deck.length === 0) {
            throw new Error('Deck is empty');
          }

          const newCard = updatedGameState.deck.pop();
          const targetPlayerState = updatedGameState.player_states[targetId];

          // If target player already has a shield, move it to discard pile
          if (targetPlayerState.shield) {
            updatedGameState.discard_pile.push(targetPlayerState.shield);
          }

          // Set the new card as shield for target player
          targetPlayerState.shield = newCard;

          // Move to next player
          const playerIds = Object.keys(updatedGameState.player_states);
          const currentPlayerIndex = playerIds.indexOf(userId);
          const nextPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
          updatedGameState.current_player_id = playerIds[nextPlayerIndex];

          break;
        }

        case 'store_card': {
          // Draw a card from the deck
          if (updatedGameState.deck.length === 0) {
            throw new Error('Deck is empty');
          }

          const newCard = updatedGameState.deck.pop();

          // Add the card to stored cards
          currentPlayerState.stored_cards.push(newCard);

          // Move to next player
          const playerIds = Object.keys(updatedGameState.player_states);
          const currentPlayerIndex = playerIds.indexOf(userId);
          const nextPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
          updatedGameState.current_player_id = playerIds[nextPlayerIndex];

          break;
        }

        case 'attack': {
          // Check if target player exists
          const targetId = data?.targetId;
          if (!targetId || !updatedGameState.player_states[targetId]) {
            throw new Error('Invalid target player');
          }

          const targetPlayerState = updatedGameState.player_states[targetId];

          // Draw a card from the deck for attack
          if (updatedGameState.deck.length === 0) {
            throw new Error('Deck is empty');
          }

          const attackCard = updatedGameState.deck.pop();
          let attackValue = getCardValue(attackCard);

          // Add stored cards to attack if specified
          const storedCardIndices = data?.storedCardIndices || [];
          const usedStoredCards = [];

          for (const index of storedCardIndices) {
            if (index >= 0 && index < currentPlayerState.stored_cards.length) {
              const storedCard = currentPlayerState.stored_cards[index];
              attackValue += getCardValue(storedCard);
              usedStoredCards.push(storedCard);
            }
          }

          // Remove used stored cards (in reverse order to avoid index issues)
          for (let i = storedCardIndices.length - 1; i >= 0; i--) {
            const index = storedCardIndices[i];
            if (index >= 0 && index < currentPlayerState.stored_cards.length) {
              currentPlayerState.stored_cards.splice(index, 1);
            }
          }

          // Compare attack value with shield value
          const shieldValue = targetPlayerState.shield ? getCardValue(targetPlayerState.shield) : 0;

          // If attack is successful, reduce target's HP
          if (attackValue > shieldValue) {
            const damage = attackValue - shieldValue;
            targetPlayerState.hp = Math.max(0, targetPlayerState.hp - damage);

            // When a player with stored cards is hit, the stored card(s) is/are discarded
            if (targetPlayerState.stored_cards.length > 0) {
              // Add all stored cards to discard pile
              updatedGameState.discard_pile.push(...targetPlayerState.stored_cards);
              // Clear stored cards
              targetPlayerState.stored_cards = [];
            }
          }

          // Add attack card to discard pile
          updatedGameState.discard_pile.push(attackCard);

          // Add used stored cards to discard pile
          updatedGameState.discard_pile.push(...usedStoredCards);

          // Move to next player
          const playerIds = Object.keys(updatedGameState.player_states);
          const currentPlayerIndex = playerIds.indexOf(userId);
          const nextPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
          updatedGameState.current_player_id = playerIds[nextPlayerIndex];

          break;
        }

        default:
          console.log('Unknown action:', action);
          return { success: false, error: new Error('Unknown action') };
      }

      // Update the game state in the database
      const { error } = await supabase
        .from('game_states')
        .update({
          current_player_id: updatedGameState.current_player_id,
          deck: updatedGameState.deck,
          discard_pile: updatedGameState.discard_pile,
          player_states: updatedGameState.player_states,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedGameState.id);

      if (error) {
        throw error;
      }

      // Update local state
      setGameState(updatedGameState);

      return { success: true, error: null };
    } catch (err) {
      console.error('Error performing game action:', err);
      return { success: false, error: err };
    }
  };

  const isPlayerTurn = () => {
    if (!gameState || !gameState.current_player_id) return false;
    return gameState.current_player_id === userId;
  };

  const getPlayerHand = () => {
    if (!gameState || !gameState.player_states || !gameState.player_states[userId]) return [];
    return gameState.player_states[userId].hand || [];
  };

  return {
    gameState,
    loading,
    error,
    setupPlayerCards,
    performGameAction,
    isPlayerTurn,
    getPlayerHand
  };
};
