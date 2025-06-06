import React from 'react';
import { Rules } from '@/features/game-room/components/Rules';
import { LobbyHeader } from '@/components/lobby/LobbyHeader';
import { useAuth } from '@/hooks/useAuth';

export const RulesPage: React.FC = () => {
  const { user, signOut } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <LobbyHeader username={user.email || ''} onSignOut={signOut} />
      
      <main className="container mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">How to Play</h1>
          <p className="text-xl text-slate-300">
            Master the art of strategic card battles
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Rules showDoNotShowAgain={false} />
        </div>
      </main>
    </div>
  );
}; 