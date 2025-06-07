
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, GameLog } from '../types';
import { useAuthContext } from '@/hooks/useAuthContext';
import { useSubscription } from '@/providers/SubscriptionProvider';

export const useChat = (roomId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [gameLogs, setGameLogs] = useState<GameLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();
  const { setupSubscription, cleanupSubscription } = useSubscription();
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
        // Type cast the messages to ensure proper typing
        const typedMessages = (messagesResult.data || []).map(msg => ({
          ...msg,
          message_type: msg.message_type as 'user' | 'system'
        })) as ChatMessage[];
        
        setMessages(typedMessages);
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

  useEffect(() => {
    isMountedRef.current = true;

    if (!roomId || !user) {
      setLoading(false);
      return;
    }

    // Fetch initial data
    fetchInitialData();

    // Set up real-time subscription
    const chatChannelName = `chat_${roomId}`;
    const logsChannelName = `logs_${roomId}`;

    setupSubscription(chatChannelName, {
      table: 'chat_messages',
      filter: `room_id=eq.${roomId}`,
      event: 'INSERT',
      callback: (payload) => {
        console.log('New chat message received:', payload);
        if (isMountedRef.current) {
          const typedMessage = {
            ...payload.new,
            message_type: payload.new.message_type as 'user' | 'system'
          } as ChatMessage;
          setMessages(prev => {
            // Prevent duplicates by checking if message already exists
            const exists = prev.some(msg => msg.id === typedMessage.id);
            if (exists) return prev;
            return [...prev, typedMessage];
          });
        }
      }
    });

    setupSubscription(logsChannelName, {
      table: 'game_logs',
      filter: `room_id=eq.${roomId}`,
      event: 'INSERT',
      callback: (payload) => {
        console.log('New game log received:', payload);
        if (isMountedRef.current) {
          setGameLogs(prev => {
            // Prevent duplicates by checking if log already exists
            const exists = prev.some(log => log.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new as GameLog];
          });
        }
      }
    });

    return () => {
      isMountedRef.current = false;
      cleanupSubscription(chatChannelName);
      cleanupSubscription(logsChannelName);
    };
  }, [roomId, user?.id, fetchInitialData, setupSubscription, cleanupSubscription]);

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
