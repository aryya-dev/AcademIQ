import { supabase } from '@/lib/supabase';
import { getStudentsNotContactedThisMonth, getPendingMentoringMessages } from './communications';
import type { Profile } from './profiles';

export interface AppAlert {
  id: string;
  title: string;
  description: string;
  type: 'error' | 'warning' | 'info';
  href?: string;
}

export async function getAlerts(profile: Profile): Promise<AppAlert[]> {
  const alerts: AppAlert[] = [];

  if (profile.role === 'mentor') {
    // 1. Check parent calls
    try {
      const uncontacted = await getStudentsNotContactedThisMonth(profile.id);
      if (uncontacted.length > 0) {
        alerts.push({
          id: 'uncontacted_parents',
          title: 'Parent Calls Needed',
          description: `You have ${uncontacted.length} students without parent contact this month.`,
          type: 'warning',
          href: '/communications'
        });
      }

      // 2. Check pending messages
      const pending = await getPendingMentoringMessages(profile.id);
      if (pending.length > 0) {
        alerts.push({
          id: 'pending_messages',
          title: 'Missing Mentoring Messages',
          description: `You have ${pending.length} students missing 1st/15th messages.`,
          type: 'error',
          href: '/communications'
        });
      }
    } catch (err) {
      console.error('Error fetching mentor alerts:', err);
    }
  } else if (profile.role === 'king' || profile.role === 'knight') {
    // Admin alerts: check system-wide issues
    try {
      // Get all active students
      const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active');
      
      // Get all parent logs this month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const { data: logs } = await supabase
        .from('parent_communication_logs')
        .select('student_id')
        .gte('contacted_at', monthStart.toISOString());
        
      const contactedIds = new Set((logs || []).map((l: any) => l.student_id));
      const uncontactedCount = (studentCount || 0) - contactedIds.size;
      
      if (uncontactedCount > 0) {
        alerts.push({
          id: 'admin_uncontacted',
          title: 'System-wide Parent Calls',
          description: `${uncontactedCount} students across the system haven't been contacted this month.`,
          type: 'warning',
          href: '/tracker'
        });
      }
      
      // We could add more admin alerts here, like low merit points
    } catch (err) {
      console.error('Error fetching admin alerts:', err);
    }
  }

  return alerts;
}
