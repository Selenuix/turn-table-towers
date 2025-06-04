
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

export interface Card {
  suit: CardSuit;
  rank: CardRank;
}

export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardRank = 'ace' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'jack' | 'queen' | 'king';

export interface GameState {
  id: string;
  room_id: string;
  current_player_id: string | null;
  deck: Card[];
  discard_pile: Card[];
  player_states: Record<string, PlayerState>;
  created_at: string;
  updated_at: string;
}

export interface PlayerState {
  hand: Card[];
  shield: Card | null;
  hp_cards: Card[] | null;
  stored_cards: Card[];
  hp: number;
  setup_complete: boolean;
}

export interface GameAction {
  type: string;
  player_id: string;
  target_player_id?: string;
  cards?: Card[];
  card_indices?: number[];
}
