import { supabase } from '@/lib/supabase';

export interface Profile extends Record<string, unknown> {
  id: string;
  full_name: string | null;
  role: 'king' | 'knight' | 'mentor' | null;
  assigned_class: string | null;
  created_at?: string;
}

export async function getProfile(id: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    // If the error is PGRST116 (0 rows returned), we might want to return null instead of throwing
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Profile;
}

export async function createProfile(profile: Omit<Profile, 'created_at'>) {
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single();
    
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(id: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data as Profile;
}
