
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Player, PlayerState, Card as GameCard } from '../types';
import { CardComponent } from './CardComponent';
import { getCardValue } from '../utils/gameLogic';

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
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const [confirmingAttack, setConfirmingAttack] = useState(false);

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
      // If there are selected stored cards and they haven't been revealed yet,
      // enter the confirmation flow instead of immediately attacking
      if (selectedStoredCards.length > 0 && !cardsRevealed) {
        setConfirmingAttack(true);
      } else {
        // If no stored cards or they've already been revealed, proceed with attack
        onAction('attack', {
          targetId,
          storedCardIndices: selectedStoredCards
        });
        resetSelection();
      }
    } else if (selectedAction === 'change_other_shield') {
      onAction('change_other_shield', { targetId });
      resetSelection();
    }
  };

  const handleRevealCards = () => {
    setCardsRevealed(true);
  };

  const handleConfirmAttack = () => {
    if (selectedTarget && cardsRevealed) {
      onAction('attack', {
        targetId: selectedTarget,
        storedCardIndices: selectedStoredCards
      });
      resetSelection();
    }
  };

  const resetSelection = () => {
    setSelectedAction(null);
    setSelectedTarget(null);
    setSelectedStoredCards([]);
    setCardsRevealed(false);
    setConfirmingAttack(false);
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <Button
            onClick={() => onAction('change_own_shield')}
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium w-full"
          >
            Change Your Shield
          </Button>

          <Button
            onClick={() => handleAction('change_other_shield')}
            variant="default"
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium w-full"
          >
            Change Other's Shield
          </Button>

          <Button
            onClick={() => handleAction('store_card')}
            variant="default"
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium w-full"
          >
            Store a Card
          </Button>

          <Button
            onClick={() => handleAction('attack')}
            variant="default"
            className="bg-red-600 hover:bg-red-700 text-white font-medium w-full"
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
                  faceDown={!cardsRevealed}
                  selected={selectedStoredCards.includes(index)}
                  onClick={() => toggleStoredCard(index)}
                  className="w-12 h-16"
                />
              ))}
            </div>

            {selectedStoredCards.length > 0 && cardsRevealed && (
              <div className="mt-3 p-2 bg-slate-600/50 rounded border border-slate-500">
                <h5 className="text-white text-xs font-medium mb-1">Selected Card Values:</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedStoredCards.map((index) => (
                    <div key={index} className="text-xs bg-slate-700 px-2 py-1 rounded text-white">
                      {getCardValue(currentPlayerState.stored_cards[index])}
                    </div>
                  ))}
                  <div className="text-xs bg-green-700 px-2 py-1 rounded text-white">
                    Total: {selectedStoredCards.reduce((sum, index) =>
                      sum + getCardValue(currentPlayerState.stored_cards[index]), 0)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Target Selection */}
        {(selectedAction === 'attack' || selectedAction === 'change_other_shield') && !confirmingAttack && (
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
                  className="text-white hover:bg-slate-700 justify-start w-full"
                >
                  {player.username || player.email?.split('@')[0]} (HP: {playerStates[player.id]?.hp || 0})
                </Button>
              ))}
            </div>
            <Button onClick={resetSelection} variant="ghost" className="text-slate-400 w-full">
              Cancel
            </Button>
          </div>
        )}

        {/* Confirmation Flow for Attack with Stored Cards */}
        {confirmingAttack && selectedTarget && (
          <div className="space-y-3 mt-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
            <h4 className="text-white text-sm font-medium">
              Confirm Attack
            </h4>

            <div className="text-slate-300 text-sm">
              Target: {players.find(p => p.id === selectedTarget)?.username ||
                      players.find(p => p.id === selectedTarget)?.email?.split('@')[0] ||
                      'Unknown Player'}
            </div>

            {selectedStoredCards.length > 0 && (
              <div className="text-slate-300 text-sm">
                Using {selectedStoredCards.length} stored card{selectedStoredCards.length > 1 ? 's' : ''}
              </div>
            )}

            {!cardsRevealed && selectedStoredCards.length > 0 && (
              <div className="bg-blue-900/30 p-2 rounded border border-blue-700/50 text-blue-300 text-xs">
                Card values are hidden. Click "Reveal Card Values" to see what you're using.
              </div>
            )}

            <div className="flex flex-col gap-2">
              {!cardsRevealed && selectedStoredCards.length > 0 && (
                <Button
                  onClick={handleRevealCards}
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                >
                  Reveal Card Values
                </Button>
              )}

              <Button
                onClick={handleConfirmAttack}
                variant="default"
                className="bg-red-600 hover:bg-red-700 text-white w-full"
                disabled={selectedStoredCards.length > 0 && !cardsRevealed}
              >
                {selectedStoredCards.length > 0 && !cardsRevealed
                  ? "Reveal Values First"
                  : "Confirm Attack"}
              </Button>

              <Button
                onClick={resetSelection}
                variant="ghost"
                className="text-slate-400 w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
