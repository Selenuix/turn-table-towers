import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GameRoom, Player } from '../types';
import { Play, LogOut } from 'lucide-react';

interface RoomActionsProps {
  room: GameRoom;
  currentUserId: string;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const RoomActions = ({ 
  room, 
  currentUserId, 
  onStartGame, 
  onLeaveRoom 
}: RoomActionsProps) => {
  const isOwner = room.owner_id === currentUserId;
  const canStartGame = isOwner && room.status === 'waiting' && room.player_ids.length >= 2;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isOwner && (
          <Button
            onClick={onStartGame}
            disabled={!canStartGame}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Game
          </Button>
        )}
        <Button
          onClick={onLeaveRoom}
          variant="destructive"
          className="w-full font-semibold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Leave Room
        </Button>
      </CardContent>
    </Card>
  );
}; 