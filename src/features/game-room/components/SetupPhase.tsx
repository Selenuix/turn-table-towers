
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
    if (selectedShield !== null && selectedHP.length === 3) {
      onSetupComplete(selectedShield, selectedHP);
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
          <p className="mb-2">Select 1 shield card and 3 HP cards from your hand:</p>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• Shield card protects you from attacks</li>
            <li>• HP cards determine your health points</li>
            <li>• Lower total HP means you go first</li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-medium mb-3">Your Hand</h3>
          <div className="flex justify-center space-x-2">
            {playerState.hand.map((card, index) => (
              <div key={index} className="text-center">
                <CardComponent
                  card={card}
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
                <div className="text-xs text-slate-400 mt-1">
                  Value: {getCardValue(card)}
                </div>
                {selectedShield === index && (
                  <div className="text-xs text-blue-400 font-medium">Shield</div>
                )}
                {selectedHP.includes(index) && (
                  <div className="text-xs text-red-400 font-medium">HP</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-slate-700/50 rounded-lg">
            <div className="text-slate-300 text-sm">Shield Value</div>
            <div className="text-white text-lg font-bold">
              {selectedShield !== null ? getCardValue(playerState.hand[selectedShield]) : '-'}
            </div>
          </div>
          <div className="p-3 bg-slate-700/50 rounded-lg">
            <div className="text-slate-300 text-sm">Total HP</div>
            <div className="text-white text-lg font-bold">
              {selectedHP.length === 3 ? totalHP : '-'}
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full"
        >
          Confirm Setup
        </Button>
      </CardContent>
    </Card>
  );
};
