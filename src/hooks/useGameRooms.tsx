import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { GameRoom, Player } from '@/features/game-room/types';
import { useLocation } from 'react-router-dom';
import {RoomStatusEnum} from "@/consts";

export const useGameRooms = () => {
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const subscriptionRef = useRef<any>(null);
  const location = useLocation();

  const getRoom = async (roomId: string): Promise<GameRoom | null> => {
    console.log('getRoom called with ID:', roomId);
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) {
        console.error('Error fetching room:', error);
        throw error;
      }

      console.log('Room data from database:', data);
      return data;
    } catch (error) {
      console.error('Error in getRoom:', error);
      return null;
    }
  };

  const getPlayers = async (playerIds: string[]): Promise<Player[]> => {
    console.log('getPlayers called with IDs:', playerIds);
    if (!playerIds.length) {
      console.log('No player IDs provided');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', playerIds);

      if (error) {
        console.error('Error fetching players:', error);
        throw error;
      }

      console.log('Players data from database:', data);
      return data || [];
    } catch (error) {
      console.error('Error in getPlayers:', error);
      return [];
    }
  };

  const startGame = async (roomId: string) => {
    try {
      const { error } = await supabase
        .from('game_rooms')
        .update({
          status: RoomStatusEnum.IN_PROGRESS,
          updated_at: new Date().toISOString()
        })
        .eq('id', roomId);

      if (error) throw error;
    } catch (error) {
      console.error('Error starting game:', error);
      throw error;
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .neq('status', RoomStatusEnum.FINISHED)
        .eq('status', RoomStatusEnum.WAITING)
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

      if (roomData.status !==  RoomStatusEnum.WAITING) {
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

    // Only fetch rooms and set up subscription when on the home page
    const isHomePage = location.pathname === '/';
    if (!isHomePage) {
      setLoading(false);
      return;
    }

    // Clean up any existing subscription first
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    fetchRooms();

    // Create a unique channel name with user ID and timestamp
    const channelName = `game_rooms_${user.id}_${Date.now()}`;

    // Set up real-time subscription
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'game_rooms' },
        async (payload) => {
          // If it's a DELETE event, remove the room from the list
          if (payload.eventType === 'DELETE') {
            setRooms(prevRooms => prevRooms.filter(room => room.id !== payload.old.id));
            return;
          }

          // For INSERT and UPDATE events, fetch the latest rooms
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
  }, [user?.id, location.pathname]);

  return {
    rooms,
    loading,
    createRoom,
    joinRoom,
    joinRoomByCode,
    leaveRoom,
    refetchRooms: fetchRooms,
    getRoom,
    getPlayers,
    startGame,
    currentUser: user,
  };
};
