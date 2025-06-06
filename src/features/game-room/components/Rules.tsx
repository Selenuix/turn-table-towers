import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface RulesProps {
  onClose?: () => void;
  showDoNotShowAgain?: boolean;
  onDoNotShowAgainChange?: (checked: boolean) => void;
  doNotShowAgain?: boolean;
}

export const Rules: React.FC<RulesProps> = ({
  onClose,
  showDoNotShowAgain = false,
  onDoNotShowAgainChange,
  doNotShowAgain = false
}) => {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-xl font-semibold mb-3 text-blue-400">🎮 Game Overview</h3>
        <p className="text-slate-300">
          Turn Table Towers is a strategic card game where players take turns attacking each other
          while trying to protect their health points (HP). The last player standing wins!
        </p>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3 text-purple-400">🛡️ Your Defense</h3>
        <p className="text-slate-300">
          Each player starts with:
        </p>
        <ul className="list-disc ml-6 mt-2 text-slate-300">
          <li>3 HP cards (your life points)</li>
          <li>1 Shield card (your defense)</li>
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3 text-green-400">⚔️ Your Turn</h3>
        <p className="text-slate-300">
          On your turn, you can:
        </p>
        <ul className="list-disc ml-6 mt-2 text-slate-300">
          <li>Change your shield (draw a new card)</li>
          <li>Change another player's shield</li>
          <li>Store a card for future use</li>
          <li>Attack another player</li>
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3 text-red-400">🎯 Attacking</h3>
        <p className="text-slate-300">
          When attacking:
        </p>
        <ul className="list-disc ml-6 mt-2 text-slate-300">
          <li>Choose a target player</li>
          <li>Select stored cards to use in your attack</li>
          <li>Draw a card from the deck</li>
          <li>If your attack value is higher than their shield, they lose HP</li>
          <li>If you hit them, they lose all their stored cards</li>
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-3 text-yellow-400">🏆 Winning</h3>
        <p className="text-slate-300">
          The game ends when only one player remains with HP. That player is the winner!
        </p>
      </section>

      {showDoNotShowAgain && (
        <div className="flex items-center space-x-2 mt-4">
          <Checkbox
            id="do-not-show-again"
            checked={doNotShowAgain}
            onCheckedChange={onDoNotShowAgainChange}
            className="border-slate-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
          />
          <Label htmlFor="do-not-show-again" className="text-slate-300">
            Don't show this again
          </Label>
        </div>
      )}

      {onClose && (
        <div className="flex justify-center mt-6">
          <Button 
            onClick={onClose} 
            variant="default"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
          >
            Got it!
          </Button>
        </div>
      )}
    </div>
  );
}; 