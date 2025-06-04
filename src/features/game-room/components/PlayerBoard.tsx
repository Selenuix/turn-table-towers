
import { Player, PlayerState } from '../types';
import { CardComponent } from './CardComponent';
import { getCardValue } from '../utils/gameLogic';

interface PlayerBoardProps {
  player: Player;
  playerState: PlayerState;
  isCurrentPlayer: boolean;
  isCurrentUser: boolean;
}

export const PlayerBoard = ({ 
  player, 
  playerState, 
  isCurrentPlayer, 
  isCurrentUser 
}: PlayerBoardProps) => {
  return (
    <div className={`
      p-4 rounded-lg border-2 
      ${isCurrentPlayer 
        ? 'bg-purple-900/50 border-purple-500' 
        : 'bg-slate-800/50 border-slate-600'
      }
      ${isCurrentUser ? 'ring-2 ring-blue-400' : ''}
    `}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
            {player.username?.[0]?.toUpperCase() || player.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-white font-medium">
            {player.username || player.email?.split('@')[0]}
            {isCurrentUser && ' (You)'}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-red-400 font-bold">♥ {playerState.hp}</span>
          {playerState.stored_cards.length > 0 && (
            <span className="text-yellow-400">📦 {playerState.stored_cards.length}</span>
          )}
          {isCurrentPlayer && <span className="text-green-400">⭐</span>}
        </div>
      </div>

      {playerState.setup_complete && (
        <div className="space-y-2">
          {/* Shield Card */}
          <div className="text-center">
            <div className="text-xs text-slate-300 mb-1">Shield ({playerState.shield ? getCardValue(playerState.shield) : 0})</div>
            <div className="flex justify-center">
              {playerState.shield ? (
                <CardComponent card={playerState.shield} faceDown={!isCurrentUser} />
              ) : (
                <div className="w-16 h-24 border-2 border-dashed border-slate-500 rounded-lg"></div>
              )}
            </div>
          </div>

          {/* HP Cards */}
          <div className="text-center">
            <div className="text-xs text-slate-300 mb-1">HP Cards</div>
            <div className="flex justify-center space-x-1">
              {playerState.hp_cards?.map((card, index) => (
                <CardComponent 
                  key={index} 
                  card={card} 
                  faceDown={!isCurrentUser} 
                  className="w-12 h-18 text-xs"
                />
              )) || Array(3).fill(0).map((_, index) => (
                <div key={index} className="w-12 h-18 border-2 border-dashed border-slate-500 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!playerState.setup_complete && (
        <div className="text-center text-slate-400 text-sm">
          Setting up cards...
        </div>
      )}
    </div>
  );
};
