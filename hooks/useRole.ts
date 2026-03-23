'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getProfile, type Profile } from '@/lib/queries/profiles';

export function useRole() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const p = await getProfile(user.id);
          setProfile(p);
        }
      } catch (err) {
        console.error('Failed to load role:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return {
    profile,
    role: profile?.role || null, // 'king' | 'knight' | 'mentor' | null
    loading,
    isKingOrKnight: profile?.role === 'king' || profile?.role === 'knight',
  };
}
