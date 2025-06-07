
import { useEffect, useState } from 'react';
import { GameRoom, Player } from '../types';
import { GameActions } from './GameActions';
import { CardSelectionPhase } from './CardSelectionPhase';
import { PlayerBoard } from './PlayerBoard';
import { GameOver } from './GameOver';
import { useGameStateManager } from '@/hooks/useGameStateManager';
import { useGameState } from '@/hooks/useGameState';
import { useToast } from '@/components/ui/use-toast';

interface GameViewProps {
  room: GameRoom;
  players: Player[];
  currentUserId: string;
}

export const GameView = ({ room, players, currentUserId }: GameViewProps) => {
  const { gameState, loading, error } = useGameStateManager(room.id, currentUserId);
  const { setupPlayerCards } = useGameState(room.id, currentUserId);
  const { toast } = useToast();
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // Show error if game state failed to load
  useEffect(() => {
    if (error) {
      toast({
        title: 'Game Error',
        description: 'Failed to load game state. Please refresh the page.',
        variant: 'destructive'
      });
    }
  }, [error, toast]);

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

  // Show loading state
  if (loading || !gameState) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check if game is actually finished (room status is 'finished')
  const gameFinished = room.status === 'finished';

  // Only show GameOver if the game is actually finished
  if (gameFinished) {
    return (
      <GameOver
        players={players}
        currentUserId={currentUserId}
        roomId={room.id}
      />
    );
  }

  // Check if current player needs to setup their cards
  const currentPlayerState = gameState?.player_states?.[currentUserId];
  const needsSetup = currentPlayerState && 
    !currentPlayerState.shield &&
    currentPlayerState.hp === 0 &&
    !currentPlayerState.setup_complete;

  const playerHand = currentPlayerState?.hand || [];

  // Check if all players have completed setup
  const allPlayersSetup = gameState && gameState.player_states && 
    Object.values(gameState.player_states).every((state: any) => state.setup_complete);

  // Get current player for display
  const currentPlayer = players.find(p => p.id === gameState?.current_player_id);

  return (
    <div className="space-y-8">
      {/* Setup Phase - only show if player needs setup and game is not finished */}
      {needsSetup && !gameFinished && (
        <CardSelectionPhase
          playerHand={playerHand}
          onSetupComplete={handleSetupComplete}
        />
      )}

      {/* Game Phase - only show if setup is complete and game is not finished */}
      {!needsSetup && allPlayersSetup && !gameFinished && (
        <>
          {/* Player Boards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map(player => (
              <PlayerBoard
                key={player.id}
                player={player}
                playerState={gameState?.player_states[player.id]}
                isCurrentPlayer={gameState?.current_player_id === player.id}
                isCurrentUser={player.id === currentUserId}
                allPlayersSetup={allPlayersSetup}
                currentPlayer={currentPlayer}
              />
            ))}
          </div>

          {/* Game Actions */}
          {gameState?.current_player_id === currentUserId && (
            <GameActions
              isPlayerTurn={gameState?.current_player_id === currentUserId}
              currentPlayerState={gameState?.player_states[currentUserId]}
              players={players}
              playerStates={gameState?.player_states}
              roomId={room.id}
              currentUserId={currentUserId}
              onAction={async () => ({ success: true, error: null })} // Placeholder - will be handled by game state manager
            />
          )}
        </>
      )}

      {/* Waiting for setup phase */}
      {!allPlayersSetup && !needsSetup && !gameFinished && (
        <div className="text-center text-slate-400">
          <h3 className="text-xl font-semibold mb-2">Waiting for other players</h3>
          <p>All players need to complete their card setup before the game can begin.</p>
        </div>
      )}
    </div>
  );
};
