import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Settings, Shuffle } from 'lucide-react';
import { GameRoom, Player } from '../types';

interface RoomInfoProps {
  room: GameRoom;
  players: Player[];
  isGameInProgress: boolean;
  onCopyInviteLink: () => void;
}

export const RoomInfo = ({ room, players, isGameInProgress, onCopyInviteLink }: RoomInfoProps) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Room Information
          </CardTitle>
          <Badge 
            className={
              room.status === 'waiting' 
                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
            }
          >
            {room.status === 'waiting' ? 'Waiting for Players' : 'Game in Progress'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Room Code:</span>
              <span className="font-mono font-bold text-blue-400">{room.room_code}</span>
            </div>
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{new Date(room.created_at).toLocaleString()}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Owner:</span>
              <span className="text-yellow-400">
                {players.find(p => p.id === room.owner_id)?.username || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Max Players:</span>
              <span>{room.max_players}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2 mt-6">
          <Button
            onClick={onCopyInviteLink}
            variant="outline"
            className="border-purple-500 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 font-semibold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Invite Link
          </Button>
          {isGameInProgress && (
            <Button
              variant="outline"
              className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              View Game
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 