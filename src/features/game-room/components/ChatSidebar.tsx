
import {useEffect, useRef, useState} from 'react';
import {useSubscription} from '@/providers/SubscriptionProvider';
import {Player} from '@/features/game-room/types';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {ScrollArea} from '@/components/ui/scroll-area';
import {useToast} from '@/hooks/use-toast';
import {supabase} from '@/integrations/supabase/client';

interface ChatSidebarProps {
  roomId: string;
  currentUserId: string;
  players: Player[];
}

interface ChatMessage {
  id: string;
  room_id: string;
  player_id: string;
  message: string;
  message_type: 'user' | 'system';
  created_at: string;
}

export const ChatSidebar = ({roomId, currentUserId, players}: ChatSidebarProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const {toast} = useToast();
  const {setupSubscription, cleanupSubscription} = useSubscription();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    loadMessages();

    // Set up chat subscription
    const channelName = `chat_${roomId}_${currentUserId}_${Date.now()}`;
    setupSubscription(channelName, {
      table: 'chat_messages',
      filter: `room_id=eq.${roomId}`,
      event: 'INSERT',
      callback: (payload) => {
        if (!isMountedRef.current) return;

        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMsg]);
          scrollToBottom();
        }
      }
    });

    return () => {
      isMountedRef.current = false;
      cleanupSubscription(channelName);
    };
  }, [roomId, currentUserId, setupSubscription, cleanupSubscription]);

  const loadMessages = async () => {
    try {
      const {data, error} = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', {ascending: true});

      if (error) throw error;
      if (isMountedRef.current) {
        setMessages((data || []).map(msg => ({
          ...msg, message_type: msg.message_type as 'user' | 'system'
        })));
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error", description: "Failed to load chat messages", variant: "destructive",
      });
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const currentPlayer = players.find(p => p.id === currentUserId);
    if (!currentPlayer) return;

    try {
      const {error} = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId, player_id: currentUserId, message: newMessage.trim(), message_type: 'user'
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error", description: "Failed to send message", variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (<div className="w-80 bg-white rounded-lg shadow-lg p-4 flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">Chat</h2>
      <ScrollArea ref={scrollRef} className="flex-1 mb-4">
        <div className="space-y-2">
          {messages.map((message) => {
            const sender = players.find(p => p.id === message.player_id);
            return (<div
                key={message.id}
                className={`p-2 rounded-lg ${message.player_id === currentUserId ? 'bg-blue-100 ml-auto' : 'bg-gray-100'} max-w-[80%]`}
              >
                <div className="text-sm font-medium text-gray-700">
                  {sender?.username || 'Unknown'}
                </div>
                <div className="text-sm text-gray-900">{message.message}</div>
              </div>);
          })}
        </div>
      </ScrollArea>
      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={loading}
        />
        <Button onClick={handleSendMessage} disabled={loading || !newMessage.trim()}>
          Send
        </Button>
      </div>
    </div>);
};
