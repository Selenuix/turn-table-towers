import { Card, CardContent } from "@/components/ui/card";
import { GameRoom } from "@/features/game-room/types";

interface LobbyStatsProps {
  rooms: GameRoom[];
}

export const LobbyStats = ({ rooms }: LobbyStatsProps) => {
  // Filter out finished games
  const activeRooms = rooms.filter(room => room.status !== 'finished');
  const totalPlayers = activeRooms.reduce((acc, room) => acc + room.player_ids.length, 0);
  const openGames = activeRooms.filter(room => room.status === "waiting").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-400 mb-2">
            {activeRooms.length}
          </div>
          <div className="text-slate-300">Active Rooms</div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-green-400 mb-2">
            {totalPlayers}
          </div>
          <div className="text-slate-300">Players Online</div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-purple-400 mb-2">
            {openGames}
          </div>
          <div className="text-slate-300">Open Games</div>
        </CardContent>
      </Card>
    </div>
  );
};
