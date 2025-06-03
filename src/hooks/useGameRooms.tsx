import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface GameRoom {
  id: string;
  name: string | null;
  owner_id: string;
  player_ids: string[];
  max_players: number;
  status: string;
  room_code: string;
  created_at: string;
  updated_at: string;
}

export const useGameRooms = () => {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const subscriptionRef = useRef<any>(null);

  const fetchRooms = async () => {
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
  };

  const createRoom = async (name: string, maxPlayers: number) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // Generate room code
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
  };

  const joinRoom = async (roomId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // First get the current room data with a lock
      const { data: roomData, error: fetchError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (fetchError) throw fetchError;

      if (!roomData) {
        throw new Error('Room not found');
      }

      if (roomData.player_ids.length >= roomData.max_players) {
        throw new Error('Room is full');
      }

      if (roomData.status !== 'waiting') {
        throw new Error('Game is already in progress');
      }

      if (roomData.player_ids.includes(user.id)) {
        return { data: roomData, error: null };
      }

      // Add user to room with optimistic locking
      const updatedPlayerIds = [...roomData.player_ids, user.id];

      // Use a raw query to properly handle array comparison
      const { data, error } = await supabase
        .rpc('join_game_room', {
          p_room_id: roomId,
          p_current_player_ids: roomData.player_ids,
          p_new_player_ids: updatedPlayerIds
        });

      if (error) {
        if (error.code === 'PGRST116') {
          // Concurrent update detected, retry once
          return await joinRoom(roomId);
        }
        throw error;
      }

      if (!data) {
        throw new Error('Failed to join room - please try again');
      }

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
  };

  const joinRoomByCode = async (roomCode: string) => {
    try {
      const { data: roomData, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .single();

      if (error || !roomData) {
        throw new Error('Room not found');
      }

      return await joinRoom(roomData.id);
    } catch (error: any) {
      console.error('Error joining room by code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join room",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const leaveRoom = async (roomId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // First get the current room data with a lock
      const { data: roomData, error: fetchError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (fetchError) throw fetchError;

      if (!roomData) {
        throw new Error('Room not found');
      }

      // Remove the current user from player_ids
      const updatedPlayerIds = roomData.player_ids.filter(id => id !== user.id);

      // If room becomes empty, delete it
      if (updatedPlayerIds.length === 0) {
        const { error: deleteError } = await supabase
          .from('game_rooms')
          .delete()
          .eq('id', roomId);

        if (deleteError) throw deleteError;
      } else {
        // If the leaving user is the owner, transfer ownership to the next player
        const newOwnerId = roomData.owner_id === user.id ? updatedPlayerIds[0] : roomData.owner_id;

        // Use a raw query to properly handle array update
        const { error: updateError } = await supabase
          .rpc('leave_game_room', {
            p_room_id: roomId,
            p_current_player_ids: roomData.player_ids,
            p_new_player_ids: updatedPlayerIds,
            p_new_owner_id: newOwnerId
          });

        if (updateError) {
          if (updateError.code === 'PGRST116') {
            // Concurrent update detected, retry once
            return await leaveRoom(roomId);
          }
          throw updateError;
        }
      }

      await fetchRooms();
      return { error: null };
    } catch (error) {
      console.error('Error leaving room:', error);
      return { error };
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    // Clean up any existing subscription first
    if (subscriptionRef.current) {
      console.log('Cleaning up existing subscription before creating new one');
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    fetchRooms();

    // Create a unique channel name with user ID and timestamp
    const channelName = `game_rooms_${user.id}_${Date.now()}`;

    console.log('Setting up game rooms subscription with channel:', channelName);

    // Set up real-time subscription
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'game_rooms' },
        async (payload) => {
          console.log('Game rooms updated:', payload);
          
          // If it's a DELETE event, remove the room from the list
          if (payload.eventType === 'DELETE') {
            setRooms(prevRooms => prevRooms.filter(room => room.id !== payload.old.id));
            return;
          }

          // For INSERT and UPDATE events, fetch the latest rooms
          await fetchRooms();
        }
      )
      .subscribe((status) => {
        console.log('Game rooms subscription status:', status);
      });

    subscriptionRef.current = subscription;

    return () => {
      if (subscriptionRef.current) {
        console.log('Cleaning up game rooms subscription:', channelName);
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user?.id]);

  return {
    rooms,
    loading,
    createRoom,
    joinRoom,
    joinRoomByCode,
    leaveRoom,
    refetchRooms: fetchRooms,
  };
};
