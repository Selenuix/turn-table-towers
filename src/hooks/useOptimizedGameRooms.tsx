
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from './useAuthContext';
import { useToast } from '@/hooks/use-toast';
import { GameRoom, Player } from '@/features/game-room/types';

export const useOptimizedGameRooms = () => {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();
  const { toast } = useToast();
  const subscriptionRef = useRef<any>(null);

  const fetchRooms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load game rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getRoom = useCallback(async (roomId: string): Promise<GameRoom | null> => {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching room:', error);
      return null;
    }
  }, []);

  const getPlayers = useCallback(async (playerIds: string[]): Promise<Player[]> => {
    if (!playerIds.length) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', playerIds);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching players:', error);
      return [];
    }
  }, []);

  const createRoom = useCallback(async (name: string, maxPlayers: number) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_room_code');

      if (codeError) throw codeError;

      const { data, error } = await supabase
        .from('game_rooms')
        .insert({
          name: name || null,
          owner_id: user.id,
          player_ids: [user.id],
          max_players: maxPlayers,
          room_code: codeData,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Room created!",
        description: `Room "${data.name || data.room_code}" created successfully`,
      });

      await fetchRooms();
      return { data, error: null };
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive",
      });
      return { data: null, error };
    }
  }, [user, toast, fetchRooms]);

  const joinRoom = useCallback(async (roomId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data: roomData, error: fetchError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (fetchError) throw fetchError;

      if (!roomData) throw new Error('Room not found');
      if (roomData.player_ids.length >= roomData.max_players) throw new Error('Room is full');
      if (roomData.status !== 'waiting') throw new Error('Game is already in progress');
      if (roomData.player_ids.includes(user.id)) return { data: roomData, error: null };

      const updatedPlayerIds = [...roomData.player_ids, user.id];

      const { data, error } = await supabase
        .rpc('join_game_room', {
          p_room_id: roomId,
          p_current_player_ids: roomData.player_ids,
          p_new_player_ids: updatedPlayerIds
        });

      if (error) throw error;
      if (!data) throw new Error('Failed to join room - please try again');

      toast({
        title: "Joined room!",
        description: `You joined ${data.name || 'the game room'}`,
      });

      await fetchRooms();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error joining room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join room",
        variant: "destructive",
      });
      return { data: null, error };
    }
  }, [user, toast, fetchRooms]);

  const startGame = useCallback(async (roomId: string) => {
    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);

      if (error) throw error;
    } catch (error) {
      console.error('Error starting game:', error);
      throw error;
    }
  }, []);

  const leaveRoom = useCallback(async (roomId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data: roomData, error: fetchError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (fetchError) throw fetchError;
      if (!roomData) throw new Error('Room not found');

      const updatedPlayerIds = roomData.player_ids.filter(id => id !== user.id);

      if (updatedPlayerIds.length === 0) {
        const { error: deleteError } = await supabase
          .from('game_rooms')
          .delete()
          .eq('id', roomId);

        if (deleteError) throw deleteError;
      } else {
        const newOwnerId = roomData.owner_id === user.id ? updatedPlayerIds[0] : roomData.owner_id;

        const { error: updateError } = await supabase
          .rpc('leave_game_room', {
            p_room_id: roomId,
            p_current_player_ids: roomData.player_ids,
            p_new_player_ids: updatedPlayerIds,
            p_new_owner_id: newOwnerId
          });

        if (updateError) throw updateError;
      }

      await fetchRooms();
      return { error: null };
    } catch (error) {
      console.error('Error leaving room:', error);
      return { error };
    }
  }, [user, fetchRooms]);

  useEffect(() => {
    if (!user?.id) return;

    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    fetchRooms();

    const channelName = `game_rooms_${user.id}_${Date.now()}`;
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'game_rooms' },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            setRooms(prevRooms => prevRooms.filter(room => room.id !== payload.old.id));
            return;
          }
          await fetchRooms();
        }
      )
      .subscribe();

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user?.id, fetchRooms]);

  return {
    rooms,
    loading,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    getRoom,
    getPlayers,
    refetchRooms: fetchRooms,
    currentUser: user,
  };
};
