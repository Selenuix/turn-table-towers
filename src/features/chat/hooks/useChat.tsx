
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, GameLog } from '../types';
import { useAuthContext } from '@/hooks/useAuthContext';

export const useChat = (roomId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [gameLogs, setGameLogs] = useState<GameLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();
  const channelRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);

  const fetchInitialData = useCallback(async () => {
    if (!roomId) return;

    try {
      // Fetch initial messages and logs in parallel
      const [messagesResult, logsResult] = await Promise.all([
        supabase
          .from('chat_messages')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true }),
        supabase
          .from('game_logs')
          .select('*')
          .eq('room_id', roomId)
          .order('created_at', { ascending: true })
      ]);

      if (messagesResult.error) throw messagesResult.error;
      if (logsResult.error) throw logsResult.error;

      if (isMountedRef.current) {
        setMessages(messagesResult.data || []);
        setGameLogs(logsResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching initial chat data:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [roomId]);

  const setupRealtimeSubscription = useCallback(() => {
    if (!roomId || !user) return;

    // Clean up existing subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channelName = `chat_room_${roomId}_${user.id}_${Date.now()}`;
    console.log('Setting up chat real-time subscription:', channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('New chat message received:', payload);
          if (isMountedRef.current) {
            setMessages(prev => [...prev, payload.new as ChatMessage]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_logs',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('New game log received:', payload);
          if (isMountedRef.current) {
            setGameLogs(prev => [...prev, payload.new as GameLog]);
          }
        }
      )
      .subscribe((status) => {
        console.log('Chat subscription status:', status);
      });

    channelRef.current = channel;
  }, [roomId, user?.id]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!roomId || !user) {
      setLoading(false);
      return;
    }

    // Fetch initial data
    fetchInitialData();

    // Set up real-time subscription
    setupRealtimeSubscription();

    return () => {
      isMountedRef.current = false;
      if (channelRef.current) {
        console.log('Cleaning up chat subscription');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, user?.id, fetchInitialData, setupRealtimeSubscription]);

  const sendMessage = async (message: string) => {
    if (!user || !roomId || !message.trim()) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          player_id: user.id,
          message: message.trim(),
          message_type: 'user' as const
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const logGameAction = async (actionType: string, actionData?: any) => {
    if (!user || !roomId) return;

    try {
      await supabase.rpc('log_game_action', {
        p_room_id: roomId,
        p_player_id: user.id,
        p_action_type: actionType,
        p_action_data: actionData
      });
    } catch (error) {
      console.error('Error logging game action:', error);
    }
  };

  return {
    messages,
    gameLogs,
    loading,
    sendMessage,
    logGameAction
  };
};
