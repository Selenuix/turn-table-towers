
import { RoomInfo } from './RoomInfo';
import { RoomActions } from './RoomActions';
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
    <div className="mt-8">
      {isGameInProgress ? (
        <GameView 
          room={room}
          players={players}
          currentUserId={currentUserId}
        />
      ) : (
        <div className="space-y-6">
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
      )}
    </div>
  );
};
