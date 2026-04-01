'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { Card, StatCard } from '@/components/ui/Card';
import Badge, { statusBadge } from '@/components/ui/Badge';
import { 
  Users, Layers, MessageCircle, Calendar, 
  CheckCircle, Clock, Bell, PlusCircle, ClipboardList 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRole } from '@/hooks/useRole';
import { useRouter } from 'next/navigation';

export default function TeacherDashboard() {
  const { profile, loading: roleLoading, isTeacher } = useRole();
  const router = useRouter();
  const [batches, setBatches] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (roleLoading) return;
    if (!profile || !isTeacher) {
      if (!profile) router.push('/login');
      else router.push('/dashboard');
      return;
    }

    async function loadData() {
      try {
        // Fetch batches assigned to this teacher
        const { data: batchData } = await supabase
          .from('teacher_batches')
          .select('*, batches(*)')
          .eq('teacher_id', profile?.teacher_id);
        
        setBatches(batchData || []);

        // Fetch recent announcements by this teacher
        const { data: annData } = await supabase
          .from('teacher_announcements')
          .select('*, batches(name), subjects(name)')
          .eq('teacher_id', profile?.teacher_id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        setAnnouncements(annData || []);
      } catch (error) {
        console.error('Error loading teacher dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    if (profile.teacher_id) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [profile, roleLoading, isTeacher, router, supabase]);

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0b0d14]">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d14]">
      <Header 
        title={`Welcome, ${profile?.full_name || 'Teacher'}`} 
        subtitle="Manage your classes and updates" 
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Assigned Batches"
            value={batches.length}
            icon={<Layers className="w-8 h-8" />}
            color="violet"
          />
          <StatCard
            label="Total Updates"
            value={announcements.length}
            icon={<MessageCircle className="w-8 h-8" />}
            color="blue"
          />
          <StatCard
            label="Pending Attendance"
            value="Today"
            icon={<Calendar className="w-8 h-8" />}
            color="emerald"
            trend="Action required"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Batches */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-400" />
                My Batches
              </h2>
            </div>
            
            <div className="space-y-4">
              {batches.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-[#1e2130] rounded-2xl">
                  <p className="text-[#4b5563]">No batches assigned yet.</p>
                </div>
              ) : (
                batches.map((item) => (
                  <div 
                    key={item.batch_id}
                    className="flex items-center justify-between p-4 rounded-xl bg-[#141722] border border-[#1e2130] hover:border-violet-500/30 transition-all group"
                  >
                    <div>
                      <h3 className="font-bold text-white text-lg">{item.batches?.name}</h3>
                      <p className="text-[#6b7280] text-sm">Class {item.batches?.class}</p>
                    </div>
                    <button 
                      onClick={() => router.push(`/teacher/attendance?batch=${item.batch_id}`)}
                      className="px-4 py-2 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 rounded-lg text-sm font-bold transition-all"
                    >
                      Mark Attendance
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Quick Actions & Recent */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => router.push('/teacher/announcements?type=cw')}
                  className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-600/5 border border-violet-500/20 hover:border-violet-500/50 transition-all text-left group"
                >
                  <PlusCircle className="w-6 h-6 text-violet-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="block font-bold text-white">Post CW/HW</span>
                  <span className="text-[11px] text-[#6b7280]">Daily class updates</span>
                </button>
                <button 
                  onClick={() => router.push('/teacher/announcements?type=exam')}
                  className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 hover:border-blue-500/50 transition-all text-left group"
                >
                  <Bell className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="block font-bold text-white">Exam Alert</span>
                  <span className="text-[11px] text-[#6b7280]">Post exam schedule</span>
                </button>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">Recent Updates</h2>
              <div className="space-y-4">
                {announcements.length === 0 ? (
                  <p className="text-[#4b5563] text-sm text-center py-4">No recent updates.</p>
                ) : (
                  announcements.map((ann) => (
                    <div key={ann.id} className="p-3 bg-[#141722] border border-[#1e2130] rounded-xl">
                      <div className="flex justify-between mb-1">
                        <Badge variant={ann.type === 'exam' ? 'danger' : 'info'}>
                          {ann.type.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] text-[#4b5563]">
                          {new Date(ann.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[#d1d5db] text-sm line-clamp-2">{ann.content}</p>
                      <p className="text-[10px] text-violet-400 mt-2 font-medium">
                        {ann.batches?.name} • {ann.subjects?.name}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
