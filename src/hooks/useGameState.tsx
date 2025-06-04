import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameState, Card, PlayerState, RoomStatus } from '@/features/game-room/types';
import { getCardValue } from '@/features/game-room/utils/gameLogic';

export const useGameState = (roomId: string, userId: string) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const isMountedRef = useRef<boolean>(true);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  const fetchGameState = useCallback(async () => {
    if (!roomId) return;

    try {
      console.log('Fetching game state for room:', roomId);
      
      // Fetch both game state and game room
      const [gameStateResult, gameRoomResult] = await Promise.all([
        supabase
          .from('game_states')
          .select('*')
          .eq('room_id', roomId)
          .maybeSingle(),
        supabase
          .from('game_rooms')
          .select('status')
          .eq('id', roomId)
          .single()
      ]);

      if (gameStateResult.error) {
        console.error('Error fetching game state:', gameStateResult.error);
        throw gameStateResult.error;
      }

      if (gameRoomResult.error) {
        console.error('Error fetching game room:', gameRoomResult.error);
        throw gameRoomResult.error;
      }

      // Transform the data to match our GameState interface if data exists
      if (gameStateResult.data) {
        console.log('Game state found:', gameStateResult.data);
        const transformedGameState: GameState = {
          id: gameStateResult.data.id,
          room_id: gameStateResult.data.room_id,
          current_player_id: gameStateResult.data.current_player_id,
          deck: gameStateResult.data.deck,
          discard_pile: gameStateResult.data.discard_pile,
          created_at: gameStateResult.data.created_at,
          updated_at: gameStateResult.data.updated_at,
          player_states: (gameStateResult.data.player_states as Record<string, any>) || {},
          status: gameRoomResult.data.status as RoomStatus
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

  useEffect(() => {
    isMountedRef.current = true;

    if (!roomId) {
      setLoading(false);
      return;
    }

    // Fetch initial data
    fetchGameState();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('game_state_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_states',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          console.log('Received real-time update:', payload);
          
          // Fetch the latest game state when we receive an update
          if (isMountedRef.current) {
            await fetchGameState();
          }
        }
      )
      .subscribe();

    subscriptionRef.current = subscription;

    return () => {
      isMountedRef.current = false;

      // Clean up subscription on unmount
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [roomId, userId, fetchGameState]);

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
    if (!gameState) return;

    try {
      // Create a deep copy of the game state to modify
      const updatedGameState = JSON.parse(JSON.stringify(gameState));
      const currentPlayerState = updatedGameState.player_states[userId];

      if (!currentPlayerState) {
        throw new Error('Player state not found');
      }

      // Check if game is already over
      if (gameState.status === 'finished') {
        throw new Error('Game is already over');
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

          // Update the game state in the database
          const { error } = await supabase
            .from('game_states')
            .update({
              deck: updatedGameState.deck,
              discard_pile: updatedGameState.discard_pile,
              player_states: updatedGameState.player_states,
              current_player_id: updatedGameState.current_player_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', updatedGameState.id);

          if (error) throw error;
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

          // Update the game state in the database
          const { error } = await supabase
            .from('game_states')
            .update({
              deck: updatedGameState.deck,
              discard_pile: updatedGameState.discard_pile,
              player_states: updatedGameState.player_states,
              current_player_id: updatedGameState.current_player_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', updatedGameState.id);

          if (error) throw error;
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

          // Update the game state in the database
          const { error } = await supabase
            .from('game_states')
            .update({
              deck: updatedGameState.deck,
              player_states: updatedGameState.player_states,
              current_player_id: updatedGameState.current_player_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', updatedGameState.id);

          if (error) throw error;
          break;
        }

        case 'attack': {
          const targetId = data?.targetId;
          if (!targetId || !updatedGameState.player_states[targetId]) {
            throw new Error('Invalid target player');
          }

          // Draw a card for the attack
          if (updatedGameState.deck.length === 0) {
            throw new Error('Deck is empty');
          }

          const attackCard = updatedGameState.deck.pop();
          const targetPlayerState = updatedGameState.player_states[targetId];

          // Calculate total attack value including stored cards
          let attackValue = getCardValue(attackCard);
          const usedStoredCards: Card[] = [];

          // Add stored cards to attack if specified
          if (data.storedCardIndices?.length) {
            for (const index of data.storedCardIndices) {
              const storedCard = currentPlayerState.stored_cards[index];
              if (storedCard) {
                attackValue += getCardValue(storedCard);
                usedStoredCards.push(storedCard);
              }
            }
            // Remove used stored cards
            currentPlayerState.stored_cards = currentPlayerState.stored_cards.filter(
              (_, index) => !data.storedCardIndices.includes(index)
            );
          }

          const shieldValue = targetPlayerState.shield ? getCardValue(targetPlayerState.shield) : 0;

          // Check if attack is successful
          if (attackValue > shieldValue) {
            // Attack successful, reduce target's HP
            targetPlayerState.hp = Math.max(0, targetPlayerState.hp - (attackValue - shieldValue));

            // Discard target's stored cards when hit
            if (targetPlayerState.stored_cards.length > 0) {
              updatedGameState.discard_pile.push(...targetPlayerState.stored_cards);
              targetPlayerState.stored_cards = [];
            }

            // Check if target is eliminated
            if (targetPlayerState.hp <= 0) {
              // Check if game is over (only one player alive)
              const alivePlayers = Object.entries(updatedGameState.player_states)
                .filter(([_, state]) => (state as PlayerState).hp > 0);

              if (alivePlayers.length === 1) {
                // Game is over, update game status
                const { error: gameError } = await supabase
                  .from('game_rooms')
                  .update({ 
                    status: 'finished',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', roomId);

                if (gameError) throw gameError;

                // Update game state status
                updatedGameState.status = 'finished';
              }
            }
          }

          // Move attack card and used stored cards to discard pile
          updatedGameState.discard_pile.push(attackCard, ...usedStoredCards);

          // Move to next player
          const playerIds = Object.keys(updatedGameState.player_states);
          const currentPlayerIndex = playerIds.indexOf(userId);
          const nextPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
          updatedGameState.current_player_id = playerIds[nextPlayerIndex];

          // Update the game state in the database
          const { error } = await supabase
            .from('game_states')
            .update({
              deck: updatedGameState.deck,
              discard_pile: updatedGameState.discard_pile,
              player_states: updatedGameState.player_states,
              current_player_id: updatedGameState.current_player_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', updatedGameState.id);

          if (error) throw error;
          break;
        }

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Update local state after successful database update
      setGameState(updatedGameState);
      return { success: true, error: null };
    } catch (error) {
      console.error('Error performing game action:', error);
      return { success: false, error };
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
