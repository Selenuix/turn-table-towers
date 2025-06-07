
import { useEffect, useState } from 'react';
import { GameRoom, Player } from '../types';
import { GameActions } from './GameActions';
import { CardSelectionPhase } from './CardSelectionPhase';
import { PlayerBoard } from './PlayerBoard';
import { GameOver } from './GameOver';
import { useGameStateManager } from '@/hooks/useGameStateManager';
import { useToast } from '@/components/ui/use-toast';

interface GameViewProps {
  room: GameRoom;
  players: Player[];
  currentUserId: string;
}

export const GameView = ({ room, players, currentUserId }: GameViewProps) => {
  const { gameState, loading, error } = useGameStateManager(room.id, currentUserId);
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

  // Check if current player needs to setup their cards
  const needsSetup = gameState && 
    gameState.player_states?.[currentUserId] && 
    !gameState.player_states[currentUserId].shield &&
    gameState.player_states[currentUserId].hp === 0;

  const playerHand = gameState?.player_states?.[currentUserId]?.hand || [];

  // Check if all players have completed setup
  const allPlayersSetup = gameState && gameState.player_states && 
    Object.values(gameState.player_states).every((state: any) => state.setup_complete);

  // Get current player for display
  const currentPlayer = players.find(p => p.id === gameState?.current_player_id);

  // Check if game is finished and get winner
  const gameFinished = gameState?.status === 'finished';

  if (gameFinished) {
    return (
      <GameOver
        players={players}
        currentUserId={currentUserId}
        roomId={room.id}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Setup Phase */}
      {needsSetup && (
        <CardSelectionPhase
          playerHand={playerHand}
          onSetupComplete={handleSetupComplete}
        />
      )}

      {/* Game Phase */}
      {!needsSetup && allPlayersSetup && (
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
          {gameState?.current_player_id === currentUserId && !gameFinished && (
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
    </div>
  );
};
