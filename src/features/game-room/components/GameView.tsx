
import { useEffect, useState } from 'react';
import { GameRoom, Player } from '../types';
import { GameActions } from './GameActions';
import { useGameState } from '@/hooks/useGameState';

interface GameViewProps {
  room: GameRoom;
  players: Player[];
  currentUserId: string;
}

export const GameView = ({ room, players, currentUserId }: GameViewProps) => {
  const { gameState, isPlayerTurn, performGameAction } = useGameState(room.id, currentUserId);

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.username || player?.email?.split('@')[0] || 'Unknown Player';
  };

  if (!gameState) {
    return <div className="text-white">Loading game state...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Players Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Object.entries(gameState.player_states || {}).map(([playerId, playerState]: [string, any]) => (
          <div key={playerId} className={`p-4 rounded-lg ${playerState?.eliminated ? 'bg-red-700' : 'bg-slate-700'}`}>
            <h3 className="text-lg font-semibold text-white">{getPlayerName(playerId)}</h3>
            <p className="text-slate-300">Health: {playerState?.hp || 0}</p>
            <p className="text-slate-300">Shield: {playerState?.shield ? 'Active' : 'None'}</p>
            <p className="text-slate-300">Cards: {playerState?.hand?.length || 0}</p>
            {playerState?.eliminated && <p className="text-red-400">Eliminated</p>}
          </div>
        ))}
      </div>

      {/* Current Player's Info */}
      {gameState.player_states?.[currentUserId] && (
        <div className="bg-slate-800 p-4 rounded-lg">
          <h4 className="text-xl font-semibold text-white">Your Status</h4>
          <p className="text-slate-300">Health: {gameState.player_states[currentUserId].hp || 0}</p>
          <p className="text-slate-300">Shield: {gameState.player_states[currentUserId].shield ? 'Active' : 'None'}</p>
          <p className="text-slate-300">Cards in Hand: {gameState.player_states[currentUserId].hand?.length || 0}</p>
        </div>
      )}

      {/* Game Actions */}
      {gameState && gameState.status === 'in_progress' && gameState.player_states?.[currentUserId] && !gameState.player_states[currentUserId].eliminated && (
        <GameActions
          isPlayerTurn={isPlayerTurn()}
          currentPlayerState={gameState.player_states[currentUserId]}
          players={players}
          playerStates={gameState.player_states}
          roomId={room.id}
          currentUserId={currentUserId}
          onAction={async (action: string, data?: any) => {
            try {
              await performGameAction(action, data);
              return { success: true, error: null as any };
            } catch (error) {
              return { success: false, error: error as Error };
            }
          }}
        />
      )}

      {/* Game Over Condition */}
      {gameState.status === 'finished' && (
        <div className="text-center text-2xl text-green-500 font-bold">
          Game Over! Winner will be announced soon.
        </div>
      )}
    </div>
  );
};
