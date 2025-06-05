
import { RoomInfo } from './RoomInfo';
import { RoomActions } from './RoomActions';
import { PlayerList } from './PlayerList';
import { GameView } from './GameView';
import { GameRoom, Player } from '../types';

interface RoomContentProps {
  room: GameRoom;
  players: Player[];
  currentUserId: string;
  isGameInProgress: boolean;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onCopyInviteLink: () => void;
}

export const RoomContent = ({
  room,
  players,
  currentUserId,
  isGameInProgress,
  onStartGame,
  onLeaveRoom,
  onCopyInviteLink
}: RoomContentProps) => {
  return (
    <div className="mt-8 grid lg:grid-cols-3 gap-6">
      {isGameInProgress ? (
        <>
          <div className="lg:col-span-2 space-y-6">
            <GameView 
              room={room}
              players={players}
              currentUserId={currentUserId}
            />
          </div>
          
          <div className="lg:col-span-1">
            <PlayerList 
              room={room}
              players={players}
              currentUserId={currentUserId}
              isGameInProgress={isGameInProgress}
            />
          </div>
        </>
      ) : (
        <>
          <div className="lg:col-span-2 space-y-6">
            <RoomInfo 
              room={room}
              players={players}
              isGameInProgress={isGameInProgress}
              onCopyInviteLink={onCopyInviteLink}
            />
            <RoomActions 
              room={room}
              currentUserId={currentUserId}
              onStartGame={onStartGame}
              onLeaveRoom={onLeaveRoom}
            />
          </div>
          
          <div className="lg:col-span-1">
            <PlayerList 
              room={room}
              players={players}
              currentUserId={currentUserId}
              isGameInProgress={isGameInProgress}
            />
          </div>
        </>
      )}
    </div>
  );
};
