
import { ChatMessage as ChatMessageType, ChatUser } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageProps {
  message: ChatMessageType;
  user?: ChatUser;
  isCurrentUser: boolean;
}

export const ChatMessage = ({ message, user, isCurrentUser }: ChatMessageProps) => {
  const displayName = user?.username || user?.email?.split('@')[0] || 'Unknown Player';
  const timeAgo = formatDistanceToNow(new Date(message.created_at), { addSuffix: true });

  if (message.message_type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-slate-700/50 px-3 py-1 rounded-full text-xs text-slate-300">
          {message.message}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-xs ${isCurrentUser ? 'order-2' : 'order-1'}`}>
        <div className={`px-3 py-2 rounded-lg ${
          isCurrentUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-slate-700 text-white'
        }`}>
          <div className="text-sm break-words">{message.message}</div>
        </div>
        <div className={`text-xs text-slate-400 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
          {displayName} • {timeAgo}
        </div>
      </div>
    </div>
  );
};
