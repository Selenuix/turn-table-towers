
import React, { createContext, useContext, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionContextType {
  setupSubscription: (channelName: string, config: SubscriptionConfig) => void;
  cleanupSubscription: (channelName?: string) => void;
}

interface SubscriptionConfig {
  table?: string;
  filter?: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  callback: (payload: any) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const subscriptionsRef = useRef<Map<string, any>>(new Map());

  const cleanupSubscription = useCallback((channelName?: string) => {
    if (channelName) {
      // Clean up specific subscription
      const channel = subscriptionsRef.current.get(channelName);
      if (channel) {
        console.log('Cleaning up subscription:', channelName);
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.error('Error removing channel:', error);
        }
        subscriptionsRef.current.delete(channelName);
      }
    } else {
      // Clean up all subscriptions
      console.log('Cleaning up all subscriptions');
      subscriptionsRef.current.forEach((channel, name) => {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.error('Error removing channel:', error);
        }
      });
      subscriptionsRef.current.clear();
    }
  }, []);

  const setupSubscription = useCallback((channelName: string, config: SubscriptionConfig) => {
    // Clean up existing subscription with same name first
    cleanupSubscription(channelName);

    console.log('Setting up subscription:', channelName);

    const channel = supabase.channel(channelName);

    if (config.table) {
      const subscriptionConfig: any = {
        event: config.event || '*',
        schema: 'public',
        table: config.table,
      };

      if (config.filter) {
        subscriptionConfig.filter = config.filter;
      }

      channel.on('postgres_changes', subscriptionConfig, config.callback);
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to:', channelName);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        console.error('Subscription error for:', channelName, status);
      }
    });

    subscriptionsRef.current.set(channelName, channel);
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
