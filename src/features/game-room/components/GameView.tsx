
import { useEffect, useState } from 'react';
import { GameRoom, Player } from '../types';
import { GameActions } from './GameActions';
import { CardSelectionPhase } from './CardSelectionPhase';
import { useGameState } from '@/hooks/useGameState';
import { useToast } from '@/components/ui/use-toast';

interface GameViewProps {
  room: GameRoom;
  players: Player[];
  currentUserId: string;
}

export const GameView = ({ room, players, currentUserId }: GameViewProps) => {
  const { gameState, isPlayerTurn, performGameAction, setupPlayerCards, getPlayerHand } = useGameState(room.id, currentUserId);
  const { toast } = useToast();
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.username || player?.email?.split('@')[0] || 'Unknown Player';
  };

  const handleSetupComplete = async (shieldIndex: number, hpIndices: number[]) => {
    try {
      const result = await setupPlayerCards(shieldIndex, hpIndices);
      if (result.error) {
        toast({
          title: 'Setup Error',
          description: 'Failed to setup player cards',
          variant: 'destructive'
        });
      } else {
        setIsSetupComplete(true);
        toast({
          title: 'Setup Complete',
          description: 'Your cards have been configured successfully'
        });
      }
    } catch (error) {
      toast({
        title: 'Setup Error',
        description: 'Failed to setup player cards',
        variant: 'destructive'
      });
    }
  };

  // Check if current player needs to setup their cards
  const needsSetup = gameState && 
    gameState.player_states?.[currentUserId] && 
    !gameState.player_states[currentUserId].shield &&
    gameState.player_states[currentUserId].hp === 0;

  const playerHand = getPlayerHand();

  if (!gameState) {
    return <div className="text-white">Loading game state...</div>;
  }

  // Show setup phase if player needs to configure their cards
  if (needsSetup && playerHand.length > 0 && !isSetupComplete) {
    return (
      <div className="space-y-6">
        <CardSelectionPhase
          playerHand={playerHand}
          onSetupComplete={handleSetupComplete}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Players Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Object.entries(gameState.player_states || {}).map(([playerId, playerState]: [string, any]) => (
          <div key={playerId} className={`p-4 rounded-lg ${playerState?.eliminated ? 'bg-red-700' : 'bg-slate-700'}`}>
            <h3 className="text-lg font-semibold text-white">{getPlayerName(playerId)}</h3>
            <p className="text-slate-300">Health: {playerState?.hp || 0}</p>
            <p className="text-slate-300">Shield: {playerState?.shield ? `${playerState.shield.rank} of ${playerState.shield.suit}` : 'None'}</p>
            <p className="text-slate-300">Stored Cards: {playerState?.stored_cards?.length || 0}</p>
            {playerState?.eliminated && <p className="text-red-400">Eliminated</p>}
          </div>
        ))}
      </div>

      {/* Current Player's Info */}
      {gameState.player_states?.[currentUserId] && (
        <div className="bg-slate-800 p-4 rounded-lg">
          <h4 className="text-xl font-semibold text-white">Your Status</h4>
          <p className="text-slate-300">Health: {gameState.player_states[currentUserId].hp || 0}</p>
          <p className="text-slate-300">
            Shield: {gameState.player_states[currentUserId].shield 
              ? `${gameState.player_states[currentUserId].shield.rank} of ${gameState.player_states[currentUserId].shield.suit}` 
              : 'None'}
          </p>
          <p className="text-slate-300">Stored Cards: {gameState.player_states[currentUserId].stored_cards?.length || 0}</p>
          {gameState.player_states[currentUserId].stored_cards?.length > 0 && (
            <div className="mt-2">
              <p className="text-slate-400 text-sm">Your stored cards:</p>
              <div className="flex gap-1 mt-1">
                {gameState.player_states[currentUserId].stored_cards.map((card: any, index: number) => (
                  <span key={index} className="text-xs bg-slate-600 px-2 py-1 rounded">
                    {card.rank} of {card.suit}
                  </span>
                ))}
              </div>
            </div>
          )}
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
