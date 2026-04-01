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
        const { data: { user } }: any = await supabase.auth.getUser();
        if (user) {
          const p = await getProfile(user.id);
          setProfile(p);
        }
      } catch (err: any) {
        console.error('Failed to load role:', err?.message || err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return {
    profile,
    role: profile?.role || null,
    subRole: profile?.sub_role || null,
    loading,
    isAdmin: profile?.role === 'admin',
    isTeacher: profile?.role === 'teacher',
    isKingOrKnight: profile?.role === 'admin' && (profile?.sub_role === 'king' || profile?.sub_role === 'knight'),
  };
}
