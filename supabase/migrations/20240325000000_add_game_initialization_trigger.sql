-- Create trigger function to initialize game state
CREATE OR REPLACE FUNCTION initialize_game_state_on_room_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Initialize game state for the new room
  PERFORM initialize_game_state(NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger to automatically initialize game state when a room is created
DROP TRIGGER IF EXISTS initialize_game_state_trigger ON game_rooms;
CREATE TRIGGER initialize_game_state_trigger
  AFTER INSERT ON game_rooms
  FOR EACH ROW
  EXECUTE FUNCTION initialize_game_state_on_room_create();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION initialize_game_state_on_room_create TO authenticated; 