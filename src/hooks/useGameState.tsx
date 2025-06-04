
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameState, Card, PlayerState } from '@/features/game-room/types';

export const useGameState = (roomId: string, userId: string) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!roomId) return;

    const fetchGameState = async () => {
      try {
        const { data, error } = await supabase
          .from('game_states')
          .select('*')
          .eq('room_id', roomId)
          .single();

        if (error) throw error;
        
        // Transform the data to match our GameState interface
        if (data) {
          const transformedGameState: GameState = {
            ...data,
            player_states: data.player_states as Record<string, PlayerState>
          };
          setGameState(transformedGameState);
        }
      } catch (err) {
        console.error('Error fetching game state:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGameState();

    // Set up real-time subscription with unique channel name to prevent duplicates
    const channelName = `game_state_${roomId}_${userId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'game_states', filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.new) {
            const transformedGameState: GameState = {
              ...payload.new,
              player_states: payload.new.player_states as Record<string, PlayerState>
            };
            setGameState(transformedGameState);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, userId]);

  const setupPlayerCards = async (shieldIndex: number, hpIndices: number[]) => {
    try {
      const { data, error } = await supabase
        .rpc('update_player_cards', {
          p_room_id: roomId,
          p_player_id: userId,
          p_shield_index: shieldIndex,
          p_hp_indices: hpIndices
        });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error('Error setting up player cards:', err);
      return { data: null, error: err };
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
    isPlayerTurn,
    getPlayerHand
  };
};
