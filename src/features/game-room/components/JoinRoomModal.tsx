import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOptimizedGameRooms } from '@/hooks/useOptimizedGameRooms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface JoinRoomModalProps {
  onJoin?: (roomId: string) => void;
}

export const JoinRoomModal = ({ onJoin }: JoinRoomModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { joinRoom } = useOptimizedGameRooms();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a room code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await joinRoom(roomCode.trim());
      if (error) throw error;
      if (data) {
        setIsOpen(false);
        if (onJoin) {
          onJoin(data.id);
        } else {
          navigate(`/room/${data.id}`);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to join room",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Join Game</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Game</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="roomCode" className="text-sm font-medium">
              Room Code
            </label>
            <Input
              id="roomCode"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleJoinRoom}
            disabled={isLoading || !roomCode.trim()}
            className="w-full"
          >
            {isLoading ? 'Joining...' : 'Join Room'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 