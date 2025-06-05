
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, MessageSquare, ScrollText } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { GameLogEntry } from './GameLogEntry';
import { EmojiPicker } from './EmojiPicker';
import { Player } from '@/features/game-room/types';

interface ChatPanelProps {
  roomId: string;
  currentUserId: string;
  players: Player[];
}

export const ChatPanel = ({ roomId, currentUserId, players }: ChatPanelProps) => {
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const { messages, gameLogs, loading, sendMessage } = useChat(roomId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Create players lookup for easy access
  const playersLookup = players.reduce((acc, player) => {
    acc[player.id] = player;
    return acc;
  }, {} as Record<string, Player>);

  const scrollToBottom = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom(messagesEndRef);
    } else {
      scrollToBottom(logsEndRef);
    }
  }, [messages, gameLogs, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendMessage(message);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 h-96">
        <div className="flex items-center justify-center h-full text-slate-400">
          Loading chat...
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 h-96 flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat
            {messages.length > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                {messages.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <ScrollText className="w-4 h-4" />
            Game Log
            {gameLogs.length > 0 && (
              <span className="bg-green-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                {gameLogs.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  user={playersLookup[msg.player_id]}
                  isCurrentUser={msg.player_id === currentUserId}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-700">
            <div className="flex gap-2">
              <div className="flex-1 flex">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  maxLength={500}
                />
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={!message.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="logs" className="flex-1 flex flex-col mt-0">
          <div className="flex-1 overflow-y-auto p-3">
            {gameLogs.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                No game events yet.
              </div>
            ) : (
              <div className="space-y-1">
                {gameLogs.map((log) => (
                  <GameLogEntry
                    key={log.id}
                    log={log}
                    players={playersLookup}
                  />
                ))}
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
