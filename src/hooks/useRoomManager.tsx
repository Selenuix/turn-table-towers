
import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from './useAuthContext';
import { useToast } from '@/hooks/use-toast';
import { GameRoom, Player } from '@/features/game-room/types';

export const useRoomManager = () => {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();
  const { toast } = useToast();
  const isMountedRef = useRef<boolean>(true);
  const subscriptionRef = useRef<any>(null);

  const fetchRooms = useCallback(async () => {
    try {
      console.log('Fetching rooms with status: waiting');
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched rooms:', data);
      
      if (isMountedRef.current) {
        const typedRooms: GameRoom[] = (data || []).map(room => ({
          id: room.id,
          name: room.name,
          owner_id: room.owner_id,
          player_ids: room.player_ids || [],
          max_players: room.max_players || 4,
          status: room.status,
          room_code: room.room_code,
          created_at: room.created_at,
          updated_at: room.updated_at
        }));
        setRooms(typedRooms);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      if (isMountedRef.current) {
        toast({
          title: "Error",
          description: "Failed to load game rooms",
          variant: "destructive",
        });
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [toast]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchRooms();

    // Clean up any existing subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    // Set up real-time subscription for game_rooms table
    const channelName = `game_rooms_realtime_${user.id}`;
    
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rooms',
          filter: `status=eq.waiting`
        },
        async (payload) => {
          console.log('Real-time room update:', payload);
          
          if (!isMountedRef.current) return;

          // Refetch rooms on any change to ensure consistency
          await fetchRooms();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to game rooms updates');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.error('Subscription error:', status);
        }
      });

    subscriptionRef.current = subscription;

    return () => {
      isMountedRef.current = false;
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user?.id, fetchRooms]);

  const getRoom = useCallback(async (roomId: string): Promise<GameRoom | null> => {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        owner_id: data.owner_id,
        player_ids: data.player_ids || [],
        max_players: data.max_players || 4,
        status: data.status,
        room_code: data.room_code,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
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

      console.log('Creating room with status: waiting');
      const { data, error } = await supabase
        .from('game_rooms')
        .insert({
          name: name || null,
          owner_id: user.id,
          player_ids: [user.id],
          max_players: maxPlayers,
          room_code: codeData,
          status: 'waiting'
        })
        .select()
        .single();

      if (error) throw error;
      console.log('Room created:', data);

      toast({
        title: "Room created!",
        description: `Room "${data.name || data.room_code}" created successfully`,
      });

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
  }, [user, toast]);

  const joinRoom = useCallback(async (roomCode: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data: roomData, error: fetchError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomCode.toUpperCase())
        .single();

      if (fetchError) throw fetchError;
      if (!roomData) throw new Error('Room not found');
      if (roomData.status !== 'waiting') throw new Error('Game is already in progress');

      const currentPlayerIds = roomData.player_ids.map(id => id.toString());
      const newPlayerIds = [...currentPlayerIds, user.id.toString()];

      const { data, error } = await supabase
        .rpc('join_game_room', {
          p_room_id: roomData.id,
          p_current_player_ids: currentPlayerIds,
          p_new_player_ids: newPlayerIds
        });

      if (error) throw error;
      if (!data) throw new Error('Failed to join room - please try again');

      toast({
        title: "Joined room!",
        description: `You joined ${data.name || data.room_code}`,
      });

      return { data: { ...data, id: roomData.id }, error: null };
    } catch (error: any) {
      console.error('Error joining room:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join room",
        variant: "destructive",
      });
      return { data: null, error };
    }
  }, [user, toast]);

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
          .eq('id', roomData.id);

        if (deleteError) throw deleteError;
      } else {
        const newOwnerId = roomData.owner_id === user.id ? updatedPlayerIds[0] : roomData.owner_id;

        const { error: updateError } = await supabase
          .rpc('leave_game_room', {
            p_room_id: roomData.id,
            p_current_player_ids: roomData.player_ids,
            p_new_player_ids: updatedPlayerIds,
            p_new_owner_id: newOwnerId
          });

        if (updateError) {
          if (updateError.code === 'PGRST116') {
            return await leaveRoom(roomId);
          }
          throw updateError;
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Error leaving room:', error);
      return { error };
    }
  }, [user]);

  const startGame = useCallback(async (roomId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error starting game:', error);
      return { error };
    }
  }, [user]);

  return {
    rooms,
    loading,
    createRoom,
    joinRoom,
    leaveRoom,
    getRoom,
    getPlayers,
    startGame,
    refetchRooms: fetchRooms,
    currentUser: user,
  };
};
