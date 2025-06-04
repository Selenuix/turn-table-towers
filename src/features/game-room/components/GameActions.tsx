
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/card';
import { Player, PlayerState, Card as GameCard } from '../types';
import { CardComponent } from './CardComponent';

interface GameActionsProps {
  isPlayerTurn: boolean;
  currentPlayerState: PlayerState;
  players: Player[];
  playerStates: Record<string, PlayerState>;
  onAction: (action: string, data?: any) => void;
}

export const GameActions = ({
  isPlayerTurn,
  currentPlayerState,
  players,
  playerStates,
  onAction
}: GameActionsProps) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedStoredCards, setSelectedStoredCards] = useState<number[]>([]);

  if (!isPlayerTurn) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <div className="p-4 text-center text-slate-300">
          Waiting for your turn...
        </div>
      </Card>
    );
  }

  const handleAction = (actionType: string) => {
    setSelectedAction(actionType);
    
    if (actionType === 'store_card') {
      onAction('store_card');
      setSelectedAction(null);
    }
  };

  const handleTargetSelect = (targetId: string) => {
    setSelectedTarget(targetId);
    
    if (selectedAction === 'attack') {
      onAction('attack', { 
        targetId, 
        storedCardIndices: selectedStoredCards 
      });
    } else if (selectedAction === 'change_other_shield') {
      onAction('change_other_shield', { targetId });
    }
    
    resetSelection();
  };

  const resetSelection = () => {
    setSelectedAction(null);
    setSelectedTarget(null);
    setSelectedStoredCards([]);
  };

  const toggleStoredCard = (index: number) => {
    setSelectedStoredCards(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-4">Your Turn - Choose an Action</h3>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button 
            onClick={() => onAction('change_own_shield')}
            variant="outline"
            className="text-white border-slate-600 hover:bg-slate-700"
          >
            Change Your Shield
          </Button>
          
          <Button 
            onClick={() => handleAction('change_other_shield')}
            variant="outline"
            className="text-white border-slate-600 hover:bg-slate-700"
          >
            Change Other's Shield
          </Button>
          
          <Button 
            onClick={() => handleAction('store_card')}
            variant="outline"
            className="text-white border-slate-600 hover:bg-slate-700"
          >
            Store a Card
          </Button>
          
          <Button 
            onClick={() => handleAction('attack')}
            variant="outline"
            className="text-white border-slate-600 hover:bg-slate-700"
          >
            Attack Player
          </Button>
        </div>

        {/* Stored Cards Selection for Attack */}
        {selectedAction === 'attack' && currentPlayerState.stored_cards.length > 0 && (
          <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
            <h4 className="text-white text-sm font-medium mb-2">
              Select stored cards to add to your attack (optional):
            </h4>
            <div className="flex space-x-2">
              {currentPlayerState.stored_cards.map((card, index) => (
                <CardComponent
                  key={index}
                  card={card}
                  selected={selectedStoredCards.includes(index)}
                  onClick={() => toggleStoredCard(index)}
                  className="w-12 h-16"
                />
              ))}
            </div>
          </div>
        )}

        {/* Target Selection */}
        {(selectedAction === 'attack' || selectedAction === 'change_other_shield') && (
          <div className="space-y-2">
            <h4 className="text-white text-sm font-medium">
              Select target player:
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {players.filter(p => playerStates[p.id]?.setup_complete).map(player => (
                <Button
                  key={player.id}
                  onClick={() => handleTargetSelect(player.id)}
                  variant="ghost"
                  className="text-white hover:bg-slate-700 justify-start"
                >
                  {player.username || player.email?.split('@')[0]} (HP: {playerStates[player.id]?.hp || 0})
                </Button>
              ))}
            </div>
            <Button onClick={resetSelection} variant="ghost" className="text-slate-400">
              Cancel
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
