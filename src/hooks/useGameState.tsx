
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameState, Card, PlayerState } from '@/features/game-room/types';

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

      // For now, we'll implement basic actions
      // In a full implementation, you'd have a comprehensive RPC function for all game actions

      switch (action) {
        case 'change_own_shield':
          // This would call an RPC function to draw a card and replace the shield
          console.log('Changing own shield');
          break;
        case 'change_other_shield':
          console.log('Changing other player shield for:', data?.targetId);
          break;
        case 'store_card':
          console.log('Storing a card');
          break;
        case 'attack':
          console.log('Attacking player:', data?.targetId, 'with stored cards:', data?.storedCardIndices);
          break;
        default:
          console.log('Unknown action:', action);
      }

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
