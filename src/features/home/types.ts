export type GameStatus = 'waiting' | 'in_progress' | 'finished';

export interface GameRoom {
  id: string;
  name: string;
  owner_id: string;
  player_ids: string[];
  max_players: number;
  status: GameStatus;
  room_code: string;
  created_at: string;
  updated_at: string;
} 