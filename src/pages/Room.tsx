
import {useEffect, useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useToast} from '@/components/ui/use-toast';
import {useOptimizedGameRooms} from '@/hooks/useOptimizedGameRooms';
import {useAuthContext} from '@/hooks/useAuthContext';
import {RoomHeader} from '@/features/game-room/components/RoomHeader';
import {RoomContent} from '@/features/game-room/components/RoomContent';
import {ChatPanel} from '@/features/chat/components/ChatPanel';
import {GameRoom, Player} from '@/features/game-room/types';
import {supabase} from '@/integrations/supabase/client';
import {RoomStatusEnum} from "@/consts";

export default function Room() {
  const {id} = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {toast} = useToast();
  const {user, loading: authLoading} = useAuthContext();
  const {
    getRoom, getPlayers, startGame, leaveRoom,
  } = useOptimizedGameRooms();

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const subscriptionRef = useRef<any>(null);
  const channelNameRef = useRef<string>('');
  const isSubscribedRef = useRef<boolean>(false);
  const roomIdRef = useRef<string>('');
  const isMountedRef = useRef<boolean>(true);

  const cleanupSubscription = () => {
    if (subscriptionRef.current) {
      console.log('Cleaning up room subscription:', channelNameRef.current);
      try {
        supabase.removeChannel(subscriptionRef.current);
      } catch (error) {
        console.error('Error removing room channel:', error);
      }
      subscriptionRef.current = null;
      isSubscribedRef.current = false;
      channelNameRef.current = '';
    }
  };

  // Log game action helper
  const logGameAction = async (actionType: string, actionData?: any) => {
    if (!room || !user) return;

    try {
      await supabase.rpc('log_game_action', {
        p_room_id: room.id,
        p_player_id: user.id,
        p_action_type: actionType,
        p_action_data: actionData
      });
    } catch (error) {
      console.error('Error logging game action:', error);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    // First check if authentication is still loading
    if (authLoading) {
      return;
    }

    // If not logged in, redirect to auth page
    if (!user) {
      navigate('/auth', {replace: true});
      return;
    }

    // If logged in but no room ID, redirect to lobby
    if (!id) {
      navigate('/', {replace: true});
      return;
    }

    if (room && room.status === RoomStatusEnum.FINISHED) {
      navigate('/', {replace: true});
      return;
    }

    // Store room ID for cleanup reference
    roomIdRef.current = id;

    const loadRoom = async () => {
      try {
        const roomData = await getRoom(id);

        if (!roomData) {
          toast({
            title: 'Error', description: 'Room not found', variant: 'destructive',
          });
          navigate('/');
          return;
        }

        if (isMountedRef.current) {
          setRoom(roomData);

          const playersData = await getPlayers(roomData.player_ids);
          if (isMountedRef.current) {
            setPlayers(playersData);
          }
        }
      } catch (error) {
        console.error('Error loading room:', error);
        if (isMountedRef.current) {
          toast({
            title: 'Error', description: 'Failed to load room data', variant: 'destructive',
          });
          navigate('/');
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadRoom();

    // Clean up any existing subscription before creating a new one
    cleanupSubscription();

    // Set up real-time subscription with unique channel name including more randomness
    const channelName = `room_${id}_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    channelNameRef.current = channelName;

    console.log('Creating room subscription:', channelName);

    // Add a delay to ensure previous subscription is fully cleaned up
    const timeoutId = setTimeout(() => {
      if (!isMountedRef.current) return;

      const channel = supabase.channel(channelName);

      channel
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${id}`
        }, async (payload) => {
          if (!isMountedRef.current) return;

          console.log('Room update received:', payload.eventType);

          if (payload.eventType === 'DELETE') {
            toast({
              title: 'Room Closed', description: 'The room has been closed',
            });
            navigate('/');
            return;
          }

          const updatedRoom = payload.new as GameRoom;
          if (isMountedRef.current) {
            setRoom(updatedRoom);

            const playersData = await getPlayers(updatedRoom.player_ids);
            if (isMountedRef.current) {
              setPlayers(playersData);

              // If the current user is no longer in the room, navigate back to lobby
              if (!updatedRoom.player_ids.includes(user?.id || '')) {
                toast({
                  title: 'Left Room', description: 'You have left the room',
                });
                navigate('/');
              }
            }
          }
        })
        .subscribe((status) => {
          console.log('Room subscription status:', status);
          if (status === 'SUBSCRIBED') {
            isSubscribedRef.current = true;
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            isSubscribedRef.current = false;
          }
        });

      subscriptionRef.current = channel;
    }, 150);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timeoutId);
      cleanupSubscription();
    };
  }, [id, user?.id, authLoading, getRoom, getPlayers, toast, navigate]);

  const handleStartGame = async () => {
    if (!room) return;

    try {
      await startGame(room.id);
      await logGameAction('game_started');
      toast({
        title: 'Success', description: 'Game started!',
      });
    } catch (error) {
      console.error('Error starting game:', error);
      toast({
        title: 'Error', description: 'Failed to start game', variant: 'destructive',
      });
    }
  };

  const handleLeaveRoom = async () => {
    if (!room) return;

    try {
      await logGameAction('player_left');
      await leaveRoom(room.id);
      navigate('/');
    } catch (error) {
      console.error('Error leaving room:', error);
      toast({
        title: 'Error', description: 'Failed to leave room', variant: 'destructive',
      });
    }
  };

  const handleCopyInviteLink = () => {
    if (!room) return;

    const inviteLink = `${window.location.origin}/room/${room.room_code}`;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: 'Success', description: 'Invite link copied to clipboard!',
    });
  };

  if (authLoading || isLoading) {
    return (<div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>);
  }

  if (!user || !room) {
    return (<div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading room data...</div>
      </div>);
  }

  const isGameInProgress = room.status === 'in_progress';

  return (<div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        <RoomHeader
          room={room}
          onCopyRoomCode={handleCopyInviteLink}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <RoomContent
              room={room}
              players={players}
              currentUserId={user.id}
              isGameInProgress={isGameInProgress}
              onStartGame={handleStartGame}
              onLeaveRoom={handleLeaveRoom}
              onCopyInviteLink={handleCopyInviteLink}
            />
          </div>
          
          <div className="lg:col-span-1">
            <ChatPanel
              roomId={room.id}
              currentUserId={user.id}
              players={players}
            />
          </div>
        </div>
      </div>
    </div>);
}
