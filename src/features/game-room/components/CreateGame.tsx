import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/hooks/useAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useOptimizedGameRooms } from '@/hooks/useOptimizedGameRooms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Rules } from './Rules';
import { useRulesPreference } from '@/hooks/useRulesPreference';

export const CreateGame: React.FC = () => {
  const [gameName, setGameName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthContext();
  const { joinRoom } = useOptimizedGameRooms();
  const { shouldShowRules, updatePreference } = useRulesPreference();

  const handleCreateGame = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a game',
        variant: 'destructive'
      });
      return;
    }

    if (!gameName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a game name',
        variant: 'destructive'
      });
      return;
    }

    setIsCreating(true);
    try {
      // Generate room code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_room_code');

      if (codeError) throw codeError;

      // Create game room
      const { data: gameRoom, error: roomError } = await supabase
        .from('game_rooms')
        .insert({
          name: gameName.trim(),
          owner_id: user.id,
          player_ids: [user.id],
          max_players: 4,
          room_code: codeData,
          status: 'waiting'
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Automatically join the room
      const { error: joinError } = await joinRoom(gameRoom.room_code);
      if (joinError) throw joinError;

      navigate(`/room/${gameRoom.id}`);
    } catch (error) {
      console.error('Error creating game:', error);
      toast({
        title: 'Error',
        description: 'Failed to create game. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseRules = async () => {
    setShowRules(false);
    await handleCreateGame();
  };

  const handleDoNotShowAgainChange = (checked: boolean) => {
    updatePreference(!checked);
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Create New Game</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gameName">Game Name</Label>
              <Input
                id="gameName"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Enter game name"
                disabled={isCreating}
              />
            </div>
            <Button
              onClick={() => shouldShowRules ? setShowRules(true) : handleCreateGame()}
              className="w-full"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Game'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Game Rules</DialogTitle>
          </DialogHeader>
          <Rules />
          <div className="flex items-center space-x-2 mt-4">
            <Checkbox
              id="doNotShowAgain"
              onCheckedChange={handleDoNotShowAgainChange}
              defaultChecked={false}
            />
            <Label htmlFor="doNotShowAgain">Don't show this again</Label>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowRules(false)}>
              Cancel
            </Button>
            <Button onClick={handleCloseRules}>
              Create Game
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
