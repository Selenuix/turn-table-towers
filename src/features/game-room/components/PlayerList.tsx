import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { GameRoom, Player } from '../types';

interface PlayerListProps {
  room: GameRoom;
  players: Player[];
  currentUserId: string;
  isGameInProgress: boolean;
}

export const PlayerList = ({ room, players, currentUserId, isGameInProgress }: PlayerListProps) => {
  const sortedPlayers = [...players].sort((a, b) => {
    // Room owner always comes first
    if (a.id === room.owner_id) return -1;
    if (b.id === room.owner_id) return 1;
    // Then sort by username/email
    const aName = a.username || a.email || '';
    const bName = b.username || b.email || '';
    return aName.localeCompare(bName);
  });

  return (
    <Card className="bg-slate-800/50 border-slate-700 sticky top-6">
      <CardHeader>
        <CardTitle className="text-white">Players ({players.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedPlayers.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/20"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  {player.username?.[0]?.toUpperCase() || player.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="flex items-center">
                    <span className="text-white font-medium mr-2">
                      {player.username || player.email?.split('@')[0] || 'Anonymous'}
                    </span>
                    {player.id === room.owner_id && (
                      <Crown className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                  <div className="text-sm text-slate-400">
                    {player.id === room.owner_id ? 'Room Owner' : 'Player'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {player.id === currentUserId && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    You
                  </Badge>
                )}
                {isGameInProgress && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    In Game
                  </Badge>
                )}
              </div>
            </div>
          ))}
          
          {/* Empty slots */}
          {Array.from({ length: room.max_players - players.length }, (_, index) => (
            <div
              key={`empty-${index}`}
              className="flex items-center p-4 bg-slate-700/10 rounded-lg border-2 border-dashed border-slate-600"
            >
              <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-slate-400 mr-3">
                ?
              </div>
              <div>
                <div className="text-slate-400">Waiting for player...</div>
                <div className="text-xs text-slate-500">Share the room code to invite friends</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 