
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Player, PlayerState } from '../types';
import { useNavigate } from 'react-router-dom';
import { Crown, Trophy, Medal, Award } from 'lucide-react';

interface GameOverProps {
  winner: Player;
  players: Player[];
  playerStates: Record<string, PlayerState>;
  currentUserId: string;
  onStartNewGame?: () => void;
}

export const GameOver = ({ winner, players, playerStates, currentUserId, onStartNewGame }: GameOverProps) => {
  const navigate = useNavigate();
  
  const currentUserWon = winner.id === currentUserId;
  
  // Calculate player rankings based on final HP and elimination order
  const rankedPlayers = [...players].sort((a, b) => {
    const stateA = playerStates[a.id];
    const stateB = playerStates[b.id];
    
    // Winner always comes first
    if (a.id === winner.id) return -1;
    if (b.id === winner.id) return 1;
    
    // Sort by HP (higher HP = better rank)
    return (stateB?.hp || 0) - (stateA?.hp || 0);
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Trophy className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <Award className="w-6 h-6 text-slate-400" />;
    }
  };

  const getRankText = (rank: number) => {
    const suffixes = ['st', 'nd', 'rd'];
    const suffix = suffixes[rank - 1] || 'th';
    return `${rank}${suffix}`;
  };

  const getCurrentUserRank = () => {
    return rankedPlayers.findIndex(p => p.id === currentUserId) + 1;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="bg-slate-800/50 border-slate-700 max-w-2xl w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white mb-4">
            {currentUserWon ? (
              <div className="flex items-center justify-center gap-3">
                <Crown className="w-8 h-8 text-yellow-400" />
                <span className="text-yellow-400">You Won!</span>
                <Crown className="w-8 h-8 text-yellow-400" />
              </div>
            ) : (
              <div className="text-slate-300">Game Over</div>
            )}
          </CardTitle>
          {!currentUserWon && (
            <div className="text-xl text-slate-400">
              You finished {getRankText(getCurrentUserRank())} place
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {currentUserWon && (
            <div className="text-center mb-6 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
              <div className="text-yellow-300 text-lg font-medium">
                🎉 Congratulations on your victory! 🎉
              </div>
            </div>
          )}

          <div className="space-y-4 mb-8">
            <h3 className="text-white text-xl font-medium text-center mb-4">Final Rankings</h3>
            <div className="space-y-3">
              {rankedPlayers.map((player, index) => {
                const rank = index + 1;
                const state = playerStates[player.id];
                const isCurrentUser = player.id === currentUserId;
                const isWinner = player.id === winner.id;
                
                return (
                  <div
                    key={player.id}
                    className={`p-4 rounded-lg border ${
                      isWinner
                        ? 'bg-yellow-900/30 border-yellow-700/50'
                        : isCurrentUser
                        ? 'bg-blue-900/30 border-blue-700/50'
                        : 'bg-slate-700/30 border-slate-600/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getRankIcon(rank)}
                        <div>
                          <div className="text-white font-medium">
                            {getRankText(rank)} Place
                          </div>
                          <div className={`text-sm ${
                            isWinner ? 'text-yellow-300' : 
                            isCurrentUser ? 'text-blue-300' : 'text-slate-300'
                          }`}>
                            {player.username || player.email?.split('@')[0]}
                            {isCurrentUser && ' (You)'}
                            {isWinner && ' 👑'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">
                          {state?.hp || 0} HP
                        </div>
                        <div className="text-xs text-slate-400">
                          {state?.eliminated ? 'Eliminated' : 'Survived'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onStartNewGame && (
              <Button
                onClick={onStartNewGame}
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                Start New Game
              </Button>
            )}
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
    </div>
  );
};
