
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameState, RoomStatus } from '@/features/game-room/types';

export const useGameStateManager = (roomId: string, userId: string) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const isMountedRef = useRef<boolean>(true);
  const subscriptionRef = useRef<any>(null);
  const lastUpdateRef = useRef<string>('');

  const fetchGameState = useCallback(async () => {
    if (!roomId) return;

    try {
      console.log('Fetching game state for room:', roomId);
      
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

      if (gameStateResult.data) {
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

        // Only update if this is a newer state
        if (lastUpdateRef.current !== transformedGameState.updated_at) {
          lastUpdateRef.current = transformedGameState.updated_at;
          if (isMountedRef.current) {
            setGameState(transformedGameState);
          }
        }
      } else {
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

    fetchGameState();

    // Clean up previous subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    // Subscribe to real-time updates with debouncing
    const channelName = `game_state_${roomId}_${userId}_${Date.now()}`;
    let debounceTimeout: NodeJS.Timeout;

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
          console.log('Received real-time game state update:', payload);
          
          // Debounce rapid updates
          clearTimeout(debounceTimeout);
          debounceTimeout = setTimeout(() => {
            if (isMountedRef.current) {
              fetchGameState();
            }
          }, 100);
        }
      )
      .subscribe();

    subscriptionRef.current = subscription;

    return () => {
      isMountedRef.current = false;
      clearTimeout(debounceTimeout);

      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [roomId, fetchGameState, userId]);

  return {
    gameState,
    loading,
    error,
    refetchGameState: fetchGameState
  };
};
