import { Player, PlayerState } from '../types';
import { CardComponent } from './CardComponent';
import { getCardValue } from '../utils/gameLogic';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Shield, Heart, Clock, User } from "lucide-react";

interface PlayerBoardProps {
  player: Player;
  playerState: PlayerState;
  isCurrentPlayer: boolean;
  isCurrentUser: boolean;
  allPlayersSetup: boolean;
  currentPlayer?: Player;
}

export const PlayerBoard = ({
  player,
  playerState,
  isCurrentPlayer,
  isCurrentUser,
  allPlayersSetup,
  currentPlayer
}: PlayerBoardProps) => {
  const isEliminated = playerState?.hp <= 0;

  return (
    <Card 
      className={`
        relative transition-all duration-200
        ${isCurrentPlayer ? 'ring-2 ring-yellow-500 shadow-lg shadow-yellow-500/20' : ''} 
        ${isEliminated ? 'opacity-50' : 'hover:shadow-md hover:shadow-slate-500/10'}
        ${isCurrentUser ? 'border-blue-500/30' : 'border-slate-800'}
        bg-slate-900/50 backdrop-blur-sm
      `}
    >
      <CardContent className="p-6">
        {/* Player Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 ring-1 ring-slate-700">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                {player.username || player.email?.split('@')[0]}
                {isCurrentUser && (
                  <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30">You</Badge>
                )}
              </h3>
              {isEliminated && (
                <Badge variant="destructive" className="mt-1 bg-red-500/20 text-red-300 border-red-500/30">Eliminated</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center px-3 py-1.5 rounded-full bg-slate-800/80 ring-1 ring-slate-700">
              <Heart className="w-4 h-4 mr-2 text-red-400" />
              <span className="text-slate-100 font-medium">HP: {playerState.hp}</span>
            </div>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Shield Card */}
          <div className="space-y-3">
            <div className="flex items-center text-slate-300 bg-slate-800/80 px-3 py-2 rounded-lg ring-1 ring-slate-700">
              <Shield className="w-4 h-4 mr-2 text-blue-400" />
              <span className="font-medium">Shield</span>
            </div>
            <div className="flex justify-center">
              {playerState.shield ? (
                <CardComponent card={playerState.shield} />
              ) : (
                <div className="h-32 w-24 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500 border border-dashed border-slate-700">
                  No Shield
                </div>
              )}
            </div>
          </div>

          {/* HP Cards */}
          <div className="space-y-3">
            <div className="flex items-center text-slate-300 bg-slate-800/80 px-3 py-2 rounded-lg ring-1 ring-slate-700">
              <Heart className="w-4 h-4 mr-2 text-red-400" />
              <span className="font-medium">HP Cards</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {playerState.hp_cards?.map((card, index) => (
                <div key={index} className="flex justify-center">
                  <CardComponent card={card} />
                </div>
              )) || (
                <div className="col-span-2 h-32 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-500 border border-dashed border-slate-700">
                  No HP Cards
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stored Cards */}
        {playerState.stored_cards && playerState.stored_cards.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center text-slate-300 bg-slate-800/80 px-3 py-2 rounded-lg ring-1 ring-slate-700">
              <Clock className="w-4 h-4 mr-2 text-amber-400" />
              <span className="font-medium">Stored Cards</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {playerState.stored_cards.map((card, index) => (
                <div key={index} className="flex justify-center">
                  <CardComponent card={card} faceDown={true} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Turn Status */}
        {allPlayersSetup && !isEliminated && (
          <div className="mt-6 text-center">
            {isCurrentPlayer ? (
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-4 py-1.5 text-sm font-medium">
                Your Turn
              </Badge>
            ) : (
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-800/80 text-slate-300 ring-1 ring-slate-700">
                <Clock className="w-4 h-4 mr-2 text-slate-400" />
                Waiting for {currentPlayer?.username || currentPlayer?.email?.split('@')[0] || 'Unknown Player'}'s turn
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
