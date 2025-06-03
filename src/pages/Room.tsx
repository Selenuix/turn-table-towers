import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useGameRooms, GameRoom } from '@/hooks/useGameRooms';
import { supabase } from '@/integrations/supabase/client';
import { Users, Crown, Copy, LogOut, Play, Settings, Shuffle, ArrowLeft, Clock, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Room = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { joinRoom, leaveRoom } = useGameRooms();
  const { toast } = useToast();
  const [room, setRoom] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const subscriptionRef = useRef<any>(null);

  const fetchRoom = async () => {
    if (!id) {
      console.log('No room ID provided');
      navigate('/');
      return;
    }

    try {
      console.log('Fetching room data for ID:', id);
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', id)
        .single();

      if (roomError) {
        console.error('Room fetch error:', roomError);
        throw roomError;
      }
      
      console.log('Room data fetched:', roomData);
      setRoom(roomData);

      // Fetch player profiles
      if (roomData.player_ids.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', roomData.player_ids);

        if (profilesError) {
          console.error('Profiles fetch error:', profilesError);
        }
        
        console.log('Players data fetched:', profilesData);
        setPlayers(profilesData || []);
      } else {
        setPlayers([]);
      }
    } catch (error: any) {
      console.error('Error fetching room:', error);
      toast({
        title: "Error",
        description: "Room not found or could not be loaded",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!id) return;
    console.log('Attempting to join room from room page');
    const { data } = await joinRoom(id);
    if (data) {
      await fetchRoom();
    }
  };

  const handleLeaveRoom = async () => {
    if (!id) return;
    const { error } = await leaveRoom(id);
    if (!error) {
      navigate('/');
    }
  };

  const handleStartGame = async () => {
    if (!room || !isOwner) return;

    try {
      console.log('Starting game for room:', room.id);
      const { error } = await supabase
        .from('game_rooms')
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', room.id);

      if (error) throw error;

      toast({
        title: "Game Started!",
        description: "The game has begun. Good luck!",
      });
    } catch (error) {
      console.error('Error starting game:', error);
      toast({
        title: "Error",
        description: "Failed to start game",
        variant: "destructive",
      });
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/room/${id}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard",
    });
  };

  const copyRoomCode = () => {
    if (room?.room_code) {
      navigator.clipboard.writeText(room.room_code);
      toast({
        title: "Copied!",
        description: "Room code copied to clipboard",
      });
    }
  };

  useEffect(() => {
    if (!id || !user?.id) return;

    fetchRoom();

    // Create a unique channel name with user ID and timestamp
    const channelName = `room_${id}_${user.id}_${Date.now()}`;

    console.log('Setting up room subscription with channel:', channelName);

    // Set up real-time subscription for this specific room
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${id}` },
        async (payload) => {
          console.log('Room updated:', payload);
          
          // If it's a DELETE event, navigate back to lobby
          if (payload.eventType === 'DELETE') {
            toast({
              title: "Room Closed",
              description: "The room has been closed",
            });
            navigate('/');
            return;
          }

          // Update room data immediately
          const updatedRoom = payload.new as GameRoom;
          setRoom(updatedRoom);
          
          // Immediately update players list
          if (updatedRoom.player_ids.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('*')
              .in('id', updatedRoom.player_ids);

            if (profilesError) {
              console.error('Profiles fetch error:', profilesError);
            } else {
              console.log('Players data updated:', profilesData);
              setPlayers(profilesData || []);
            }
          } else {
            setPlayers([]);
          }

          // If the current user is no longer in the room, navigate back to lobby
          if (!updatedRoom.player_ids.includes(user.id)) {
            toast({
              title: "Left Room",
              description: "You have left the room",
            });
            navigate('/');
          }
        }
      )
      .subscribe((status) => {
        console.log('Room subscription status:', status);
      });

    // Also subscribe to profile changes for players in the room
    const profileSubscription = supabase
      .channel(`${channelName}_profiles`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        async (payload: { new: { id: string } }) => {
          // Only update if the changed profile belongs to a player in the current room
          if (room?.player_ids.includes(payload.new.id)) {
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('*')
              .in('id', room.player_ids);

            if (!profilesError && profilesData) {
              setPlayers(profilesData);
            }
          }
        }
      )
      .subscribe();

    subscriptionRef.current = { room: subscription, profiles: profileSubscription };

    return () => {
      if (subscriptionRef.current) {
        console.log('Cleaning up room subscriptions:', channelName);
        supabase.removeChannel(subscriptionRef.current.room);
        supabase.removeChannel(subscriptionRef.current.profiles);
        subscriptionRef.current = null;
      }
    };
  }, [id, user?.id]);

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800/50 border-slate-700 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Room Not Found</h1>
            <p className="text-slate-300 mb-6">The room you're looking for doesn't exist or has been deleted.</p>
            <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lobby
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isOwner = user?.id === room.owner_id;
  const isPlayerInRoom = room.player_ids.includes(user?.id);
  const canStartGame = isOwner && room.player_ids.length >= 2 && room.status === 'waiting';
  const isGameInProgress = room.status === 'in_progress';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-slate-300 hover:text-white hover:bg-slate-700/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lobby
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {room.name || `Room ${room.room_code}`}
              </h1>
              <p className="text-sm text-slate-400">
                {isGameInProgress ? 'Game in Progress' : 'Waiting for Players'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-slate-700 text-slate-300 font-mono">
                {room.room_code}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyRoomCode}
                className="text-slate-300 hover:text-white"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Room Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 mx-auto text-blue-400 mb-2" />
                <div className="text-2xl font-bold text-white">{room.player_ids.length}</div>
                <div className="text-sm text-slate-300">of {room.max_players} players</div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <Trophy className="w-8 h-8 mx-auto text-yellow-400 mb-2" />
                <div className="text-lg font-bold text-white">Standard</div>
                <div className="text-sm text-slate-300">Game Mode</div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <Clock className="w-8 h-8 mx-auto text-green-400 mb-2" />
                <div className="text-lg font-bold text-white">
                  {Math.floor((Date.now() - new Date(room.created_at).getTime()) / 60000)}m
                </div>
                <div className="text-sm text-slate-300">Room Age</div>
              </CardContent>
            </Card>
          </div>

          {/* Room Status */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Room Information
                </CardTitle>
                <Badge 
                  className={
                    room.status === 'waiting' 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  }
                >
                  {room.status === 'waiting' ? 'Waiting for Players' : 'Game in Progress'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Room Code:</span>
                    <span className="font-mono font-bold text-blue-400">{room.room_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{new Date(room.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Owner:</span>
                    <span className="text-yellow-400">
                      {players.find(p => p.id === room.owner_id)?.username || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Players:</span>
                    <span>{room.max_players}</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2 mt-6">
                <Button
                  onClick={copyInviteLink}
                  variant="outline"
                  className="border-purple-500 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 font-semibold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Invite Link
                </Button>
                {isGameInProgress && (
                  <Button
                    variant="outline"
                    className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    View Game
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Players List */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Players ({players.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {players
                  .sort((a, b) => {
                    // Room owner always comes first
                    if (a.id === room.owner_id) return -1;
                    if (b.id === room.owner_id) return 1;
                    // Then sort by username/email
                    const aName = a.username || a.email || '';
                    const bName = b.username || b.email || '';
                    return aName.localeCompare(bName);
                  })
                  .map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/20"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        {player.username?.[0]?.toUpperCase() || player.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center">
                          <span className="text-white font-medium mr-2">
                            {player.username || player.email?.split('@')[0] || 'Anonymous'}
                          </span>
                          {player.id === room.owner_id && (
                            <Crown className="w-4 h-4 text-yellow-400" />
                          )}
                        </div>
                        <div className="text-sm text-slate-400">
                          {player.id === room.owner_id ? 'Room Owner' : 'Player'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {player.id === user?.id && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          You
                        </Badge>
                      )}
                      {isGameInProgress && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          In Game
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Empty slots */}
                {Array.from({ length: room.max_players - players.length }, (_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="flex items-center p-4 bg-slate-700/10 rounded-lg border-2 border-dashed border-slate-600"
                  >
                    <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-slate-400 mr-3">
                      ?
                    </div>
                    <div>
                      <div className="text-slate-400">Waiting for player...</div>
                      <div className="text-xs text-slate-500">Share the room code to invite friends</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            {!isPlayerInRoom ? (
              <Button
                onClick={handleJoinRoom}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                disabled={room.player_ids.length >= room.max_players || room.status !== 'waiting'}
              >
                <Users className="w-4 h-4 mr-2" />
                {room.player_ids.length >= room.max_players ? 'Room Full' : 'Join Game'}
              </Button>
            ) : (
              <div className="flex space-x-4">
                {canStartGame && (
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={handleStartGame}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Game
                  </Button>
                )}
                
                {isGameInProgress && (
                  <Button
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    onClick={() => {
                      toast({
                        title: "Game Active",
                        description: "Game functionality will be implemented next!",
                      });
                    }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Continue Game
                  </Button>
                )}
                
                <Button
                  onClick={handleLeaveRoom}
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Leave Room
                </Button>
              </div>
            )}
          </div>

          {/* Game Requirements */}
          {isPlayerInRoom && room.status === 'waiting' && (
            <Card className="bg-blue-500/10 border-blue-500/30">
              <CardContent className="p-6">
                <div className="text-center text-blue-300">
                  {room.player_ids.length < 2 ? (
                    <div>
                      <h3 className="font-semibold mb-2">Need More Players</h3>
                      <p>Waiting for at least 2 players to start the game. Share the room code <span className="font-mono bg-blue-500/20 px-2 py-1 rounded">{room.room_code}</span> with your friends!</p>
                    </div>
                  ) : isOwner ? (
                    <div>
                      <h3 className="font-semibold mb-2">Ready to Start!</h3>
                      <p>All players are ready. Click "Start Game" when everyone is prepared.</p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-semibold mb-2">Waiting for Host</h3>
                      <p>Waiting for the room owner to start the game...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Room;
