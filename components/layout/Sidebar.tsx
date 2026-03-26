'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, BookOpen, Layers, GitMerge,
  CalendarCheck, FileText, BookMarked, MessageCircle, Award, GraduationCap, Activity, UserCog, ClipboardList
} from 'lucide-react';
import { useRole } from '@/hooks/useRole';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/batches', label: 'Batches', icon: Layers },
  { href: '/enrollments', label: 'Enrollments', icon: GitMerge },
  { href: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { href: '/tests', label: 'Tests & Marks', icon: FileText },
  { href: '/communications', label: 'Communications', icon: MessageCircle },
  { href: '/merit', label: 'Merit / Demerit', icon: Award },
  { href: '/scoreboard', label: 'Scoreboard', icon: Activity },
  { href: '/trackers', label: 'Trackers', icon: ClipboardList },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isKingOrKnight, role, loading } = useRole();
  return (
    <aside className="w-64 min-h-screen bg-[#0f1117] border-r border-[#1e2130] flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[#1e2130]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">AcademIQ</p>
            <p className="text-[#6b7280] text-[11px] mt-0.5">Management System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-violet-600/20 text-violet-400 border border-violet-600/30'
                  : 'text-[#9ca3af] hover:text-white hover:bg-[#1e2130]'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-violet-400' : ''}`} />
              {label}
            </Link>
          );
        })}
        
        {!loading && role === 'king' && (
          <div className="pt-4 mt-4 border-t border-[#1e2130]">
            <p className="px-3 text-xs font-semibold text-[#4b5563] uppercase tracking-wider mb-2">
              Management
            </p>
            <Link
              href="/users"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                pathname === '/users' || pathname.startsWith('/users/')
                  ? 'bg-violet-600/20 text-violet-400 border border-violet-600/30'
                  : 'text-[#9ca3af] hover:text-white hover:bg-[#1e2130]'
              }`}
            >
              <UserCog className={`w-4 h-4 shrink-0 ${pathname === '/users' ? 'text-violet-400' : ''}`} />
              User Management
            </Link>
          </div>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-[#1e2130]">
        <p className="text-[#4b5563] text-[11px] text-center">© 2025 AcademIQ</p>
      </div>
    </aside>
  );
}
