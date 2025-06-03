import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useGameRooms } from '@/hooks/useGameRooms';
import { RoomHeader } from '@/features/game-room/components/RoomHeader';
import { RoomInfo } from '@/features/game-room/components/RoomInfo';
import { RoomActions } from '@/features/game-room/components/RoomActions';
import { PlayerList } from '@/features/game-room/components/PlayerList';
import { GameRoom, Player } from '@/features/game-room/types';
import { supabase } from '@/integrations/supabase/client';

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    getRoom, 
    getPlayers, 
    startGame, 
    leaveRoom,
    currentUser 
  } = useGameRooms();

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {

    const loadRoom = async () => {
      if (!id) {
        console.log('No id provided');
        return;
      }
      
      try {
        console.log('Fetching room data for ID:', id);
        const roomData = await getRoom(id);
        console.log('Room data received:', roomData);

        if (!roomData) {
          console.log('Room not found');
          toast({
            title: 'Error',
            description: 'Room not found',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        setRoom(roomData);
        
        console.log('Fetching players for room:', roomData.player_ids);
        const playersData = await getPlayers(roomData.player_ids);
        console.log('Players data received:', playersData);
        setPlayers(playersData);
      } catch (error) {
        console.error('Error loading room:', error);
        toast({
          title: 'Error',
          description: 'Failed to load room data',
          variant: 'destructive',
        });
      } finally {
        console.log('Setting loading to false');
        setIsLoading(false);
      }
    };

    loadRoom();

    // Set up real-time subscription
    if (id) {
      const channelName = `room_${id}_${Date.now()}`;
      
      const subscription = supabase
        .channel(channelName)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${id}` },
          async (payload) => {
            if (payload.eventType === 'DELETE') {
              toast({
                title: 'Room Closed',
                description: 'The room has been closed',
              });
              navigate('/');
              return;
            }

            const updatedRoom = payload.new as GameRoom;
            setRoom(updatedRoom);
            
            const playersData = await getPlayers(updatedRoom.player_ids);
            setPlayers(playersData);

            // If the current user is no longer in the room, navigate back to lobby
            if (!updatedRoom.player_ids.includes(currentUser?.id || '')) {
              toast({
                title: 'Left Room',
                description: 'You have left the room',
              });
              navigate('/');
            }
          }
        )
        .subscribe();

      subscriptionRef.current = subscription;

      return () => {
        if (subscriptionRef.current) {
          supabase.removeChannel(subscriptionRef.current);
          subscriptionRef.current = null;
        }
      };
    }
  }, [id, getRoom, getPlayers, toast, navigate, currentUser?.id]);

  const handleStartGame = async () => {
    if (!room) return;
    
    try {
      await startGame(room.id);
      toast({
        title: 'Success',
        description: 'Game started!',
      });
    } catch (error) {
      console.error('Error starting game:', error);
      toast({
        title: 'Error',
        description: 'Failed to start game',
        variant: 'destructive',
      });
    }
  };

  const handleLeaveRoom = async () => {
    if (!room) return;
    
    try {
      await leaveRoom(room.id);
      navigate('/');
    } catch (error) {
      console.error('Error leaving room:', error);
      toast({
        title: 'Error',
        description: 'Failed to leave room',
        variant: 'destructive',
      });
    }
  };

  const handleCopyInviteLink = () => {
    if (!room) return;
    
    const inviteLink = `${window.location.origin}/room/${room.room_code}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Success',
      description: 'Invite link copied to clipboard!',
    });
  };

  if (isLoading || !room) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const isGameInProgress = room.status === 'in_progress';

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <RoomHeader 
          room={room} 
          onCopyRoomCode={handleCopyInviteLink} 
        />
        
        <div className="mt-8 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RoomInfo 
              room={room}
              players={players}
              isGameInProgress={isGameInProgress}
              onCopyInviteLink={handleCopyInviteLink}
            />
            <RoomActions 
              room={room}
              currentUserId={currentUser?.id || ''}
              onStartGame={handleStartGame}
              onLeaveRoom={handleLeaveRoom}
            />
          </div>
          
          <div className="lg:col-span-1">
            <PlayerList 
              room={room}
              players={players}
              currentUserId={currentUser?.id || ''}
              isGameInProgress={isGameInProgress}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
