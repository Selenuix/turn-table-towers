-- Create function to join a game room
CREATE OR REPLACE FUNCTION join_game_room(
  p_room_id UUID,
  p_current_player_ids TEXT[],
  p_new_player_ids TEXT[]
)
RETURNS game_rooms
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room game_rooms;
BEGIN
  -- Update the room with optimistic locking
  UPDATE game_rooms
  SET 
    player_ids = p_new_player_ids,
    updated_at = NOW()
  WHERE 
    id = p_room_id 
    AND player_ids = p_current_player_ids
  RETURNING * INTO v_room;

  -- If no row was updated, it means the player_ids changed concurrently
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'PGRST116' USING MESSAGE = 'Concurrent update detected';
  END IF;

  RETURN v_room;
END;
$$;

-- Create function to leave a game room
CREATE OR REPLACE FUNCTION leave_game_room(
  p_room_id UUID,
  p_current_player_ids TEXT[],
  p_new_player_ids TEXT[],
  p_new_owner_id UUID
)
RETURNS game_rooms
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room game_rooms;
BEGIN
  -- Update the room with optimistic locking
  UPDATE game_rooms
  SET 
    player_ids = p_new_player_ids,
    owner_id = p_new_owner_id,
    updated_at = NOW()
  WHERE 
    id = p_room_id 
    AND player_ids = p_current_player_ids
  RETURNING * INTO v_room;

  -- If no row was updated, it means the player_ids changed concurrently
  IF v_room IS NULL THEN
    RAISE EXCEPTION 'PGRST116' USING MESSAGE = 'Concurrent update detected';
  END IF;

  RETURN v_room;
END;
$$; 