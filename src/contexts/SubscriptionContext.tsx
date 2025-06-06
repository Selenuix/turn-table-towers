import React, { useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionContext } from './subscription-context';

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const subscriptionRef = useRef<any>(null);
  const channelNameRef = useRef<string>('');
  const callbackRef = useRef<((payload: any) => void) | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_RECONNECT_ATTEMPTS = 3;
  const reconnectAttemptsRef = useRef(0);

  const cleanupSubscription = useCallback(() => {
    if (subscriptionRef.current) {
      console.log('Cleaning up subscription:', channelNameRef.current);
      try {
        supabase.removeChannel(subscriptionRef.current);
      } catch (error) {
        console.error('Error removing channel:', error);
      }
      subscriptionRef.current = null;
      channelNameRef.current = '';
      callbackRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
  }, []);

  const setupSubscription = useCallback((channelName: string, callback: (payload: any) => void) => {
    // Clean up any existing subscription first
    cleanupSubscription();

    console.log('Setting up subscription:', channelName);
    channelNameRef.current = channelName;
    callbackRef.current = callback;

    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'game_rooms' },
        callback
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        callback
      );

    try {
      subscription.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to channel:', channelName);
          subscriptionRef.current = subscription;
          reconnectAttemptsRef.current = 0;
        } else if (status === 'CLOSED') {
          console.log('Channel closed:', channelName);
          subscriptionRef.current = null;
          channelNameRef.current = '';
          callbackRef.current = null;

          // Attempt to reconnect if we haven't exceeded max attempts
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttemptsRef.current++;
            console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);

            // Exponential backoff for reconnection attempts
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 10000);
            reconnectTimeoutRef.current = setTimeout(() => {
              if (channelNameRef.current && callbackRef.current) {
                setupSubscription(channelNameRef.current, callbackRef.current);
              }
            }, delay);
          } else {
            console.log('Max reconnection attempts reached');
          }
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel error:', channelName);
          cleanupSubscription();
        }
      });
    } catch (error) {
      console.error('Error subscribing to channel:', error);
      cleanupSubscription();
    }
  }, [cleanupSubscription]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSubscription();
    };
  }, [cleanupSubscription]);

  return (
    <SubscriptionContext.Provider value={{ setupSubscription, cleanupSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
};
