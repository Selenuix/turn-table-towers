import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGameRooms } from '@/hooks/useGameRooms';
import { X } from 'lucide-react';

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
    if (!roomCode.trim()) return;

    setLoading(true);

    try {
      const { data, error } = await joinRoomByCode(roomCode.trim());
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Join Room</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="roomCode" className="text-slate-300">
                Room Code
              </Label>
              <Input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="bg-slate-700 border-slate-600 text-white font-mono"
                placeholder="Enter 6-character room code"
                maxLength={6}
                required
              />
            </div>
            <div className="flex space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-purple-500 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 font-semibold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                disabled={loading || roomCode.length !== 6}
              >
                {loading ? 'Joining...' : 'Join Room'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinRoomModal;
