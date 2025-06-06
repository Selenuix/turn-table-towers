
import { useEffect, useState } from 'react';
import { GameRoom, Player } from '../types';
import { GameActions } from './GameActions';
import { CardSelectionPhase } from './CardSelectionPhase';
import { PlayerBoard } from './PlayerBoard';
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

  // Check if all players have completed setup
  const allPlayersSetup = gameState && gameState.player_states && 
    Object.values(gameState.player_states).every((state: any) => state.setup_complete);

  // Get current player for display
  const currentPlayer = players.find(p => p.id === gameState?.current_player_id);

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
      {/* Game Status */}
      {!allPlayersSetup && (
        <div className="text-center p-4 bg-amber-900/30 border border-amber-700/50 rounded-lg">
          <p className="text-amber-300 font-medium">
            Waiting for all players to complete their setup...
          </p>
        </div>
      )}

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(gameState.player_states || {}).map(([playerId, playerState]: [string, any]) => {
          const player = players.find(p => p.id === playerId);
          if (!player) return null;

          return (
            <PlayerBoard
              key={playerId}
              player={player}
              playerState={playerState}
              isCurrentPlayer={gameState.current_player_id === playerId}
              isCurrentUser={playerId === currentUserId}
              allPlayersSetup={!!allPlayersSetup}
              currentPlayer={currentPlayer}
            />
          );
        })}
      </div>

      {/* Game Actions */}
      {gameState && gameState.status === 'in_progress' && allPlayersSetup && gameState.player_states?.[currentUserId] && !gameState.player_states[currentUserId].eliminated && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
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
        </div>
      )}

      {/* Game Over Condition */}
      {gameState.status === 'finished' && (
        <div className="text-center p-6 bg-green-900/30 border border-green-700/50 rounded-lg">
          <h2 className="text-2xl font-bold text-green-300 mb-2">Game Over!</h2>
          <p className="text-green-400">Winner will be announced soon.</p>
        </div>
      )}
    </div>
  );
};
