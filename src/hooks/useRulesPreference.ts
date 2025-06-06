import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from './useAuthContext';
import { UserPreferencesEnum } from '@/consts';

export const useRulesPreference = () => {
  const [shouldShowRules, setShouldShowRules] = useState(true);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthContext();
  const hasShownRulesRef = useRef(false);

  useEffect(() => {
    const loadPreference = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('show_rules_on_create')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No preference found, create one
            const { error: insertError } = await supabase
              .from('user_preferences')
              .insert({
                user_id: user.id,
                show_rules_on_create: true
              });

            if (insertError) throw insertError;
            setShouldShowRules(true);
          } else {
            throw error;
          }
        } else {
          setShouldShowRules(data.show_rules_on_create);
        }
      } catch (error) {
        console.error('Error loading rules preference:', error);
        // Default to showing rules if there's an error
        setShouldShowRules(true);
      } finally {
        setLoading(false);
      }
    };

    loadPreference();
  }, [user?.id]);

  const updatePreference = async (showRules: boolean) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          show_rules_on_create: showRules
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      setShouldShowRules(showRules);
    } catch (error) {
      console.error('Error updating rules preference:', error);
    }
  };

  return {
    shouldShowRules,
    loading,
    updatePreference,
    hasShownRulesRef
  };
}; 