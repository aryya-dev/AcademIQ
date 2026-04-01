"use client";
import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Lock, Mail, User, GraduationCap, Loader2, ArrowRight } from 'lucide-react';
import { getUnlinkedTeachers } from '@/lib/queries/teachers';
import type { Teacher } from '@/types';

function LoginContent() {
  const [mode, setMode] = useState<'admin' | 'teacher'>('admin');
  
  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }: any) => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile?.role === 'teacher') router.push('/teacher');
        else router.push('/dashboard');
      }
    });
  }, [router, supabase]);

  async function handleAction(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Login logic
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else if (user) {
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (p?.role === 'teacher') router.push('/teacher');
      else router.push('/dashboard');
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0c14] p-6 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-[480px] z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 mb-6 shadow-2xl shadow-violet-500/20 rotate-3">
             <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">AcademIQ</h1>
          <p className="text-[#9ca3af] font-medium text-sm">Secure Management & Teacher Portal</p>
        </div>

        <Card className="p-1 rounded-[32px] bg-[#141722]/40 backdrop-blur-3xl border-[#1e2130] shadow-2xl">
          <div className="flex p-1.5 bg-[#0a0c14]/80 rounded-[28px] mb-6 relative">
            <div 
              className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-3px)] bg-gradient-to-r from-violet-600 to-indigo-600 rounded-[24px] transition-all duration-500 ease-out shadow-lg shadow-violet-600/20 ${mode === 'teacher' ? 'translate-x-full' : ''}`}
            />
            <button 
              onClick={() => { setMode('admin'); }}
              className={`flex-1 py-3.5 text-sm font-bold z-10 transition-colors duration-300 ${mode === 'admin' ? 'text-white' : 'text-[#4b5563]'}`}
            >
              Management
            </button>
            <button 
              onClick={() => setMode('teacher')}
              className={`flex-1 py-3.5 text-sm font-bold z-10 transition-colors duration-300 ${mode === 'teacher' ? 'text-white' : 'text-[#4b5563]'}`}
            >
              Teacher
            </button>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white">
                {mode === 'admin' ? 'Admin Access' : 'Teacher Portal'}
              </h2>
              <p className="text-sm text-[#4b5563]">
                {mode === 'admin' ? 'Enter your management credentials' : 'Authorized teacher login only'}
              </p>
            </div>

            <form onSubmit={handleAction} className="space-y-4">
              {error && ( mode === 'admin' || !error.includes('Invalid login credentials') ? (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-medium animate-shake">
                  {error}
                </div>
              ) : (
                <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-2xl text-violet-400 text-xs font-medium">
                  Access denied. Please contact Admin to activate your teacher account.
                </div>
              ))}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#4b5563] uppercase tracking-wider ml-1">Email Identifier</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b5563] group-focus-within:text-violet-400 transition-colors" />
                  <input
                    type="email"
                    required
                    placeholder="name@academics.com"
                    className="pl-12 w-full bg-[#0a0c14] border-[#1e2130] focus:border-violet-500/50 transition-all rounded-2xl py-3.5 text-white placeholder-[#2a2f45] text-sm outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#4b5563] uppercase tracking-wider ml-1">Secure Key</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b5563] group-focus-within:text-violet-400 transition-colors" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="pl-12 w-full bg-[#0a0c14] border-[#1e2130] focus:border-violet-500/50 transition-all rounded-2xl py-3.5 text-white placeholder-[#2a2f45] text-sm outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-violet-900/40 border-0 text-sm font-black text-white rounded-2xl mt-4 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </form>
          </div>
        </Card>

        <div className="mt-12 text-center text-[10px] font-bold text-[#2a2f45] uppercase tracking-[3px]">
          © 2025 ACADEMIQ CORE • RESTRICTED ACCESS
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
