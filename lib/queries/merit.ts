import { supabase } from '@/lib/supabase';
import type { MeritDemertiLog, ActorType } from '@/types';

export async function getMeritLogs(actorId?: string) {
  let q = supabase
    .from('merit_demerit_logs')
    .select('*')
    .order('created_at', { ascending: false });
  if (actorId) q = q.eq('actor_id', actorId);
  const { data, error } = await q;
  if (error) throw error;
  return data as MeritDemertiLog[];
}

export async function logMerit(entry: Omit<MeritDemertiLog, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('merit_demerit_logs')
    .insert(entry)
    .select()
    .single();
  if (error) throw error;
  return data as MeritDemertiLog;
}

export async function getTotalScore(actorId: string) {
  const { data, error } = await supabase
    .from('merit_demerit_logs')
    .select('points')
    .eq('actor_id', actorId);
  if (error) throw error;
  return (data || []).reduce((sum: number, r: any) => sum + (r.points || 0), 0)
}

export async function getAllScoresSummary() {
  const { data, error } = await supabase
    .from('merit_demerit_logs')
    .select('actor_id, actor_type, points');
  if (error) throw error;

  const map: Record<string, { actor_type: string; total: number }> = {};
  for (const row of data || []) {
    if (!map[row.actor_id]) map[row.actor_id] = { actor_type: row.actor_type, total: 0 };
    map[row.actor_id].total += row.points;
  }
  return map;
}

// Auto-award merit points based on rules
export const MERIT_RULES = {
  institutional_contribution: 100,
  parent_appreciation: 100,
  student_improvement_20_30: 50,
  high_performance: 50,       // >85%
  exceptional_performance: 100, // >95%
  batch_growth: 100,
  batch_high_avg: 100,        // >75% avg
  convince_join_per_subject: 10,
  full_referral: 100,
  recover_old_student: 5,
  social_post: 10,
} as const;

export const DEMERIT_RULES = {
  red_marking: -5,
  parent_negative_feedback: -100,
  student_negative_feedback: -50,
  poor_improvement: -50,
  no_practicals_60d: -50,
  missed_class: -50,
  incomplete_syllabus: -50,
  no_exam_45d: -50,
  failed_student_no_justification: -50,
  batch_strength_decrease: -100,
  missed_mentoring_message: -10,
  no_feedback_collection: -20,
  no_parent_communication: -10,
  poor_record_management: -50,
} as const;

export async function awardMerit(actorId: string, actorType: ActorType, rule: keyof typeof MERIT_RULES) {
  return logMerit({ actor_id: actorId, actor_type: actorType, reason: rule, points: MERIT_RULES[rule] });
}

export async function applyDemerit(actorId: string, actorType: ActorType, rule: keyof typeof DEMERIT_RULES) {
  return logMerit({ actor_id: actorId, actor_type: actorType, reason: rule, points: DEMERIT_RULES[rule] });
}
