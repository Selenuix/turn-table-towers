import { createContext } from 'react';

interface SubscriptionContextType {
  setupSubscription: (channelName: string, callback: (payload: any) => void) => void;
  cleanupSubscription: () => void;
}

export const SubscriptionContext = createContext<SubscriptionContextType | null>(null); 