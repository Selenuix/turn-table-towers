import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/useAuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Room from '@/pages/Room';
import NotFound from '@/pages/NotFound';
import { RulesPage } from '@/pages/RulesPage';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from '@/integrations/supabase/client';

const queryClient = new QueryClient();

// Initialize default preferences
const initializePreferences = async () => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Check if user preferences exist
      const { data: existingPrefs } = await supabase
        .from('user_preferences')
        .select('show_rules_on_create')
        .eq('user_id', user.id)
        .single();

      // If no preferences exist, create default
      if (!existingPrefs) {
        await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            show_rules_on_create: true
          });
      }
    }
  } catch (error) {
    console.error('Error initializing preferences:', error);
  }
};

function App() {
  useEffect(() => {
    initializePreferences();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen bg-gray-50">
                <main>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/room/:id" element={<Room />} />
                    <Route path="/rules" element={<RulesPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
