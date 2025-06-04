import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameRoom } from "@/features/home/types";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface GameListProps {
  games: GameRoom[];
  onJoinGame: (gameId: string) => Promise<void>;
}

export const GameList = ({ games, onJoinGame }: GameListProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Filter out finished games
  const activeGames = games.filter(game => game.status !== 'finished');

  // Group games by status
  const ongoingGames = activeGames.filter(game => game.status === 'in_progress');
  const waitingGames = activeGames.filter(game => game.status === 'waiting');

  const handleJoinGame = async (gameId: string) => {
    try {
      await onJoinGame(gameId);
      navigate(`/game/${gameId}`);
    } catch (error) {
      console.error('Error joining game:', error);
    }
  };

  const handleRejoinGame = (gameId: string) => {
    navigate(`/game/${gameId}`);
  };

  if (activeGames.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8 text-center">
          <div className="text-white text-lg">No Active Games</div>
          <div className="text-slate-400 text-sm mt-2">
            Create a new game or wait for someone to create one.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ongoing Games */}
      {ongoingGames.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Ongoing Games</h2>
          <div className="grid gap-4">
            {ongoingGames.map(game => {
              const isPlayer = game.player_ids?.includes(user?.id || '');
              return (
                <Card key={game.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {game.name || 'Unnamed Game'}
                        </h3>
                        <div className="text-slate-400 text-sm">
                          Players: {game.player_ids?.length || 0}/{game.max_players}
                        </div>
                      </div>
                      <Button
                        onClick={() => isPlayer ? handleRejoinGame(game.id) : handleJoinGame(game.id)}
                        variant={isPlayer ? "secondary" : "default"}
                      >
                        {isPlayer ? 'Rejoin Game' : 'Join Game'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Waiting Games */}
      {waitingGames.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Waiting Games</h2>
          <div className="grid gap-4">
            {waitingGames.map(game => {
              const isPlayer = game.player_ids?.includes(user?.id || '');
              return (
                <Card key={game.id} className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {game.name || 'Unnamed Game'}
                        </h3>
                        <div className="text-slate-400 text-sm">
                          Players: {game.player_ids?.length || 0}/{game.max_players}
                        </div>
                      </div>
                      <Button
                        onClick={() => isPlayer ? handleRejoinGame(game.id) : handleJoinGame(game.id)}
                        variant={isPlayer ? "secondary" : "default"}
                      >
                        {isPlayer ? 'Rejoin Game' : 'Join Game'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}; 