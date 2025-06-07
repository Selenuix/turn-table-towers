
import {useEffect, useRef, useState} from 'react';
import {useSubscription} from '@/providers/SubscriptionProvider';
import {Player} from '@/features/game-room/types';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {ScrollArea} from '@/components/ui/scroll-area';
import {useToast} from '@/hooks/use-toast';
import {supabase} from '@/integrations/supabase/client';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Send, X} from 'lucide-react';
import {cn} from '@/lib/utils';
import {EmojiPicker} from "@/features/chat/components/EmojiPicker.tsx";
import {useAuthContext} from '@/hooks/useAuthContext';
import {ChatToggle} from './ChatToggle';
import {GeneratedAvatar} from "@/components/ui/avatar";

interface ChatSidebarProps {
  roomId: string;
  className?: string;
}

interface ChatMessage {
  id: string;
  room_id: string;
  player_id: string;
  message: string;
  message_type: 'user' | 'system';
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

export function ChatSidebar({roomId, className}: ChatSidebarProps) {
  const {user} = useAuthContext();
  const {toast} = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = user;

  const loadMessages = async () => {
    try {
      const {data, error} = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles:player_id (
            username,
            avatar_url
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', {ascending: true});

      if (error) throw error;
      setMessages((data || []).map(msg => ({
        ...msg,
        message_type: msg.message_type as 'user' | 'system'
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadMessages();
  }, [roomId]);

  useEffect(() => {
    const subscription = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMessage]);
          messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    try {
      const {error} = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          player_id: currentUser.id,
          message: newMessage.trim(),
          message_type: 'user' as const
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPlayerName = (playerId: string) => {
    const message = messages.find(m => m.player_id === playerId);
    return message?.profiles?.username || 'Anonymous';
  };

  return (
    <div className="relative">
      <ChatToggle isOpen={isOpen} onToggle={() => setIsOpen(true)} />
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-80 transform bg-slate-800 border-l border-slate-700/50 transition-transform duration-300 ease-in-out z-50",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white">Chat</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-slate-400 hover:text-slate-300"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col space-y-1",
                  message.player_id === currentUser?.id ? "items-end" : "items-start"
                )}
              >
                <div className="text-xs text-slate-400">
                  {message.message_type === 'system' ? 'System' : getPlayerName(message.player_id)}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                    message.message_type === 'system'
                      ? "bg-slate-700/50 text-slate-300"
                      : message.player_id === currentUser?.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-white"
                  )}
                >
                  {message.message}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-700/50">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full min-h-[40px] p-2 rounded-md bg-slate-700 border border-slate-600 text-white placeholder:text-slate-400"
                />
                <div className="absolute right-2 bottom-2">
                  <EmojiPicker onEmojiSelect={(emoji) => setNewMessage(prev => prev + emoji)} />
                </div>
              </div>
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 bg-blue-600 hover:bg-blue-700"
                disabled={!newMessage.trim()}
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
