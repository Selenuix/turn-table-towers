export interface GameRoom {
  id: string;
  name: string | null;
  owner_id: string;
  player_ids: string[];
  max_players: number;
  status: string;
  room_code: string;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  username: string | null;
  email: string | null;
  created_at: string;
}

export type RoomStatus = 'waiting' | 'in_progress' | 'completed'; 