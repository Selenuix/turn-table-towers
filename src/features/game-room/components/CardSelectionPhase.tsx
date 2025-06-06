import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '../types';
import { CardComponent } from './CardComponent';
import { getCardValue } from '../utils/gameLogic';

interface CardSelectionPhaseProps {
  playerHand: Card[];
  onSetupComplete: (shieldIndex: number, hpIndices: number[]) => void;
}

export const CardSelectionPhase = ({ playerHand, onSetupComplete }: CardSelectionPhaseProps) => {
  const [selectedShield, setSelectedShield] = useState<number | null>(null);
  const [selectedHP, setSelectedHP] = useState<number[]>([]);
  const [cardsRevealed, setCardsRevealed] = useState(false);

  const handleCardClick = (index: number) => {
    if (selectedShield === index) {
      // Deselect shield
      setSelectedShield(null);
    } else if (selectedHP.includes(index)) {
      // Remove from HP selection
      setSelectedHP(prev => prev.filter(i => i !== index));
    } else if (selectedShield === null) {
      // Select as shield
      setSelectedShield(index);
    } else {
      // Add to HP selection
      setSelectedHP(prev => [...prev, index]);
    }
  };

  const getCardRole = (index: number) => {
    if (selectedShield === index) return 'shield';
    if (selectedHP.includes(index)) return 'hp';
    return 'unassigned';
  };

  const canComplete = selectedShield !== null && selectedHP.length > 0;
  const totalHP = selectedHP.reduce((sum, index) => sum + getCardValue(playerHand[index]), 0);

  const handleComplete = () => {
    if (canComplete && selectedShield !== null) {
      // First reveal the cards
      setCardsRevealed(true);
      
      // After a short delay, complete the setup
      setTimeout(() => {
        onSetupComplete(selectedShield, selectedHP);
      }, 2000); // 2 second delay to allow player to see the card values
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">Setup Your Cards</h3>
        <p className="text-slate-300 mb-4">
          Choose one card for your shield and at least one card for your HP
        </p>
        <div className="flex justify-center gap-8 text-sm">
          <div className="text-blue-400">
            Shield: {selectedShield !== null ? (cardsRevealed ? getCardValue(playerHand[selectedShield]) : '?') : 'None selected'}
          </div>
          <div className="text-green-400">
            HP: {cardsRevealed ? totalHP : '?'} ({selectedHP.length} cards)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-4 justify-center">
        {playerHand.map((card, index) => {
          const role = getCardRole(index);
          return (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`cursor-pointer transition-all duration-200 ${
                  role === 'shield' 
                    ? 'ring-2 ring-blue-400 scale-105' 
                    : role === 'hp'
                    ? 'ring-2 ring-green-400 scale-105'
                    : 'hover:scale-105'
                }`}
                onClick={() => handleCardClick(index)}
              >
                <CardComponent card={card} faceDown={!cardsRevealed} />
              </div>
              <div className="text-center text-xs mt-2">
                {role === 'shield' && <span className="text-blue-400 font-medium">Shield</span>}
                {role === 'hp' && <span className="text-green-400 font-medium">HP</span>}
                {role === 'unassigned' && <span className="text-slate-400">Click to assign</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleComplete}
          disabled={!canComplete}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600"
        >
          {cardsRevealed ? "Finalizing Setup..." : "Confirm Setup"}
        </Button>
      </div>
    </div>
  );
};
