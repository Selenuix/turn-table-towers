
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameState, Card, PlayerState } from '@/features/game-room/types';

export const useGameState = (roomId: string, userId: string) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const subscriptionRef = useRef<any>(null);
  const channelNameRef = useRef<string>('');

  useEffect(() => {
    if (!roomId) return;

    const fetchGameState = async () => {
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
          setGameState(transformedGameState);
        } else {
          // No game state found - this is expected if the game hasn't started yet
          console.log('No game state found for room:', roomId);
          setGameState(null);
        }
      } catch (err) {
        console.error('Error fetching game state:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    // Clean up any existing subscription before creating a new one
    if (subscriptionRef.current) {
      console.log('Cleaning up existing game state subscription:', channelNameRef.current);
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    fetchGameState();

    // Set up real-time subscription with unique channel name
    const channelName = `game_state_${roomId}_${userId}_${Date.now()}`;
    channelNameRef.current = channelName;
    
    console.log('Creating game state subscription:', channelName);
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'game_states', filter: `room_id=eq.${roomId}` },
        (payload) => {
          console.log('Game state update received:', payload.eventType, payload);
          
          // Type guard to ensure payload.new exists and has the expected structure
          if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
            const newData = payload.new as any;
            const transformedGameState: GameState = {
              id: newData.id,
              room_id: newData.room_id,
              current_player_id: newData.current_player_id,
              deck: newData.deck,
              discard_pile: newData.discard_pile,
              created_at: newData.created_at,
              updated_at: newData.updated_at,
              player_states: (newData.player_states as Record<string, any>) || {}
            };
            setGameState(transformedGameState);
          } else if (payload.eventType === 'DELETE') {
            setGameState(null);
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        console.log('Cleaning up game state subscription on unmount:', channelNameRef.current);
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
        channelNameRef.current = '';
      }
    };
  }, [roomId, userId]);

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
