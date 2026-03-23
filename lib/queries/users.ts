import { supabase } from '@/lib/supabase';
import type { Profile } from './profiles';

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, assigned_class, created_at')
    .order('created_at', { ascending: true });
    
  if (error) throw error;
  return data as Profile[];
}

export async function updateUserRoleAndClass(id: string, updates: { role: Profile['role'], assigned_class: string | null }) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data as Profile;
}
