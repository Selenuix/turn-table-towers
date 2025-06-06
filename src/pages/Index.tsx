import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuthContext } from "@/hooks/useAuthContext";
import { useOptimizedGameRooms } from "@/hooks/useOptimizedGameRooms";
import { LobbyHeader } from "@/components/lobby/LobbyHeader";
import { RoomGrid } from "@/components/lobby/RoomGrid";
import { LobbyStats } from "@/components/lobby/LobbyStats";
import CreateRoomModal from "@/components/CreateRoomModal";
import JoinRoomModal from "@/components/JoinRoomModal";
import { GameRoom } from '@/features/game-room/types';
import { CreateGame } from '@/features/game-room/components/CreateGame';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuthContext();
  const { rooms, loading: roomsLoading, joinRoom } = useOptimizedGameRooms();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<GameRoom | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
    if (user) {
      setUsername(user.identities?.[0]?.identity_data?.username || user.email?.split('@')[0] || 'User');
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleRoomAction = async (roomCode: string, isInRoom: boolean) => {
    if (isInRoom) {
      navigate(`/room/${roomCode}`);
    } else {
      try {
        const { data, error } = await joinRoom(roomCode);
        if (error) throw error;
        if (data) {
          navigate(`/room/${data.id}`);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to join room",
          variant: "destructive",
        });
      }
    }
  };

  const handleRoomJoined = (roomCode: string) => {
    // This function is no longer needed as we handle navigation in handleRoomAction
    // Remove this function and its usage
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <LobbyHeader username={username} onSignOut={handleSignOut} />

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
              <Plus className="w-5 h-5 mr-2"/>
              Create New Game Room
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setIsJoinModalOpen(true)}
              className="border-purple-500 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 font-semibold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
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
            <RoomGrid
              rooms={rooms}
              currentUserId={user.id}
              onRoomAction={handleRoomAction}
            />
          )}
        </div>

        <LobbyStats rooms={rooms} />
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
