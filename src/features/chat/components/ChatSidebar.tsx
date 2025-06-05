
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageSquare, Crown } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { GameLogEntry } from './GameLogEntry';
import { EmojiPicker } from './EmojiPicker';
import { Player, GameRoom } from '@/features/game-room/types';
import { Badge } from '@/components/ui/badge';

interface ChatSidebarProps {
  roomId: string;
  currentUserId: string;
  players: Player[];
  room: GameRoom;
}

export const ChatSidebar = ({ roomId, currentUserId, players, room }: ChatSidebarProps) => {
  const [message, setMessage] = useState('');
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
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

  // Calculate unread message count (only chat messages, not logs)
  const unreadMessageCount = messages.filter(msg => 
    !lastReadMessageId || new Date(msg.created_at) > new Date(lastReadMessageId)
  ).length;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    // Mark messages as read when they're visible
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      setLastReadMessageId(latestMessage.id);
    }
  }, [combinedEntries, messages]);

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

  const sortedPlayers = [...players].sort((a, b) => {
    // Room owner always comes first
    if (a.id === room.owner_id) return -1;
    if (b.id === room.owner_id) return 1;
    // Then sort by username/email
    const aName = a.username || a.email || '';
    const bName = b.username || b.email || '';
    return aName.localeCompare(bName);
  });

  if (loading) {
    return (
      <div className="w-80 bg-slate-800/50 border-l border-slate-700 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-slate-800/50 border-l border-slate-700 flex flex-col h-screen">
      {/* Players Section - Sticky */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/50 sticky top-0 z-10">
        <h3 className="text-white font-medium mb-3">Players ({players.length})</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {sortedPlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-2 bg-slate-700/30 rounded text-sm"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                  {player.username?.[0]?.toUpperCase() || player.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-white text-sm">
                  {player.username || player.email?.split('@')[0] || 'Anonymous'}
                </span>
                {player.id === room.owner_id && (
                  <Crown className="w-3 h-3 text-yellow-400 ml-1" />
                )}
              </div>
              {player.id === currentUserId && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs py-0 px-1">
                  You
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Header */}
      <div className="p-3 border-b border-slate-700 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-slate-400" />
        <span className="text-white font-medium">Chat</span>
        {unreadMessageCount > 0 && (
          <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
            {unreadMessageCount}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {combinedEntries.length === 0 ? (
          <div className="text-center text-slate-400 py-8 text-sm">
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
              <div key={`log-${entry.id}`} className="opacity-60">
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

      {/* Message Input */}
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
    </div>
  );
};
