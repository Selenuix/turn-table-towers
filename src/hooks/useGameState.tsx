
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameState, Card, PlayerState, RoomStatus } from '@/features/game-room/types';
import { 
  getCardValue, 
  shuffleDeck, 
  calculateAttackResult, 
  isGameOver, 
  getNextActivePlayer,
  validateAttack
} from '@/features/game-room/utils/gameLogic';

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
  }, [roomId, fetchGameState]);

  const setupPlayerCards = async (shieldIndex: number, hpIndices: number[]) => {
    try {
      console.log('Setting up player cards:', { shieldIndex, hpIndices });

      // Get current game state
      const { data: currentGameState, error: fetchError } = await supabase
        .from('game_states')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (fetchError) throw fetchError;

      // Parse player states
      const playerStates = typeof currentGameState.player_states === 'string' 
        ? JSON.parse(currentGameState.player_states) 
        : currentGameState.player_states;

      const currentPlayerState = playerStates[userId];
      if (!currentPlayerState || !currentPlayerState.hand) {
        throw new Error('Player state not found or no hand available');
      }

      // Set up shield card
      const shieldCard = currentPlayerState.hand[shieldIndex];
      
      // Set up HP cards
      const hpCards = hpIndices.map(index => currentPlayerState.hand[index]);
      const hpValue = hpCards.reduce((total, card) => total + getCardValue(card), 0);

      // Remove selected cards from hand
      const remainingHand = currentPlayerState.hand.filter((_, index) => 
        index !== shieldIndex && !hpIndices.includes(index)
      );

      // Update player state
      const updatedPlayerState = {
        ...currentPlayerState,
        hand: remainingHand,
        shield: shieldCard,
        hp_cards: hpCards,
        hp: hpValue,
        setup_complete: true
      };

      // Update player states
      const updatedPlayerStates = {
        ...playerStates,
        [userId]: updatedPlayerState
      };

      // Check if all players have completed setup
      const allPlayersSetup = Object.values(updatedPlayerStates).every((state: any) => state.setup_complete);

      // Update game state in database
      const { data, error } = await supabase
        .from('game_states')
        .update({
          player_states: JSON.stringify(updatedPlayerStates),
          status: allPlayersSetup ? 'in_progress' : 'waiting',
          updated_at: new Date().toISOString()
        })
        .eq('room_id', roomId)
        .select()
        .single();

      if (error) throw error;

      // If all players are set up, also update the room status
      if (allPlayersSetup) {
        await supabase
          .from('game_rooms')
          .update({ status: 'in_progress' })
          .eq('id', roomId);
      }

      console.log('Player cards setup successful:', data);
      return { data, error: null };
    } catch (err) {
      console.error('Error setting up player cards:', err);
      return { data: null, error: err };
    }
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

          // Move to next player using enhanced logic
          const nextPlayer = getNextActivePlayer(userId, updatedGameState.player_states);
          if (nextPlayer) {
            updatedGameState.current_player_id = nextPlayer;
          }

          break;
        }

        case 'change_other_shield': {
          // Check if target player exists and is active
          const targetId = data?.targetId;
          const targetPlayerState = updatedGameState.player_states[targetId];
          if (!targetId || !targetPlayerState || targetPlayerState.eliminated) {
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

          // If target player already has a shield, move it to discard pile
          if (targetPlayerState.shield) {
            updatedGameState.discard_pile.push(targetPlayerState.shield);
          }

          // Set the new card as shield for target player
          targetPlayerState.shield = newCard;

          // Move to next player using enhanced logic
          const nextPlayer = getNextActivePlayer(userId, updatedGameState.player_states);
          if (nextPlayer) {
            updatedGameState.current_player_id = nextPlayer;
          }

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

          // Move to next player using enhanced logic
          const nextPlayer = getNextActivePlayer(userId, updatedGameState.player_states);
          if (nextPlayer) {
            updatedGameState.current_player_id = nextPlayer;
          }

          break;
        }

        case 'attack': {
          const { targetId, storedCardIndices = [] } = data;
          const currentPlayerState = updatedGameState.player_states[userId];
          const targetPlayerState = updatedGameState.player_states[targetId];

          if (!currentPlayerState || !targetPlayerState || targetPlayerState.eliminated) {
            throw new Error('Invalid player state or target is eliminated');
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

          // Validate attack using enhanced logic
          const attackValidation = validateAttack(
            currentPlayerState.stored_cards,
            storedCardIndices,
            drawnCard,
            targetPlayerState.shield
          );

          if (!attackValidation.valid) {
            throw new Error(attackValidation.reason);
          }

          // Get stored cards being used
          const usedStoredCards = storedCardIndices.map(index => currentPlayerState.stored_cards[index]);

          // Calculate attack result using enhanced logic
          const attackResult = calculateAttackResult(
            drawnCard,
            usedStoredCards,
            targetPlayerState.shield
          );

          // Apply damage if attack succeeds
          if (attackResult.success && attackResult.damage > 0) {
            targetPlayerState.hp = Math.max(0, targetPlayerState.hp - attackResult.damage);
            
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
          if (targetPlayerState.hp < 0) {
            targetPlayerState.eliminated = true;
          }

          // Check if game should end using enhanced logic
          const gameOverResult = isGameOver(updatedGameState.player_states);
          if (gameOverResult.gameOver) {
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
            if (gameOverResult.winner) {
              await supabase.rpc('log_game_action', {
                p_room_id: roomId,
                p_player_id: gameOverResult.winner,
                p_action_type: 'game_finished',
                p_action_data: { winnerId: gameOverResult.winner }
              });
            }
          } else {
            // Move to next active player using enhanced logic
            const nextPlayer = getNextActivePlayer(userId, updatedGameState.player_states);
            if (nextPlayer) {
              updatedGameState.current_player_id = nextPlayer;
            }
          }

          // Store attack result data for logging
          const attackResultData = {
            attackValue: attackResult.totalAttackValue,
            shieldValue: attackResult.shieldValue,
            damage: attackResult.damage
          };

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

          // Return success with attack data
          return { 
            success: true, 
            error: null, 
            data: attackResultData
          };
        }

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Update game state in database for non-attack actions
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
        data: null 
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
