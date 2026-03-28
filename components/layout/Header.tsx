'use client';
import { useEffect, useState } from 'react';
import { Bell, Search, LogOut, User, AlertCircle, Info, AlertTriangle, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRole } from '@/hooks/useRole';
import { getAlerts, type AppAlert } from '@/lib/queries/alerts';

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  backButton?: boolean;
}

export default function Header({ title, subtitle, action, backButton }: HeaderProps) {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();
  const { profile, loading: roleLoading } = useRole();
  const [alerts, setAlerts] = useState<AppAlert[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
      setUser(user);
    });
  }, []);

  useEffect(() => {
    if (roleLoading || !profile) return;
    getAlerts(profile).then(setAlerts).catch(console.error);
  }, [profile, roleLoading]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="h-16 bg-[#0f1117]/80 backdrop-blur border-b border-[#1e2130] px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {backButton && (
          <button 
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg bg-[#1e2130] border border-[#2a2f45] flex items-center justify-center text-[#9ca3af] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div>
          <h1 className="text-white font-semibold text-lg leading-none">{title}</h1>
          {subtitle && <p className="text-[#6b7280] text-xs mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {action && <div className="mr-2">{action}</div>}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4b5563]" />
          <input
            placeholder="Search..."
            className="bg-[#1e2130] border border-[#2a2f45] text-white text-sm rounded-lg pl-9 pr-4 py-1.5 w-52 placeholder:text-[#4b5563] focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors border ${
              alerts.length > 0 
                ? 'bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20' 
                : 'bg-[#1e2130] border-[#2a2f45] text-[#9ca3af] hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-[#0f1117]"></span>
              </span>
            )}
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-[#141722] border border-[#1e2130] rounded-xl shadow-2xl py-2 z-50">
                <div className="px-4 pb-2 border-b border-[#1e2130] mb-2 flex items-center justify-between">
                  <h3 className="text-white font-semibold text-sm">Notifications</h3>
                  <span className="text-xs bg-[#1e2130] text-[#9ca3af] px-2 py-0.5 rounded-full">{alerts.length}</span>
                </div>
                
                {alerts.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[#6b7280] text-sm">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p>You're all caught up!</p>
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto">
                    {alerts.map((alert, idx) => (
                      <div key={alert.id + idx} className="px-4 py-3 hover:bg-[#1e2130]/50 transition-colors border-l-2 border-transparent hover:border-violet-500 group">
                        <div className="flex gap-3">
                          <div className="shrink-0 mt-0.5">
                            {alert.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                            {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                            {alert.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white mb-0.5">{alert.title}</p>
                            <p className="text-xs text-[#9ca3af] leading-relaxed">{alert.description}</p>
                            {alert.href && (
                              <Link 
                                href={alert.href} 
                                onClick={() => setShowDropdown(false)}
                                className="inline-block mt-2 text-xs font-semibold text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Take Action →
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 pl-3 border-l border-[#1e2130]">
          <Link href="/profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold uppercase hover:ring-2 ring-violet-500/50 transition-all">
            {user?.email?.charAt(0) || <User className="w-4 h-4" />}
          </Link>
          <button 
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-[#ef4444] hover:bg-red-500/10 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
