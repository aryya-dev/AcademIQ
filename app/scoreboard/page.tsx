'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { Activity, ShieldAlert, PhoneCall, MessageSquare, Award, ArrowUpRight } from 'lucide-react';
import { getMentorTrackerStats, type MentorStats } from '@/lib/queries/tracker';
import { useRole } from '@/hooks/useRole';

export default function MentorScoreboardPage() {
  const router = useRouter();
  const { loading: roleLoading } = useRole();
  const [mentors, setMentors] = useState<MentorStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roleLoading) return;

    async function load() {
      try {
        const stats = await getMentorTrackerStats();
        // Sort by merit points descending for a true scoreboard feel
        stats.sort((a, b) => b.merit_points - a.merit_points);
        setMentors(stats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [roleLoading, router]);

  const columns = [
    { key: 'name', header: 'Mentor Name', render: (m: MentorStats) => <span className="font-medium text-white">{m.name}</span> },
    { key: 'class', header: 'Assigned Class', render: (m: MentorStats) => (
      m.assigned_class ? <Badge variant="info">Class {m.assigned_class}</Badge> : <span className="text-[#6b7280]">Not Assigned</span>
    )},
    { key: 'parent_logs', header: 'Parent Calls Logged', render: (m: MentorStats) => (
      <div className="flex items-center gap-2">
        <PhoneCall className="w-4 h-4 text-emerald-400" />
        <span className="font-medium">{m.parent_logs_count}</span>
      </div>
    )},
    { key: 'messages', header: 'Mentoring Msgs Sent', render: (m: MentorStats) => (
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-violet-400" />
        <span className="font-medium">{m.mentoring_messages_count}</span>
      </div>
    )},
    { key: 'points', header: 'Merit Points', render: (m: MentorStats) => (
      <div className="flex items-center gap-2">
        <Award className={`w-4 h-4 ${m.merit_points >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
        <span className={`font-bold ${m.merit_points >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{m.merit_points}</span>
      </div>
    )},
  ];

  if (roleLoading) return <div className="p-8 text-center text-[#9ca3af]">Initializing access...</div>;

  return (
    <div>
      <Header title="Mentor Scoreboard" subtitle="Overview of mentor activity and performance" />
      <div className="p-6 space-y-6">
        
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="flex items-center justify-between border-violet-500/20 bg-violet-500/5">
            <div>
              <p className="text-[#9ca3af] text-sm font-medium mb-1">Total Mentors</p>
              <h3 className="text-3xl font-bold text-white tracking-tight">{mentors.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-violet-400" />
            </div>
          </Card>
          
          <Card className="flex items-center justify-between border-emerald-500/20 bg-emerald-500/5">
            <div>
              <p className="text-[#9ca3af] text-sm font-medium mb-1">Total Parent Calls</p>
              <h3 className="text-3xl font-bold text-white tracking-tight">
                {mentors.reduce((acc, m) => acc + m.parent_logs_count, 0)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <PhoneCall className="w-6 h-6 text-emerald-400" />
            </div>
          </Card>

          <Card className="flex items-center justify-between border-blue-500/20 bg-blue-500/5">
            <div>
              <p className="text-[#9ca3af] text-sm font-medium mb-1">Total Mentoring Msgs</p>
              <h3 className="text-3xl font-bold text-white tracking-tight">
                {mentors.reduce((acc, m) => acc + m.mentoring_messages_count, 0)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-400" />
            </div>
          </Card>
          
          <Card className="flex items-center justify-between border-amber-500/20 bg-amber-500/5">
            <div>
              <p className="text-[#9ca3af] text-sm font-medium mb-1">Total Team Points</p>
              <h3 className="text-3xl font-bold text-white tracking-tight">
                {mentors.reduce((acc, m) => acc + m.merit_points, 0)}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Award className="w-6 h-6 text-amber-400" />
            </div>
          </Card>
        </div>

        {/* Tracker Table */}
        <div className="space-y-3">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-400" />
            Mentor Performance Overview
          </h2>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-[#141722] border border-[#1e2130] rounded-xl animate-pulse" />)}</div>
          ) : (
            <Table columns={columns} data={mentors} emptyMessage="No mentors found in the system." getKey={(m) => m.id} />
          )}
        </div>

      </div>
    </div>
  );
}
