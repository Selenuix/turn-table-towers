import { useEffect, useState } from 'react';
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
        description: `Room code: ${data.room_code}`,
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
      // First get the current room data
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

      // Add user to room
      const updatedPlayerIds = [...roomData.player_ids, user.id];

      const { data, error } = await supabase
        .from('game_rooms')
        .update({ 
          player_ids: updatedPlayerIds,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId)
        .select()
        .single();

      if (error) throw error;

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
      const { data: roomData, error: fetchError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (fetchError) throw fetchError;

      const updatedPlayerIds = roomData.player_ids.filter(id => id !== user.id);

      // If room becomes empty, delete it
      if (updatedPlayerIds.length === 0) {
        const { error: deleteError } = await supabase
          .from('game_rooms')
          .delete()
          .eq('id', roomId);

        if (deleteError) throw deleteError;
      } else {
        // Update room with new player list
        const { error: updateError } = await supabase
          .from('game_rooms')
          .update({ 
            player_ids: updatedPlayerIds,
            updated_at: new Date().toISOString()
          })
          .eq('id', roomId);

        if (updateError) throw updateError;
      }

      await fetchRooms();
      return { error: null };
    } catch (error) {
      console.error('Error leaving room:', error);
      return { error };
    }
  };

  useEffect(() => {
    if (user) {
      fetchRooms();

      // Set up real-time subscription
      const subscription = supabase
        .channel('game_rooms_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'game_rooms' },
          () => {
            fetchRooms();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

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
