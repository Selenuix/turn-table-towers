
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayerState } from '../types';
import { CardComponent } from './CardComponent';
import { getCardValue, calculateHP } from '../utils/gameLogic';

interface SetupPhaseProps {
  playerState: PlayerState;
  onSetupComplete: (shieldIndex: number, hpIndices: number[]) => void;
}

export const SetupPhase = ({ playerState, onSetupComplete }: SetupPhaseProps) => {
  const [selectedShield, setSelectedShield] = useState<number | null>(null);
  const [selectedHP, setSelectedHP] = useState<number[]>([]);
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleHPCard = (index: number) => {
    if (index === selectedShield) return; // Can't select shield as HP

    setSelectedHP(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else if (prev.length < 3) {
        return [...prev, index];
      }
      return prev;
    });
  };

  const selectShield = (index: number) => {
    if (selectedHP.includes(index)) {
      setSelectedHP(prev => prev.filter(i => i !== index));
    }
    setSelectedShield(index);
  };

  const handleSubmit = () => {
    if (selectedShield !== null && selectedHP.length === 3 && !isSubmitting) {
      // Set submitting state to prevent multiple clicks
      setIsSubmitting(true);

      // First reveal the cards
      setCardsRevealed(true);

      // After a short delay, complete the setup
      setTimeout(() => {
        onSetupComplete(selectedShield, selectedHP);
      }, 2000); // 2 second delay to allow player to see the card values
    }
  };

  const canSubmit = selectedShield !== null && selectedHP.length === 3;
  const selectedHPCards = selectedHP.map(i => playerState.hand[i]);
  const totalHP = calculateHP(selectedHPCards);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Setup Your Cards</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-slate-300">
          {cardsRevealed ? (
            <div className="p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg mb-4">
              <p className="text-blue-300 font-medium">Revealing your card values!</p>
              <p className="text-sm text-blue-400 mt-1">
                Now you can see the actual values of your selected cards.
              </p>
            </div>
          ) : (
            <p className="mb-2">Select 1 shield card and 3 HP cards from your hand:</p>
          )}
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• Shield card protects you from attacks</li>
            <li>• HP cards determine your health points</li>
            <li>• Lower total HP means you go first</li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-medium mb-3">Your Hand</h3>
          <div className="flex justify-center space-x-4">
            {playerState.hand.map((card, index) => (
              <div key={index} className="flex flex-col items-center">
                <CardComponent
                  card={card}
                  faceDown={!cardsRevealed}
                  selected={selectedShield === index || selectedHP.includes(index)}
                  onClick={() => {
                    if (selectedShield === index) {
                      setSelectedShield(null);
                    } else if (selectedHP.includes(index)) {
                      toggleHPCard(index);
                    } else if (selectedShield === null) {
                      selectShield(index);
                    } else {
                      toggleHPCard(index);
                    }
                  }}
                />
                <div className="text-center mt-2 space-y-1">
                  {cardsRevealed && (
                    <div className="text-xs text-slate-400">
                      Value: {getCardValue(card)}
                    </div>
                  )}
                  {selectedShield === index && (
                    <div className="text-xs text-blue-400 font-medium">Shield</div>
                  )}
                  {selectedHP.includes(index) && (
                    <div className="text-xs text-red-400 font-medium">HP</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-slate-700/50 rounded-lg">
            <div className="text-slate-300 text-sm">Shield Value</div>
            <div className="text-white text-lg font-bold">
              {cardsRevealed && selectedShield !== null
                ? getCardValue(playerState.hand[selectedShield])
                : (selectedShield !== null ? '?' : '-')}
            </div>
          </div>
          <div className="p-3 bg-slate-700/50 rounded-lg">
            <div className="text-slate-300 text-sm">Total HP</div>
            <div className="text-white text-lg font-bold">
              {cardsRevealed && selectedHP.length === 3
                ? totalHP
                : (selectedHP.length === 3 ? '?' : '-')}
            </div>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="w-full"
        >
          {isSubmitting
            ? (cardsRevealed ? "Finalizing Setup..." : "Revealing Cards...")
            : "Confirm Setup"}
        </Button>
      </CardContent>
    </Card>
  );
};
