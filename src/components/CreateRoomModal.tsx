
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGameRooms } from '@/hooks/useGameRooms';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (roomId: string) => void;
}

const CreateRoomModal = ({ isOpen, onClose, onRoomCreated }: CreateRoomModalProps) => {
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('4');
  const [loading, setLoading] = useState(false);
  const { createRoom } = useGameRooms();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await createRoom(roomName, parseInt(maxPlayers));
      if (data && !error) {
        onRoomCreated(data.id);
        onClose();
        setRoomName('');
        setMaxPlayers('4');
      }
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create New Game Room</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="roomName" className="text-sm font-medium">
              Room Name (Optional)
            </Label>
            <Input
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name..."
              className="bg-slate-700 border-slate-600 text-white mt-1"
            />
          </div>
          <div>
            <Label htmlFor="maxPlayers" className="text-sm font-medium">
              Max Players
            </Label>
            <select
              id="maxPlayers"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              className="w-full mt-1 bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2"
            >
              <option value="2">2 Players</option>
              <option value="3">3 Players</option>
              <option value="4">4 Players</option>
              <option value="6">6 Players</option>
            </select>
          </div>
          <div className="flex space-x-2 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Room'}
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

export default CreateRoomModal;
