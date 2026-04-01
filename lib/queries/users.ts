import { supabase } from '@/lib/supabase';
import type { Profile } from './profiles';

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, sub_role, assigned_class, teacher_id, mentor_id, created_at')
    .order('created_at', { ascending: true });
    
  if (error) throw error;
  return data as Profile[];
}

export async function updateUserRoleAndClass(id: string, updates: { 
  role: Profile['role'], 
  sub_role?: Profile['sub_role'],
  assigned_class?: string | null,
  teacher_id?: string | null
}) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data as Profile;
}
