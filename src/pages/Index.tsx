
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Trophy, Plus, LogOut, User, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGameRooms } from "@/hooks/useGameRooms";
import CreateRoomModal from "@/components/CreateRoomModal";
import JoinRoomModal from "@/components/JoinRoomModal";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { rooms, loading: roomsLoading, joinRoom } = useGameRooms();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleJoinRoom = async (roomId: string) => {
    const { data } = await joinRoom(roomId);
    if (data) {
      navigate(`/room/${roomId}`);
    }
  };

  const handleEnterRoom = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  const handleRoomJoined = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  function getStatusColor(status: string) {
    switch (status) {
      case "waiting":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "in_progress":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                CardMaster Arena
              </h1>
              <nav className="hidden md:flex space-x-6">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-700/50">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-700/50">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-slate-300 hidden sm:block">
                Welcome, {user?.email?.split('@')[0]}
              </span>
              <Button 
                variant="ghost" 
                onClick={handleSignOut}
                className="text-slate-300 hover:text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Welcome to the Arena
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join a game room or create your own multiplayer card battle
          </p>
          
          <div className="flex justify-center space-x-4">
            <Button 
              size="lg" 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Game Room
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setIsJoinModalOpen(true)}
              className="border-slate-600 text-white hover:bg-slate-700 font-semibold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Join with Code
            </Button>
          </div>
        </div>

        {/* Game Rooms Grid */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">Active Game Rooms</h3>
          {roomsLoading ? (
            <div className="text-center text-slate-300">Loading rooms...</div>
          ) : rooms.length === 0 ? (
            <div className="text-center text-slate-300">
              <p className="text-lg mb-4">No active rooms yet</p>
              <p>Be the first to create a game room!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <Card key={room.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold text-white truncate">
                        {room.name || `Room ${room.room_code}`}
                      </CardTitle>
                      <Badge className={`${getStatusColor(room.status)} border`}>
                        {room.status === "waiting" ? "Open" : "Playing"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-slate-300">
                        <Users className="w-4 h-4 mr-2" />
                        <span className="text-sm">
                          {room.player_ids.length}/{room.max_players} players
                        </span>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                        {room.room_code}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center text-slate-300">
                      <Trophy className="w-4 h-4 mr-2" />
                      <span className="text-sm">Standard Game</span>
                    </div>
                    
                    <div className="flex items-center text-slate-300">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="text-sm">Created {new Date(room.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium"
                        disabled={room.status === "in_progress" || room.player_ids.length >= room.max_players}
                        onClick={() => {
                          if (room.player_ids.includes(user?.id || '')) {
                            handleEnterRoom(room.id);
                          } else {
                            handleJoinRoom(room.id);
                          }
                        }}
                      >
                        {room.status === "in_progress" 
                          ? "Game in Progress" 
                          : room.player_ids.length >= room.max_players 
                          ? "Room Full" 
                          : room.player_ids.includes(user?.id || '') 
                          ? "Enter Room"
                          : "Join Game"
                        }
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {rooms.length}
              </div>
              <div className="text-slate-300">Active Rooms</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {rooms.reduce((acc, room) => acc + room.player_ids.length, 0)}
              </div>
              <div className="text-slate-300">Players Online</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {rooms.filter(room => room.status === "waiting").length}
              </div>
              <div className="text-slate-300">Open Games</div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <JoinRoomModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onRoomJoined={handleRoomJoined}
      />
    </div>
  );
};

export default Index;
