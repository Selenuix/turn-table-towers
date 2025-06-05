
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameState, Card, PlayerState, RoomStatus } from '@/features/game-room/types';
import { getCardValue } from '@/features/game-room/utils/gameLogic';

export const useGameState = (roomId: string, userId: string) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const isMountedRef = useRef<boolean>(true);
  const subscriptionRef = useRef<any>(null);

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
          player_states: typeof gameStateResult.data.player_states === 'string' 
            ? JSON.parse(gameStateResult.data.player_states)
            : gameStateResult.data.player_states,
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

  // Optimized subscription with better cleanup
  useEffect(() => {
    isMountedRef.current = true;

    if (!roomId) {
      setLoading(false);
      return;
    }

    // Fetch initial data
    fetchGameState();

    // Clean up previous subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    // Subscribe to real-time updates
    const channelName = `game_state_${roomId}_${userId}_${Date.now()}`;
    const subscription = supabase
      .channel(channelName)
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
        supabase.removeChannel(subscriptionRef.current);
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

  const shuffleDeck = (deck: Card[]): Card[] => {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const performGameAction = async (action: string, data?: any) => {
    if (!gameState || gameState.status === 'finished') {
      throw new Error('Game is not active');
    }

    try {
      let updatedGameState = { ...gameState };

      switch (action) {
        case 'change_own_shield': {
          // Check if deck is empty and reshuffle if needed
          if (updatedGameState.deck.length === 0) {
            if (updatedGameState.discard_pile.length === 0) {
              throw new Error('No cards available');
            }
            // Reshuffle discard pile into deck
            updatedGameState.deck = shuffleDeck(updatedGameState.discard_pile);
            updatedGameState.discard_pile = [];
          }

          const newCard = updatedGameState.deck.pop();
          if (!newCard) throw new Error('No card available');

          // If player already has a shield, move it to discard pile
          if (updatedGameState.player_states[userId].shield) {
            updatedGameState.discard_pile.push(updatedGameState.player_states[userId].shield);
          }

          // Set the new card as shield
          updatedGameState.player_states[userId].shield = newCard;

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

          // Check if deck is empty and reshuffle if needed
          if (updatedGameState.deck.length === 0) {
            if (updatedGameState.discard_pile.length === 0) {
              throw new Error('No cards available');
            }
            updatedGameState.deck = shuffleDeck(updatedGameState.discard_pile);
            updatedGameState.discard_pile = [];
          }

          const newCard = updatedGameState.deck.pop();
          if (!newCard) throw new Error('No card available');
          
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
          // Check if deck is empty and reshuffle if needed
          if (updatedGameState.deck.length === 0) {
            if (updatedGameState.discard_pile.length === 0) {
              throw new Error('No cards available');
            }
            updatedGameState.deck = shuffleDeck(updatedGameState.discard_pile);
            updatedGameState.discard_pile = [];
          }

          const newCard = updatedGameState.deck.pop();
          if (!newCard) throw new Error('No card available');

          // Add the card to stored cards
          updatedGameState.player_states[userId].stored_cards.push(newCard);

          // Move to next player
          const playerIds = Object.keys(updatedGameState.player_states);
          const currentPlayerIndex = playerIds.indexOf(userId);
          const nextPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
          updatedGameState.current_player_id = playerIds[nextPlayerIndex];

          break;
        }

        case 'attack': {
          const { targetId, storedCardIndices } = data;
          const currentPlayerState = updatedGameState.player_states[userId];
          const targetPlayerState = updatedGameState.player_states[targetId];

          if (!currentPlayerState || !targetPlayerState) {
            throw new Error('Invalid player state');
          }

          // Check if deck is empty and reshuffle if needed
          if (updatedGameState.deck.length === 0) {
            if (updatedGameState.discard_pile.length === 0) {
              throw new Error('No cards available');
            }
            updatedGameState.deck = shuffleDeck(updatedGameState.discard_pile);
            updatedGameState.discard_pile = [];
          }

          // Draw a card for the attack
          const drawnCard = updatedGameState.deck[0];
          if (!drawnCard) throw new Error('No card available for attack');
          
          const attackValue = getCardValue(drawnCard);

          // Calculate total attack value including stored cards
          let totalAttackValue = attackValue;
          const usedStoredCards: Card[] = [];

          if (storedCardIndices && storedCardIndices.length > 0) {
            storedCardIndices.forEach((index: number) => {
              const storedCard = currentPlayerState.stored_cards[index];
              if (storedCard) {
                totalAttackValue += getCardValue(storedCard);
                usedStoredCards.push(storedCard);
              }
            });
          }

          // Calculate shield value
          const shieldValue = targetPlayerState.shield ? getCardValue(targetPlayerState.shield) : 0;

          // Calculate damage (attack - shield)
          const damage = Math.max(0, totalAttackValue - shieldValue);

          // Update target's HP if there is damage
          if (damage > 0) {
            // Ensure HP doesn't go below 0
            targetPlayerState.hp = Math.max(0, targetPlayerState.hp - damage);
            
            // Discard target's stored cards if hit
            if (targetPlayerState.stored_cards.length > 0) {
              updatedGameState.discard_pile.push(...targetPlayerState.stored_cards);
              targetPlayerState.stored_cards = [];
            }
          }

          // Move used cards to discard pile
          updatedGameState.discard_pile.push(drawnCard, ...usedStoredCards);

          // Remove used stored cards from current player
          if (usedStoredCards.length > 0) {
            currentPlayerState.stored_cards = currentPlayerState.stored_cards.filter(
              (_, index) => !storedCardIndices.includes(index)
            );
          }

          // Remove drawn card from deck
          updatedGameState.deck = updatedGameState.deck.slice(1);

          // Check if target is eliminated
          if (targetPlayerState.hp === 0) {
            targetPlayerState.eliminated = true;
          }

          // Check if game should end (only one player remaining)
          const activePlayers = Object.values(updatedGameState.player_states).filter(
            state => !state.eliminated
          );

          if (activePlayers.length === 1) {
            updatedGameState.status = 'finished';
            
            // Update game room status immediately
            const { error: roomError } = await supabase
              .from('game_rooms')
              .update({ 
                status: 'finished',
                updated_at: new Date().toISOString()
              })
              .eq('id', roomId);

            if (roomError) throw roomError;

            // Log game finished
            const winnerId = Object.keys(updatedGameState.player_states).find(
              id => !updatedGameState.player_states[id].eliminated
            );
            if (winnerId) {
              await supabase.rpc('log_game_action', {
                p_room_id: roomId,
                p_player_id: winnerId,
                p_action_type: 'game_finished',
                p_action_data: { winnerId }
              });
            }
          } else {
            // Find next active player
            const currentPlayerIndex = Object.keys(updatedGameState.player_states).findIndex(id => id === userId);
            let nextPlayerIndex = (currentPlayerIndex + 1) % Object.keys(updatedGameState.player_states).length;
            
            // Skip eliminated players
            while (updatedGameState.player_states[Object.keys(updatedGameState.player_states)[nextPlayerIndex]].eliminated) {
              nextPlayerIndex = (nextPlayerIndex + 1) % Object.keys(updatedGameState.player_states).length;
            }
            
            updatedGameState.current_player_id = Object.keys(updatedGameState.player_states)[nextPlayerIndex];
          }

          // Store attack result for logging
          const attackResult = {
            success: true,
            damage,
            attackValue: totalAttackValue,
            shieldValue,
            usedStoredCards
          };

          break;
        }

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Update game state in database
      const { error: updateError } = await supabase
        .from('game_states')
        .update({
          deck: updatedGameState.deck,
          discard_pile: updatedGameState.discard_pile,
          player_states: JSON.stringify(updatedGameState.player_states),
          current_player_id: updatedGameState.current_player_id,
          status: updatedGameState.status,
          updated_at: new Date().toISOString()
        })
        .eq('room_id', roomId);

      if (updateError) throw updateError;

      // Parse the player states back to an object before setting state
      const parsedGameState = {
        ...updatedGameState,
        player_states: JSON.parse(JSON.stringify(updatedGameState.player_states))
      };
      setGameState(parsedGameState);

      // Return success with any additional data
      return { 
        success: true, 
        error: null, 
        data: action === 'attack' ? {
          damage: data?.damage,
          attackValue: data?.attackValue,
          shieldValue: data?.shieldValue
        } : null 
      };
    } catch (error) {
      console.error('Error performing game action:', error);
      return { success: false, error, data: null };
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
