
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoomManager } from '@/hooks/useRoomManager';
import { RoomHeader } from '@/features/game-room/components/RoomHeader';
import { RoomContent } from '@/features/game-room/components/RoomContent';
import { GameRoom, Player } from '@/features/game-room/types';
import { useAuthContext } from '@/hooks/useAuthContext';
import { supabase } from '@/integrations/supabase/client';

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { getRoom, getPlayers } = useRoomManager();
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!roomId || !user) return;

    const fetchRoomData = async () => {
      try {
        const roomData = await getRoom(roomId);
        if (!roomData) {
          setError('Room not found');
          return;
        }

        setRoom(roomData);

        const playersData = await getPlayers(roomData.player_ids);
        setPlayers(playersData);
      } catch (err) {
        console.error('Error fetching room data:', err);
        setError('Failed to load room');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();

    // Set up real-time subscription for this specific room
    const roomSubscription = supabase
      .channel(`room_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${roomId}`
        },
        async (payload) => {
          console.log('Room update received:', payload);
          
          if (payload.eventType === 'DELETE') {
            setError('Room has been deleted');
            setTimeout(() => navigate('/'), 2000);
            return;
          }

          // Refetch room data on any change
          await fetchRoomData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomSubscription);
    };
  }, [roomId, user, authLoading, navigate, getRoom, getPlayers]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Return to lobby
          </button>
        </div>
      </div>
    );
  }

  if (!room || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <RoomHeader room={room} players={players} currentUserId={user.id} />
      <RoomContent room={room} players={players} currentUserId={user.id} />
    </div>
  );
};

export default Room;
