import { useEffect, useState } from 'react';
import { GameRoom, Player, PlayerState } from '../types';
import { GameActions } from './GameActions';

interface GameViewProps {
  room: GameRoom;
  players: Player[];
  currentUserId: string;
  gameState: any; // Replace 'any' with your actual GameState type
  isPlayerTurn: boolean;
  onGameAction: (actionType: string, actionData?: any) => void;
}

export const GameView = ({ 
  room, 
  players, 
  currentUserId, 
  gameState, 
  isPlayerTurn, 
  onGameAction 
}: GameViewProps) => {
  const [currentPlayerState, setCurrentPlayerState] = useState<PlayerState | undefined>(undefined);

  useEffect(() => {
    if (gameState && currentUserId) {
      setCurrentPlayerState(gameState.player_states[currentUserId]);
    }
  }, [gameState, currentUserId]);

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.username || player?.email?.split('@')[0] || 'Unknown Player';
  };

  if (!gameState) {
    return <div className="text-white">Waiting for game to start...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Game Status */}
      <div className="text-white">
        Game Status: {gameState.status}
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Object.entries(gameState.player_states).map(([playerId, playerState]) => (
          <div key={playerId} className={`p-4 rounded-lg ${playerState.eliminated ? 'bg-red-700' : 'bg-slate-700'}`}>
            <h3 className="text-lg font-semibold text-white">{getPlayerName(playerId)}</h3>
            <p className="text-slate-300">Health: {playerState.health}</p>
            <p className="text-slate-300">Shield: {playerState.shield}</p>
            <p className="text-slate-300">Cards: {playerState.hand.length}</p>
            {playerState.eliminated && <p className="text-red-400">Eliminated</p>}
          </div>
        ))}
      </div>

      {/* Current Player's Info */}
      {currentPlayerState && (
        <div className="bg-slate-800 p-4 rounded-lg">
          <h4 className="text-xl font-semibold text-white">Your Status</h4>
          <p className="text-slate-300">Health: {currentPlayerState.health}</p>
          <p className="text-slate-300">Shield: {currentPlayerState.shield}</p>
          <p className="text-slate-300">Cards in Hand: {currentPlayerState.hand.length}</p>
        </div>
      )}

      {/* Game Actions */}
      {gameState && gameState.status === 'in_progress' && currentPlayerState && !currentPlayerState.eliminated && (
        <GameActions
          isPlayerTurn={isPlayerTurn}
          currentPlayerState={currentPlayerState}
          players={players}
          playerStates={gameState.player_states}
          roomId={room.id}
          currentUserId={currentUserId}
          onAction={onGameAction}
        />
      )}

      {/* Game Over Condition */}
      {gameState.status === 'finished' && (
        <div className="text-center text-2xl text-green-500 font-bold">
          Game Over! {getPlayerName(gameState.winner)} wins!
        </div>
      )}
    </div>
  );
};
