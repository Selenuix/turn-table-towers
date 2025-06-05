
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, GameLog } from '../types';
import { useAuthContext } from '@/hooks/useAuthContext';

export const useChat = (roomId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [gameLogs, setGameLogs] = useState<GameLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();
  const subscriptionRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);

  const fetchMessages = useCallback(async () => {
    if (!roomId) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (isMountedRef.current) {
        // Type assertion to ensure compatibility
        setMessages((data as ChatMessage[]) || []);
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  }, [roomId]);

  const fetchGameLogs = useCallback(async () => {
    if (!roomId) return;

    try {
      const { data, error } = await supabase
        .from('game_logs')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (isMountedRef.current) {
        setGameLogs((data as GameLog[]) || []);
      }
    } catch (error) {
      console.error('Error fetching game logs:', error);
    }
  }, [roomId]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!roomId || !user) {
      setLoading(false);
      return;
    }

    // Fetch initial data
    Promise.all([fetchMessages(), fetchGameLogs()]).finally(() => {
      if (isMountedRef.current) {
        setLoading(false);
      }
    });

    // Set up real-time subscription
    const channelName = `chat_${roomId}_${user.id}_${Date.now()}`;
    
    const channel = supabase.channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        if (isMountedRef.current) {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'game_logs',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        if (isMountedRef.current) {
          setGameLogs(prev => [...prev, payload.new as GameLog]);
        }
      })
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      isMountedRef.current = false;
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [roomId, user?.id, fetchMessages, fetchGameLogs]);

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
