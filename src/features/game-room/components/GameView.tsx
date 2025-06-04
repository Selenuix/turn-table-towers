
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GameState, Player } from "@/features/game-room/types";
import { useGameState } from "@/hooks/useGameState";
import { SetupPhase } from './SetupPhase';
import { PlayerBoard } from './PlayerBoard';
import { GameActions } from './GameActions';

interface GameViewProps {
  roomId: string;
  userId: string;
  players: Player[];
}

export const GameView = ({ roomId, userId, players }: GameViewProps) => {
  const {
    gameState,
    loading,
    error,
    setupPlayerCards,
    isPlayerTurn,
    getPlayerHand,
    performGameAction
  } = useGameState(roomId, userId);

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8 text-center">
          <div className="text-white text-lg">Loading game...</div>
          <div className="text-slate-400 text-sm mt-2">
            Setting up game state...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-700">
        <CardContent className="p-8 text-center">
          <div className="text-red-400 text-lg">Error loading game</div>
          <div className="text-red-300 text-sm mt-2">{error.message}</div>
        </CardContent>
      </Card>
    );
  }

  if (!gameState) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8 text-center">
          <div className="text-white text-lg">Initializing game...</div>
          <div className="text-slate-400 text-sm mt-2">
            Please wait while the game is being set up.
          </div>
        </CardContent>
      </Card>
    );
  }

  const playerState = gameState.player_states[userId];

  if (!playerState) {
    return (
      <Card className="bg-yellow-900/20 border-yellow-700">
        <CardContent className="p-8 text-center">
          <div className="text-yellow-400 text-lg">Player not found in game</div>
          <div className="text-yellow-300 text-sm mt-2">
            There seems to be an issue with your player state.
          </div>
        </CardContent>
      </Card>
    );
  }

  const isSetupPhase = !playerState.setup_complete;

  const handleSetupComplete = async (shieldIndex: number, hpIndices: number[]) => {
    await setupPlayerCards(shieldIndex, hpIndices);
  };

  const handleGameAction = async (action: string, data?: any) => {
    await performGameAction(action, data);
  };

  if (isSetupPhase) {
    return (
      <div className="space-y-6">
        <SetupPhase
          playerState={playerState}
          onSetupComplete={handleSetupComplete}
        />
      </div>
    );
  }

  // Check if all players have completed setup
  const allPlayersSetup = players.every(player =>
    gameState.player_states[player.id]?.setup_complete
  );

  if (!allPlayersSetup) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Waiting for Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-slate-300">
            Waiting for all players to complete their card setup...
          </div>
          <div className="mt-4 space-y-2">
            {players.map(player => {
              const isComplete = gameState.player_states[player.id]?.setup_complete;
              return (
                <div key={player.id} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isComplete ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-white">
                    {player.username || player.email?.split('@')[0]}
                    {player.id === userId && ' (You)'}
                  </span>
                  <span className="text-slate-400">
                    {isComplete ? '✓ Ready' : 'Setting up...'}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Game Status */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Shield Card Game</h2>
              <div className="text-slate-300">
                Current Turn: {
                  players.find(p => p.id === gameState.current_player_id)?.username ||
                  players.find(p => p.id === gameState.current_player_id)?.email?.split('@')[0] ||
                  'Unknown Player'
                }
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-sm">Cards in Deck</div>
              <div className="text-white text-lg font-bold">{gameState.deck.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Player Boards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid gap-4">
            {players.map(player => {
              const playerGameState = gameState.player_states[player.id];
              const isCurrentTurn = gameState.current_player_id === player.id;
              const isCurrentUser = player.id === userId;

              return (
                <PlayerBoard
                  key={player.id}
                  player={player}
                  playerState={playerGameState}
                  isCurrentPlayer={isCurrentTurn}
                  isCurrentUser={isCurrentUser}
                  allPlayersSetup={allPlayersSetup}
                />
              );
            })}
          </div>
        </div>

        {/* Game Actions */}
        <div className="lg:col-span-1">
          <GameActions
            isPlayerTurn={isPlayerTurn()}
            currentPlayerState={playerState}
            players={players.filter(p => p.id !== userId)}
            playerStates={gameState.player_states}
            onAction={handleGameAction}
          />
        </div>
      </div>
    </div>
  );
};
