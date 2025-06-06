import {Button} from "@/components/ui/button";
import {Book, Home, LogOut, User} from "lucide-react";
import {Link} from "react-router-dom";
import React from "react";

interface LobbyHeaderProps {
  username: string;
  onSignOut: () => void;
}

export const LobbyHeader = ({username, onSignOut}: LobbyHeaderProps) => {
  return (<header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
    <div className="container mx-auto px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <h1
            className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            CardMaster Arena
          </h1>
          <nav className="hidden md:flex space-x-6">
          <Link to="/">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-700/50">
              <Home className="w-4 h-4 mr-2"/>
              Home
            </Button>
          </Link>
            <Link to="/rules">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-700/50">
                <Book className="w-4 h-4 mr-2"/>
                Rules
              </Button>
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
        <Link to="/profile">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-700/50">
              <User className="w-4 h-4 mr-2"/>
              {username}
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={onSignOut}
            className="text-slate-300 hover:text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4 mr-2"/>
            Logout
          </Button>
        </div>
      </div>
    </div>
  </header>);
};
