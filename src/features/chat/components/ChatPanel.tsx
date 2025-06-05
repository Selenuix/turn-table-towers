
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, MessageSquare } from 'lucide-react';
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
  const { messages, gameLogs, loading, sendMessage } = useChat(roomId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create players lookup for easy access
  const playersLookup = players.reduce((acc, player) => {
    acc[player.id] = player;
    return acc;
  }, {} as Record<string, Player>);

  // Combine messages and logs, sorted by timestamp
  const combinedEntries = [
    ...messages.map(msg => ({ ...msg, type: 'message' as const })),
    ...gameLogs.map(log => ({ ...log, type: 'log' as const }))
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [combinedEntries]);

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
      <div className="p-3 border-b border-slate-700 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-slate-400" />
        <span className="text-white font-medium">Chat & Game Log</span>
        <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
          {combinedEntries.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {combinedEntries.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          combinedEntries.map((entry) => (
            entry.type === 'message' ? (
              <ChatMessage
                key={`msg-${entry.id}`}
                message={entry}
                user={playersLookup[entry.player_id]}
                isCurrentUser={entry.player_id === currentUserId}
              />
            ) : (
              <div key={`log-${entry.id}`} className="opacity-70">
                <GameLogEntry
                  log={entry}
                  players={playersLookup}
                />
              </div>
            )
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
    </Card>
  );
};
