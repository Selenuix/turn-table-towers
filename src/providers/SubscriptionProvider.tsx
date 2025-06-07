
import React, { createContext, useContext, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionContextType {
  setupSubscription: (channelName: string, callback: (payload: any) => void) => void;
  cleanupSubscription: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const subscriptionRef = useRef<any>(null);
  const channelNameRef = useRef<string>('');

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
    }
  }, []);

  const setupSubscription = useCallback((channelName: string, callback: (payload: any) => void) => {
    // Clean up any existing subscription first
    cleanupSubscription();

    console.log('Setting up subscription:', channelName);
    channelNameRef.current = channelName;

    const channel = supabase.channel(channelName);

    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_rooms'
      }, callback)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to:', channelName);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.error('Subscription error for:', channelName, status);
        }
      });

    subscriptionRef.current = channel;
  }, [cleanupSubscription]);

  const value = {
    setupSubscription,
    cleanupSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
