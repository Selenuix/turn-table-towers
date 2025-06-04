import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Trophy, Users } from "lucide-react";
import { GameRoom } from "@/features/game-room/types";
import {RoomStatusEnum} from "@/consts";

interface RoomGridProps {
  rooms: GameRoom[];
  currentUserId: string;
  onRoomAction: (roomId: string, isInRoom: boolean) => void;
}

export const RoomGrid = ({ rooms, currentUserId, onRoomAction }: RoomGridProps) => {
  // Filter out finished games
  const activeRooms = rooms.filter(room => room.status !== RoomStatusEnum.FINISHED);

  const getStatusColor = (status: string) => {
    switch (status) {
      case RoomStatusEnum.WAITING:
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case RoomStatusEnum.IN_PROGRESS:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {activeRooms.map((room) => {
        const isPlayerInRoom = room.player_ids.includes(currentUserId);

        return (
          <Card key={room.id}
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-white truncate">
                  {room.name || `Game ${room.room_code}`}
                </CardTitle>
                <Badge className={`${getStatusColor(room.status)} border`}>
                  {room.status === RoomStatusEnum.WAITING ? "Open" : "Playing"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-slate-300">
                  <Users className="w-4 h-4 mr-2"/>
                  <span className="text-sm">
                    {room.player_ids.length}/{room.max_players} players
                  </span>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                  {room.room_code}
                </Badge>
              </div>

              <div className="flex items-center text-slate-300">
                <Trophy className="w-4 h-4 mr-2"/>
                <span className="text-sm">Standard Game</span>
              </div>

              <div className="flex items-center text-slate-300">
                <Clock className="w-4 h-4 mr-2"/>
                <span className="text-sm">Created {new Date(room.created_at).toLocaleDateString()}</span>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium"
                  disabled={room.status === RoomStatusEnum.IN_PROGRESS || room.player_ids.length >= room.max_players}
                  onClick={() => onRoomAction(room.id, isPlayerInRoom)}
                >
                  {room.status === RoomStatusEnum.IN_PROGRESS
                    ? "Game in Progress"
                    : room.player_ids.length >= room.max_players
                      ? "Room Full"
                      : isPlayerInRoom
                        ? "Enter Room"
                        : "Join Game"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
