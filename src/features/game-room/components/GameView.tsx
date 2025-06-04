import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Player } from "@/features/game-room/types";
import { useGameState } from "@/hooks/useGameState";
import { SetupPhase } from './SetupPhase';
import { PlayerBoard } from './PlayerBoard';
import { GameActions } from './GameActions';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    isPlayerTurn,
    performGameAction
  } = useGameState(roomId, userId);

  const { toast } = useToast();
  const navigate = useNavigate();
  const [roomStatus, setRoomStatus] = useState<string | null>(null);

  // Fetch room status
  useEffect(() => {
    const fetchRoomStatus = async () => {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('status')
        .eq('id', roomId)
        .single();

      if (!error && data) {
        setRoomStatus(data.status);
      }
    };

    fetchRoomStatus();
  }, [roomId]);

  // Redirect to home when game or room is finished
  useEffect(() => {
    if (gameState?.status === 'finished' || roomStatus === 'finished') {
      navigate('/');
    }
  }, [gameState?.status, roomStatus, navigate]);

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-slate-800 rounded mx-auto"></div>
            <div className="h-4 w-64 bg-slate-800/50 rounded mx-auto"></div>
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

  // Check if game is over
  if (gameState.status === 'finished') {
    // Find the winner (player with HP > 0)
    const winner = players.find(player => {
      const state = gameState.player_states[player.id];
      return state && state.hp > 0;
    });

    if (!winner) {
      return (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <div className="text-white text-lg">Game Over</div>
            <div className="text-slate-400 text-sm mt-2">
              No winner found. This shouldn't happen!
            </div>
          </CardContent>
        </Card>
      );
    }

    const isWinner = winner.id === userId;

    return (
      <Card className={`${isWinner ? 'bg-green-900/20 border-green-700' : 'bg-slate-800/50 border-slate-700'}`}>
        <CardHeader>
          <CardTitle className={`text-2xl font-bold ${isWinner ? 'text-green-400' : 'text-white'}`}>
            {isWinner ? 'You Won!' : 'Game Over'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {isWinner ? (
              <div className="text-green-300">
                Congratulations! You have won the game!
              </div>
            ) : (
              <div className="text-slate-300">
                {winner.username || winner.email?.split('@')[0]} has won the game!
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-3">Final Stats</h3>
              <div className="space-y-2">
                {players.map(player => {
                  const playerGameState = gameState.player_states[player.id];
                  const isEliminated = playerGameState?.hp <= 0;
                  return (
                    <div key={player.id} className="flex items-center justify-between p-2 rounded bg-slate-800/30">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${isEliminated ? 'bg-red-500' : 'bg-green-500'}`} />
                        <span className="text-white">
                          {player.username || player.email?.split('@')[0]}
                          {player.id === userId && ' (You)'}
                        </span>
                      </div>
                      <div className="text-slate-400">
                        HP: {playerGameState?.hp || 0}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6">
              <Button
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if all players have completed setup
  const allPlayersSetup = players.every(player =>
    gameState.player_states[player.id]?.setup_complete
  );

  const handleSetupComplete = async (selectedShield: number, selectedHpCards: number[]) => {
    try {
      const { error } = await supabase.rpc('update_player_cards', {
        p_room_id: roomId,
        p_player_id: userId,
        p_shield_index: selectedShield,
        p_hp_indices: selectedHpCards
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error completing setup:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete setup',
        variant: 'destructive'
      });
    }
  };

  // If current player hasn't completed setup, show SetupPhase
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

  // If current player has completed setup but others haven't, show waiting screen
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

  const handleGameAction = async (action: string, data?: any) => {
    try {
      await performGameAction(action, data);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  };

  return (
    <div className="space-y-8">
      {/* Game Status */}
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-100">Shield Card Game</h2>
              <div className="flex items-center text-slate-300">
                <Clock className="w-4 h-4 mr-2 text-slate-400" />
                Current Turn: {
                  players.find(p => p.id === gameState.current_player_id)?.username ||
                  players.find(p => p.id === gameState.current_player_id)?.email?.split('@')[0] ||
                  'Unknown Player'
                }
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-slate-400 text-sm mb-1">Cards in Deck</div>
                <div className="text-slate-100 text-2xl font-bold">{gameState.deck.length}</div>
              </div>
              <div className="h-12 w-px bg-slate-800"></div>
              <div className="text-right">
                <div className="text-slate-400 text-sm mb-1">Players</div>
                <div className="text-slate-100 text-2xl font-bold">{players.length}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Actions */}
      <div className="w-full">
        <GameActions
          isPlayerTurn={isPlayerTurn() && playerState.hp > 0}
          currentPlayerState={playerState}
          players={players.filter(p => p.id !== userId && gameState.player_states[p.id]?.hp > 0)}
          playerStates={gameState.player_states}
          onAction={handleGameAction}
        />
      </div>

      {/* Player Boards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {players.map((player) => {
          const playerState = gameState.player_states[player.id];
          const isCurrentPlayer = player.id === gameState.current_player_id;
          const isCurrentUser = player.id === userId;
          const currentPlayer = players.find(p => p.id === gameState.current_player_id);

          return (
            <PlayerBoard
              key={player.id}
              player={player}
              playerState={playerState}
              isCurrentPlayer={isCurrentPlayer}
              isCurrentUser={isCurrentUser}
              allPlayersSetup={allPlayersSetup}
              currentPlayer={currentPlayer}
            />
          );
        })}
      </div>
    </div>
  );
};
