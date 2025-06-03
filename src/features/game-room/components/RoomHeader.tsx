import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GameRoom } from '../types';

interface RoomHeaderProps {
  room: GameRoom;
  onCopyRoomCode: () => void;
}

export const RoomHeader = ({ room, onCopyRoomCode }: RoomHeaderProps) => {
  const navigate = useNavigate();
  const isGameInProgress = room.status === 'in_progress';

  return (
    <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-slate-300 hover:text-white hover:bg-slate-700/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lobby
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {room.name || `Room ${room.room_code}`}
            </h1>
            <p className="text-sm text-slate-400">
              {isGameInProgress ? 'Game in Progress' : 'Waiting for Players'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-slate-700 text-slate-300 font-mono">
              {room.room_code}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopyRoomCode}
              className="text-slate-300 hover:text-white"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}; 