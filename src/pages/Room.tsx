
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useGameRooms } from '@/hooks/useGameRooms';
import { supabase } from '@/integrations/supabase/client';
import { Users, Crown, Copy, LogOut, Play, Settings, Shuffle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Room = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinRoom, leaveRoom } = useGameRooms();
  const { toast } = useToast();
  const [room, setRoom] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoom = async () => {
    if (!id) return;

    try {
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', id)
        .single();

      if (roomError) throw roomError;
      setRoom(roomData);

      // Fetch player profiles
      if (roomData.player_ids.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', roomData.player_ids);

        if (profilesError) throw profilesError;
        setPlayers(profilesData || []);
      }
    } catch (error: any) {
      console.error('Error fetching room:', error);
      toast({
        title: "Error",
        description: "Room not found",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!id) return;
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
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchRoom();

    // Use a consistent channel name based on room ID and user ID
    const channelName = `room_${id}_${user.id}`;
    
    // Set up real-time subscription for this specific room
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${id}` },
        () => {
          console.log('Room updated, refetching...');
          fetchRoom();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up room subscription');
      supabase.removeChannel(subscription);
    };
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Room not found</div>
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
              ← Back to Lobby
            </Button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {room.name || `Room ${room.room_code}`}
            </h1>
            <div className="flex items-center space-x-2">
              <Badge className="bg-slate-700 text-slate-300">
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
          {/* Room Status */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Room Status
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge 
                    className={
                      room.status === 'waiting' 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }
                  >
                    {room.status === 'waiting' ? 'Waiting for Players' : 'Game in Progress'}
                  </Badge>
                  {isOwner && room.status === 'waiting' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-slate-300 space-y-3">
                <div className="flex justify-between">
                  <span>Players:</span>
                  <span className="font-bold">{room.player_ids.length}/{room.max_players}</span>
                </div>
                <div className="flex justify-between">
                  <span>Room Code:</span>
                  <span className="font-mono font-bold">{room.room_code}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{new Date(room.created_at).toLocaleString()}</span>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button
                    onClick={copyInviteLink}
                    variant="outline"
                    className="border-slate-600 text-white hover:bg-slate-700"
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
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                        {player.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-white font-medium">
                        {player.username || player.email}
                      </span>
                      {player.id === room.owner_id && (
                        <Crown className="w-4 h-4 ml-2 text-yellow-400" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {player.id === user?.id && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          You
                        </Badge>
                      )}
                      {isGameInProgress && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          Ready
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Empty slots */}
                {Array.from({ length: room.max_players - players.length }, (_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="flex items-center p-3 bg-slate-700/10 rounded-lg border-2 border-dashed border-slate-600"
                  >
                    <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-slate-400 mr-3">
                      ?
                    </div>
                    <span className="text-slate-400">Waiting for player...</span>
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
              <CardContent className="p-4">
                <div className="text-center text-blue-300">
                  {room.player_ids.length < 2 ? (
                    <p>Waiting for at least 2 players to start the game...</p>
                  ) : isOwner ? (
                    <p>Ready to start! Click "Start Game" when everyone is ready.</p>
                  ) : (
                    <p>Waiting for room owner to start the game...</p>
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
