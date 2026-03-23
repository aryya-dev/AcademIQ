import { supabase } from '@/lib/supabase';
import type { Profile } from './profiles';

export interface MentorStats extends Record<string, unknown> {
  id: string;
  name: string;
  email: string | null;
  assigned_class: string | null;
  parent_logs_count: number;
  mentoring_messages_count: number;
  merit_points: number;
}

export async function getMentorTrackerStats() {
  // First, get all profiles with role 'mentor'
  const { data: mentors, error: mentorsError } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'mentor');
    
  if (mentorsError) throw mentorsError;
  
  if (!mentors || mentors.length === 0) return [];

  // Second, get counts of logs for these mentors
  // For simplicity since Supabase RPC might require creation, we will aggregate in JS / via multiple queries
  const mentorIds = mentors.map((m: any) => m.id);
  
  // Get parent logs
  const { data: parentLogs, error: plError } = await supabase
    .from('parent_communication_logs')
    .select('mentor_id')
    .in('mentor_id', mentorIds);
    
  if (plError) throw plError;
  
  // Get mentoring messages
  const { data: msgLogs, error: msgError } = await supabase
    .from('mentoring_messages')
    .select('mentor_id')
    .in('mentor_id', mentorIds);
    
  if (msgError) throw msgError;

  // Get merit points
  const { data: meritLogs, error: meritError } = await supabase
    .from('merit_demerit_logs')
    .select('actor_id, points')
    .eq('actor_type', 'mentor')
    .in('actor_id', mentorIds);

  if (meritError) throw meritError;

  // Aggregate stats
  const parentCounts: Record<string, number> = {};
  parentLogs?.forEach((log: any) => {
    parentCounts[log.mentor_id] = (parentCounts[log.mentor_id] || 0) + 1;
  });
  
  const msgCounts: Record<string, number> = {};
  msgLogs?.forEach((log: any) => {
    msgCounts[log.mentor_id] = (msgCounts[log.mentor_id] || 0) + 1;
  });

  const meritCounts: Record<string, number> = {};
  meritLogs?.forEach((log: any) => {
    meritCounts[log.actor_id] = (meritCounts[log.actor_id] || 0) + (log.points || 0);
  });

  return mentors.map((m: any) => ({
    id: m.id,
    name: m.full_name || 'Unnamed Mentor',
    email: '', // Requires join with auth.users if needed, typically full_name is enough
    assigned_class: m.assigned_class,
    parent_logs_count: parentCounts[m.id] || 0,
    mentoring_messages_count: msgCounts[m.id] || 0,
    merit_points: meritCounts[m.id] || 0,
  })) as MentorStats[];
}
