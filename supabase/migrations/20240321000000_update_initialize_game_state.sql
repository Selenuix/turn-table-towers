CREATE OR REPLACE FUNCTION initialize_game_state(p_room_id UUID)
RETURNS game_states
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room game_rooms;
  v_game_state game_states;
  v_player_ids UUID[];
  v_deck card[];
  v_player_states JSONB;
  v_player_id UUID;
  v_player_hand card[];
  v_empty_card_array card[] := ARRAY[]::card[];
  v_cards_dealt INTEGER;
BEGIN
  -- Get room information
  SELECT * INTO v_room
  FROM game_rooms
  WHERE id = p_room_id;

  IF v_room IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- Initialize deck with all 52 cards
  WITH suits AS (
    SELECT unnest(ARRAY['hearts', 'diamonds', 'clubs', 'spades']) as suit
  ),
  ranks AS (
    SELECT unnest(ARRAY['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king']) as rank
  )
  SELECT array_agg(ROW(s.suit, r.rank)::card ORDER BY random())
  INTO v_deck
  FROM suits s
  CROSS JOIN ranks r;

  -- Initialize player states
  v_player_states := '{}'::jsonb;
  v_player_ids := v_room.player_ids;
  v_cards_dealt := 0;

  -- Deal cards to each player
  FOREACH v_player_id IN ARRAY v_player_ids
  LOOP
    -- Deal 4 cards to each player
    v_player_hand := ARRAY(
      SELECT v_deck[i]
      FROM generate_series(v_cards_dealt + 1, v_cards_dealt + 4) i
    );
    
    -- Update cards dealt counter
    v_cards_dealt := v_cards_dealt + 4;

    -- Initialize player state
    v_player_states := v_player_states || jsonb_build_object(
      v_player_id::text,
      jsonb_build_object(
        'hand', v_player_hand,
        'shield', null,
        'hp_cards', null,
        'stored_cards', '[]'::jsonb,
        'hp', 0,
        'setup_complete', false
      )
    );
  END LOOP;

  -- Remove dealt cards from deck
  v_deck := v_deck[v_cards_dealt + 1:array_length(v_deck, 1)];

  -- Create game state
  INSERT INTO game_states (
    room_id,
    current_player_id,
    deck,
    discard_pile,
    player_states
  ) VALUES (
    p_room_id,
    v_player_ids[1], -- First player starts
    v_deck,
    v_empty_card_array,
    v_player_states
  )
  RETURNING * INTO v_game_state;

  RETURN v_game_state;
END;
$$; 