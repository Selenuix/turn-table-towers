import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/hooks/useAuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Player, PlayerState } from '@/features/game-room/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, Home, Plus } from 'lucide-react';

interface GameOverProps {
  players: Player[];
  currentUserId: string;
  roomId: string;
}

export const GameOver: React.FC<GameOverProps> = ({ players, currentUserId, roomId }) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { toast } = useToast();

  // Get player states to determine elimination order
  const [playerStates, setPlayerStates] = React.useState<Record<string, PlayerState>>({});
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPlayerStates = async () => {
      try {
        const { data: gameState, error } = await supabase
          .from('game_states')
          .select('*')
          .eq('room_id', roomId)
          .single();

        if (error) throw error;

        if (gameState) {
          const states = typeof gameState.player_states === 'string' 
            ? JSON.parse(gameState.player_states)
            : gameState.player_states;
          setPlayerStates(states);
        }
      } catch (error) {
        console.error('Error fetching player states:', error);
        toast({
          title: 'Error',
          description: 'Failed to load game results',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerStates();
  }, [roomId, toast]);

  const handleCreateNewGame = async () => {
    if (!user) return;

    try {
      // Generate a room code
      const { data: roomCode, error: codeError } = await supabase
        .rpc('generate_room_code');

      if (codeError) throw codeError;

      // Create new room
      const { data: newRoom, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          owner_id: user.id,
          room_code: roomCode,
          status: 'waiting',
          player_ids: players.map(p => p.id)
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Initialize game state
      const { error: initError } = await supabase
        .rpc('initialize_game_state', {
          p_room_id: newRoom.id
        });

      if (initError) throw initError;

      // Navigate to the new room
      navigate(`/room/${newRoom.id}`);
    } catch (error) {
      console.error('Error creating new game:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new game',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading results...</div>
      </div>
    );
  }

  // Sort players by elimination order (eliminated players first)
  const sortedPlayers = [...players].sort((a, b) => {
    const stateA = playerStates[a.id];
    const stateB = playerStates[b.id];
    
    if (!stateA || !stateB) return 0;
    
    if (stateA.eliminated && !stateB.eliminated) return 1;
    if (!stateA.eliminated && stateB.eliminated) return -1;
    
    return stateA.hp - stateB.hp;
  });

  const winner = sortedPlayers[0];
  const isWinner = winner?.id === currentUserId;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
          {isWinner ? 'You Won!' : 'Game Over'}
        </h1>
        <p className="text-slate-300">
          {isWinner 
            ? 'Congratulations on your victory!'
            : `Better luck next time! ${winner?.username || 'Anonymous'} won the game.`
          }
        </p>
      </div>

      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-4">Game Over</h2>
        
        <div className="space-y-4 mb-6">
          {sortedPlayers.map((player, index) => {
            const state = playerStates[player.id];
            const isEliminated = state?.eliminated;
            const isWinner = !isEliminated && state?.hp > 0;
            
            return (
              <div
                key={player.id}
                className={`p-4 rounded-lg ${
                  isWinner
                    ? 'bg-green-900/50 border-green-700'
                    : 'bg-slate-700/50 border-slate-600'
                } border`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-medium text-white">
                      {index + 1}. {player.username || 'Anonymous'}
                    </span>
                    {isWinner && (
                      <span className="ml-2 text-green-400">(Winner!)</span>
                    )}
                  </div>
                  <div className="text-slate-400">
                    {isEliminated ? 'Eliminated' : `HP: ${state?.hp || 0}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleCreateNewGame}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Play Again
          </Button>
        </div>
      </Card>

      <div className="flex justify-center space-x-4">
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
        >
          <Home className="w-4 h-4 mr-2" />
          Go Home
        </Button>
        <Button
          onClick={handleCreateNewGame}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Game
        </Button>
      </div>
    </div>
  );
};
