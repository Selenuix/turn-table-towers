
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameState, Player } from "@/features/game-room/types";
import { useGameState } from "@/hooks/useGameState";

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
    getPlayerHand
  } = useGameState(roomId, userId);

  if (loading) {
    return <div className="text-white">Loading game...</div>;
  }

  if (error) {
    return <div className="text-red-400">Error loading game: {error.message}</div>;
  }

  if (!gameState) {
    return <div className="text-white">Game not found</div>;
  }

  const playerState = gameState.player_states[userId];
  const isSetupPhase = playerState && !playerState.setup_complete;

  if (isSetupPhase) {
    return <SetupPhase roomId={roomId} userId={userId} gameState={gameState} setupPlayerCards={setupPlayerCards} />;
  }

  return (
    <div className="text-white space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Game in Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Players</h3>
              <div className="space-y-2">
                {players.map(player => {
                  const playerGameState = gameState.player_states[player.id];
                  const isCurrentTurn = gameState.current_player_id === player.id;
                  
                  return (
                    <div 
                      key={player.id} 
                      className={`p-3 rounded-lg ${isCurrentTurn ? 'bg-purple-900/50 border border-purple-500/50' : 'bg-slate-700/30'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-2">
                            {player.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <span>{player.username || player.email?.split('@')[0]} {player.id === userId && '(You)'}</span>
                        </div>
                        {playerGameState && (
                          <div className="flex items-center space-x-2">
                            <span className="text-red-400">♥ {playerGameState.hp || 0}</span>
                            {isCurrentTurn && <span className="text-yellow-400">●</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Your Hand</h3>
              <div className="flex flex-wrap gap-2">
                {getPlayerHand().map((card, index) => (
                  <div key={index} className="w-12 h-16 bg-white rounded-lg text-black flex flex-col items-center justify-center">
                    <div className={card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'}>
                      {card.rank === 'ace' ? 'A' : 
                       card.rank === 'jack' ? 'J' : 
                       card.rank === 'queen' ? 'Q' : 
                       card.rank === 'king' ? 'K' : card.rank}
                    </div>
                    <div className={card.suit === 'hearts' || card.suit === 'diamonds' ? 'text-red-600' : 'text-black'}>
                      {card.suit === 'hearts' ? '♥' : 
                       card.suit === 'diamonds' ? '♦' : 
                       card.suit === 'clubs' ? '♣' : '♠'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Game Status</h3>
            {isPlayerTurn() ? (
              <div className="bg-green-900/30 border border-green-500/50 p-4 rounded-lg">
                <p className="mb-3">It's your turn!</p>
                <div className="flex space-x-3">
                  <Button>Draw Card</Button>
                  <Button variant="secondary" disabled={getPlayerHand().length === 0}>Play Card</Button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-700/30 p-4 rounded-lg">
                <p>Waiting for {players.find(p => p.id === gameState.current_player_id)?.username || 'other player'} to make a move...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface SetupPhaseProps {
  roomId: string;
  userId: string;
  gameState: GameState;
  setupPlayerCards: (shieldIndex: number, hpIndices: number[]) => Promise<{data: any, error: any}>;
}

const SetupPhase = ({ roomId, userId, gameState, setupPlayerCards }: SetupPhaseProps) => {
  return (
    <div className="text-white">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Setup Your Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Each player needs to select 1 shield card and 3 HP cards from their hand before the game can begin.</p>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Your Hand</h3>
            <p className="text-sm text-slate-300 mb-2">Select cards to continue...</p>
            
            {/* Implementation of card selection UI to be completed */}
            <Button 
              onClick={() => setupPlayerCards(0, [1, 2, 3])} 
              className="mt-4"
            >
              Automatically Set Up Cards (Demo)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
