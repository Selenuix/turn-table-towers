import {useEffect, useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {useToast} from '@/components/ui/use-toast';
import {useOptimizedGameRooms} from '@/hooks/useOptimizedGameRooms';
import {useAuth} from '@/hooks/useAuth';
import {RoomContent} from '@/features/game-room/components/RoomContent';
import {ChatSidebar} from '@/features/chat/components/ChatSidebar';
import {GameRoom, Player} from '@/features/game-room/types';
import {supabase} from '@/integrations/supabase/client';
import {RoomStatusEnum} from "@/consts";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Rules} from '@/features/game-room/components/Rules';
import {useRulesPreference} from '@/hooks/useRulesPreference';
import {GameOver} from '@/features/game-room/components/GameOver';
import {LobbyHeader} from '@/components/lobby/LobbyHeader';
import {Button} from '@/components/ui/button';
import {ErrorBoundary} from '@/components/ErrorBoundary';
import {useSubscription} from '@/providers/SubscriptionProvider';

export default function Room() {
  const {id: roomCode} = useParams<{id: string}>();
  const navigate = useNavigate();
  const {toast} = useToast();
  const {user, loading: authLoading, signOut} = useAuth();
  const {
    getRoom, getPlayers, startGame, leaveRoom, joinRoom,
  } = useOptimizedGameRooms();
  const {shouldShowRules, loading: rulesLoading, updatePreference} = useRulesPreference();
  const {setupSubscription, cleanupSubscription} = useSubscription();

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
  const isMountedRef = useRef<boolean>(true);
  const hasShownRulesRef = useRef<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionActiveRef = useRef<boolean>(false);

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

  const checkGameOver = async () => {
    try {
      const { data: gameState } = await supabase
        .from('game_states')
        .select('player_states')
        .eq('room_id', roomCode)
        .single();

      if (!gameState) return;

      const activePlayers = Object.entries(gameState.player_states)
        .filter(([_, state]) => !state.eliminated)
        .length;

      if (activePlayers === 1) {
        const { error: updateError } = await supabase
          .from('game_rooms')
          .update({ status: 'finished' })
          .eq('id', roomCode);

        if (updateError) {
          console.error('Error updating room status:', updateError);
        }
      }
    } catch (error) {
      console.error('Error checking game over:', error);
    }
  };

  useEffect(() => {
    const initializeRoom = async () => {
      if (!roomCode || !user || authLoading || rulesLoading) return;

      try {
        const roomData = await getRoom(roomCode);
        if (!roomData) {
          setError('Room not found');
          return;
        }

        setRoom(roomData);

        const playersData = await getPlayers(roomData.player_ids);
        setPlayers(playersData);

        if (!hasShownRulesRef.current && shouldShowRules && roomData.status === 'waiting') {
          setShowRules(true);
          hasShownRulesRef.current = true;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing room:', error);
        setError('Failed to load room');
      }
    };

    initializeRoom();
  }, [roomCode, user, authLoading, rulesLoading, shouldShowRules]);

  useEffect(() => {
    isMountedRef.current = true;

    if (authLoading) {
      return;
    }

    if (!user) {
      navigate('/auth', {replace: true});
      return;
    }

    if (!roomCode) {
      navigate('/', {replace: true});
      return;
    }

    checkGameOver();

    // Set up real-time subscription
    if (!subscriptionActiveRef.current) {
      subscriptionActiveRef.current = true;
      const channelName = `room_${roomCode}_${user.id}_${Date.now()}`;

      console.log('Creating room subscription:', channelName);

      setupSubscription(channelName, async (payload) => {
        if (!isMountedRef.current) return;

        console.log('Room update received:', payload.eventType, payload);

        if (payload.eventType === 'DELETE') {
          toast({
            title: 'Room Closed', 
            description: 'The room has been closed',
          });
          navigate('/');
          return;
        }

        const updatedRoom = payload.new as GameRoom;
        
        if (isMountedRef.current && updatedRoom && updatedRoom.id) {
          setRoom(updatedRoom);

          const playersData = await getPlayers(updatedRoom.player_ids);
          if (isMountedRef.current) {
            setPlayers(playersData);
            await checkGameOver();

            if (room && updatedRoom.player_ids.length > room.player_ids.length) {
              const newPlayerIds = updatedRoom.player_ids.filter(id => !room.player_ids.includes(id));
              for (const newPlayerId of newPlayerIds) {
                await logGameAction('player_joined', { playerId: newPlayerId });
              }
            }

            if (!updatedRoom.player_ids.includes(user.id)) {
              toast({
                title: 'Removed from Room',
                description: 'You have been removed from the room',
              });
              navigate('/');
            }
          }
        }
      });
    }

    return () => {
      isMountedRef.current = false;
      subscriptionActiveRef.current = false;
      cleanupSubscription();
    };
  }, [roomCode, user, authLoading]);

  const handleStartGame = async () => {
    if (!room) return;

    try {
      const { error } = await startGame(room.id);
      if (error) throw error;
      setRoom(prev => prev ? { ...prev, status: RoomStatusEnum.IN_PROGRESS } : null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start game",
        variant: "destructive",
      });
    }
  };

  const handleLeaveRoom = async () => {
    if (!room) return;

    try {
      const { error } = await leaveRoom(room.id);
      if (error) throw error;
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to leave room",
        variant: "destructive",
      });
    }
  };

  const handleCopyInviteLink = () => {
    if (!room) return;

    navigator.clipboard.writeText(room.room_code);
    toast({
      title: 'Success',
      description: 'Room code copied to clipboard!',
    });
  };

  const handleDoNotShowAgainChange = (checked: boolean) => {
    setDoNotShowAgain(checked);
  };

  const handleCloseRules = async () => {
    if (doNotShowAgain) {
      await updatePreference(false);
    }
    setShowRules(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading || isLoading || !room || !user) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  const isGameInProgress = room.status === RoomStatusEnum.IN_PROGRESS;
  const isGameFinished = room.status === RoomStatusEnum.FINISHED;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <LobbyHeader username={user?.email || ''} onSignOut={signOut} />
        
        <div className="container mx-auto px-4 py-8">
          {error ? (
            <div className="text-center text-red-500">
              <h2 className="text-2xl font-bold mb-4">{error}</h2>
              <Button onClick={() => navigate('/')}>Return to Lobby</Button>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : room && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8">
              <div className="lg:col-span-3 order-2 lg:order-1">
                {room.status === 'finished' ? (
                  <GameOver
                    players={players}
                    currentUserId={user?.id || ''}
                    roomId={roomCode}
                  />
                ) : (
                  <RoomContent
                    room={room}
                    players={players}
                    currentUserId={user?.id || ''}
                    isGameInProgress={room.status === 'in_progress'}
                    onStartGame={handleStartGame}
                    onLeaveRoom={handleLeaveRoom}
                    onCopyInviteLink={handleCopyInviteLink}
                  />
                )}
              </div>
              <div className="lg:col-span-1 order-1 lg:order-2">
                <div className="sticky top-4">
                  <ChatSidebar roomId={roomCode} />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {shouldShowRules && (
          <Dialog open={showRules} onOpenChange={setShowRules}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center text-white mb-4">
                  How to Play
                </DialogTitle>
              </DialogHeader>
              <Rules 
                onClose={handleCloseRules}
                showDoNotShowAgain={true}
                onDoNotShowAgainChange={handleDoNotShowAgainChange}
                doNotShowAgain={doNotShowAgain}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ErrorBoundary>
  );
}
