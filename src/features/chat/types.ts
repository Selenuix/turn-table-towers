
export interface ChatMessage {
  id: string;
  room_id: string;
  player_id: string;
  message: string;
  message_type: 'user' | 'system';
  created_at: string;
}

export interface GameLog {
  id: string;
  room_id: string;
  player_id: string | null;
  action_type: string;
  action_data: any;
  created_at: string;
}

export interface ChatUser {
  id: string;
  username: string | null;
  email: string | null;
}
