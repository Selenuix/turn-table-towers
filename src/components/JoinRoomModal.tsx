
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGameRooms } from '@/hooks/useGameRooms';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomJoined: (roomId: string) => void;
}

const JoinRoomModal = ({ isOpen, onClose, onRoomJoined }: JoinRoomModalProps) => {
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { joinRoomByCode } = useGameRooms();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await joinRoomByCode(roomCode);
      if (data && !error) {
        onRoomJoined(data.id);
        onClose();
        setRoomCode('');
      }
    } catch (error) {
      console.error('Error joining room:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Join Game Room</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="roomCode" className="text-sm font-medium">
              Room Code
            </Label>
            <Input
              id="roomCode"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character room code..."
              className="bg-slate-700 border-slate-600 text-white mt-1"
              maxLength={6}
              required
            />
          </div>
          <div className="flex space-x-2 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              disabled={loading || roomCode.length !== 6}
            >
              {loading ? 'Joining...' : 'Join Room'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-600 text-white hover:bg-slate-700"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JoinRoomModal;
