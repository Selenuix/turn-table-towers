
import { Card } from '../types';

interface CardComponentProps {
  card: Card;
  faceDown?: boolean;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const CardComponent = ({ 
  card, 
  faceDown = false, 
  selected = false, 
  onClick, 
  className = "" 
}: CardComponentProps) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  
  const getDisplayRank = (rank: string) => {
    switch (rank) {
      case 'ace': return 'A';
      case 'jack': return 'J';
      case 'queen': return 'Q';
      case 'king': return 'K';
      default: return rank;
    }
  };

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };

  return (
    <div
      className={`
        w-16 h-24 rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer
        transition-all duration-200 hover:scale-105
        ${faceDown 
          ? 'bg-blue-800 border-blue-600' 
          : 'bg-white border-gray-300'
        }
        ${selected ? 'ring-2 ring-yellow-400' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {faceDown ? (
        <div className="text-white text-xs">🂠</div>
      ) : (
        <>
          <div className={`text-lg font-bold ${isRed ? 'text-red-600' : 'text-black'}`}>
            {getDisplayRank(card.rank)}
          </div>
          <div className={`text-xl ${isRed ? 'text-red-600' : 'text-black'}`}>
            {getSuitSymbol(card.suit)}
          </div>
        </>
      )}
    </div>
  );
};
