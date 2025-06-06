import { Card, CardContent } from "@/components/ui/card";
import { GameRoom } from "@/features/game-room/types";
import {RoomStatusEnum} from "@/consts";

interface LobbyStatsProps {
  rooms: GameRoom[];
}

export const LobbyStats = ({ rooms }: LobbyStatsProps) => {
  // Filter out finished and in-progress games
  const activeRooms: GameRoom[] = rooms.filter(room => 
    room.status === RoomStatusEnum.WAITING
  );
  const totalPlayers: number = activeRooms.reduce((acc, room) => acc + room.player_ids.length, 0);
  const openGames: number = activeRooms.length;  // All active rooms are open games now

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-400 mb-2">
            {activeRooms.length}
          </div>
          <div className="text-slate-300">Available Rooms</div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-green-400 mb-2">
            {totalPlayers}
          </div>
          <div className="text-slate-300">Players in Lobby</div>
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
