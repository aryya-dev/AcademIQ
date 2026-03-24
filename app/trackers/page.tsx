'use client';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Users, FileText, BookMarked, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TrackersPage() {
  const router = useRouter();

  const trackers = [
    {
      id: 'student-database',
      title: 'Student Database',
      description: 'Comprehensive roster with enrollment status, batch details, and remarks.',
      icon: <Users className="w-6 h-6 text-violet-400" />,
      href: '/trackers/student-database',
      color: 'violet'
    },
    {
      id: 'marks-report',
      title: 'Marks Report',
      description: 'Track academic performance, trends, and identify students needing extra care.',
      icon: <FileText className="w-6 h-6 text-emerald-400" />,
      href: '/trackers/marks-report',
      color: 'emerald'
    },
    {
      id: 'syllabus',
      title: 'Syllabus Tracker',
      description: 'Monitor teaching progress and completion status across batches.',
      icon: <BookMarked className="w-6 h-6 text-amber-400" />,
      href: '/trackers/syllabus',
      color: 'amber'
    },
    {
      id: 'information',
      title: 'Information Tracker',
      description: 'Identify and fill missing student details with status-based filtering.',
      icon: <Users className="w-6 h-6 text-blue-400" />,
      href: '/trackers/information',
      color: 'blue'
    }
  ];

  return (
    <div>
      <Header title="Trackers" subtitle="Comprehensive management and reporting tools" />
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trackers.map((tracker) => (
          <Card 
            key={tracker.id}
            className="hover:border-violet-500/40 transition-all cursor-pointer group hover:scale-[1.02]"
            onClick={() => router.push(tracker.href)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-violet-500/30 transition-colors`}>
                {tracker.icon}
              </div>
              <ChevronRight className="w-5 h-5 text-[#4b5563] group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-white font-semibold text-lg">{tracker.title}</h3>
            <p className="text-[#9ca3af] text-sm mt-2 leading-relaxed">
              {tracker.description}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
