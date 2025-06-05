
import { GameLog } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface GameLogEntryProps {
  log: GameLog;
  players: Record<string, { username: string | null; email: string | null }>;
}

export const GameLogEntry = ({ log, players }: GameLogEntryProps) => {
  const timeAgo = formatDistanceToNow(new Date(log.created_at), { addSuffix: true });
  
  const getPlayerName = (playerId: string | null) => {
    if (!playerId) return 'Unknown Player';
    const player = players[playerId];
    return player?.username || player?.email?.split('@')[0] || 'Unknown Player';
  };

  const getLogMessage = () => {
    const playerName = getPlayerName(log.player_id);
    
    switch (log.action_type) {
      case 'player_joined':
        return `${playerName} joined the game`;
      case 'player_left':
        return `${playerName} left the game`;
      case 'game_started':
        return `Game started`;
      case 'shield_changed_own':
        return `${playerName} changed their shield`;
      case 'shield_changed_other':
        const targetName = getPlayerName(log.action_data?.targetId);
        return `${playerName} changed ${targetName}'s shield`;
      case 'card_stored':
        return `${playerName} stored a card`;
      case 'player_attacked':
        const attackedName = getPlayerName(log.action_data?.targetId);
        const damage = log.action_data?.damage || 0;
        return `${playerName} attacked ${attackedName} for ${damage} damage`;
      case 'player_eliminated':
        return `${playerName} was eliminated`;
      case 'game_finished':
        const winner = getPlayerName(log.action_data?.winnerId);
        return `Game finished! ${winner} wins!`;
      default:
        return `${playerName} performed an action`;
    }
  };

  return (
    <div className="flex items-center justify-between py-1 px-2 text-xs text-slate-400 hover:bg-slate-700/30 rounded">
      <span>{getLogMessage()}</span>
      <span className="text-slate-500">{timeAgo}</span>
    </div>
  );
};
