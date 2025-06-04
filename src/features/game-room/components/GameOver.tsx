import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Player, PlayerState } from '../types';
import { useNavigate } from 'react-router-dom';

interface GameOverProps {
  winner: Player;
  players: Player[];
  playerStates: Record<string, PlayerState>;
}

export const GameOver = ({ winner, players, playerStates }: GameOverProps) => {
  const navigate = useNavigate();

  return (
    <Card className="bg-slate-800/50 border-slate-700 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-white text-2xl text-center">
          Game Over!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-yellow-400 mb-2">
            {winner.username || winner.email?.split('@')[0]} Wins!
          </div>
          <div className="text-slate-300">
            Congratulations on your victory!
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <h3 className="text-white text-lg font-medium">Final Stats</h3>
          <div className="grid gap-2">
            {players.map(player => {
              const state = playerStates[player.id];
              const isWinner = player.id === winner.id;
              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-lg ${
                    isWinner
                      ? 'bg-yellow-900/30 border border-yellow-700/50'
                      : 'bg-slate-700/30 border border-slate-600/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-white">
                      {player.username || player.email?.split('@')[0]}
                      {isWinner && ' 👑'}
                    </div>
                    <div className="text-slate-300">
                      Final HP: {state?.hp || 0}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={() => navigate('/')}
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            Return to Home
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 