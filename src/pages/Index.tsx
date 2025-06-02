
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Clock, Trophy, Plus, LogOut, User, Home } from "lucide-react";

// Mock data for game rooms
const mockGameRooms = [
  {
    id: 1,
    name: "Epic Battle Arena",
    players: 3,
    maxPlayers: 4,
    status: "waiting",
    gameType: "Standard",
    createdBy: "GameMaster42",
    difficulty: "Medium"
  },
  {
    id: 2,
    name: "Quick Match",
    players: 2,
    maxPlayers: 2,
    status: "in-progress",
    gameType: "Blitz",
    createdBy: "SpeedDemon",
    difficulty: "Easy"
  },
  {
    id: 3,
    name: "Champions League",
    players: 1,
    maxPlayers: 4,
    status: "waiting",
    gameType: "Tournament",
    createdBy: "ProPlayer99",
    difficulty: "Hard"
  },
  {
    id: 4,
    name: "Casual Friday Fun",
    players: 4,
    maxPlayers: 6,
    status: "waiting",
    gameType: "Casual",
    createdBy: "FridayFun",
    difficulty: "Easy"
  },
  {
    id: 5,
    name: "Strategy Masters",
    players: 2,
    maxPlayers: 4,
    status: "waiting",
    gameType: "Strategic",
    createdBy: "ChessMaster",
    difficulty: "Hard"
  }
];

const Index = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [gameType, setGameType] = useState("Standard");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "in-progress":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Medium":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "Hard":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const handleCreateGame = () => {
    console.log("Creating game:", { newGameName, maxPlayers, gameType });
    setIsCreateModalOpen(false);
    setNewGameName("");
    setMaxPlayers("4");
    setGameType("Standard");
  };

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
            <Button variant="ghost" className="text-slate-300 hover:text-red-400 hover:bg-red-500/10">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
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
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200">
                <Plus className="w-5 h-5 mr-2" />
                Create New Game Room
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Create New Game Room</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="gameName" className="text-sm font-medium">
                    Game Room Name
                  </Label>
                  <Input
                    id="gameName"
                    value={newGameName}
                    onChange={(e) => setNewGameName(e.target.value)}
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
                    <option value="4">4 Players</option>
                    <option value="6">6 Players</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="gameType" className="text-sm font-medium">
                    Game Type
                  </Label>
                  <select
                    id="gameType"
                    value={gameType}
                    onChange={(e) => setGameType(e.target.value)}
                    className="w-full mt-1 bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Blitz">Blitz</option>
                    <option value="Tournament">Tournament</option>
                    <option value="Casual">Casual</option>
                  </select>
                </div>
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={handleCreateGame}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={!newGameName.trim()}
                  >
                    Create Room
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 border-slate-600 text-white hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Game Rooms Grid */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6">Active Game Rooms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockGameRooms.map((room) => (
              <Card key={room.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-white truncate">
                      {room.name}
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
                        {room.players}/{room.maxPlayers} players
                      </span>
                    </div>
                    <Badge className={`${getDifficultyColor(room.difficulty)} border text-xs`}>
                      {room.difficulty}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-slate-300">
                    <Trophy className="w-4 h-4 mr-2" />
                    <span className="text-sm">{room.gameType}</span>
                  </div>
                  
                  <div className="flex items-center text-slate-300">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm">Host: {room.createdBy}</span>
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium"
                      disabled={room.status === "in-progress" || room.players >= room.maxPlayers}
                    >
                      {room.status === "in-progress" 
                        ? "Game in Progress" 
                        : room.players >= room.maxPlayers 
                        ? "Room Full" 
                        : "Join Game"
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {mockGameRooms.length}
              </div>
              <div className="text-slate-300">Active Rooms</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {mockGameRooms.reduce((acc, room) => acc + room.players, 0)}
              </div>
              <div className="text-slate-300">Players Online</div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {mockGameRooms.filter(room => room.status === "waiting").length}
              </div>
              <div className="text-slate-300">Open Games</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
