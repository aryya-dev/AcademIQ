'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { User, Shield, GraduationCap, Mail, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getProfile, updateProfile, createProfile, type Profile } from '@/lib/queries/profiles';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState('');

  async function load() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      
      const p = await getProfile(user.id);
      if (p) {
        setProfile(p);
        setFullName(p.full_name || '');
      } else {
        // If profile doesn't exist, we can create a blank one
        const newProfile = await createProfile({
          id: user.id,
          full_name: '',
          role: null,
          assigned_class: null,
        });
        setProfile(newProfile);
        setFullName('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const updated = await updateProfile(user.id, { full_name: fullName });
      setProfile(updated);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Header title="My Profile" subtitle="Manage your personal details and view your roles" />
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        
        {loading ? (
          <div className="space-y-4">
            <div className="h-32 bg-[#141722] border border-[#1e2130] rounded-xl animate-pulse" />
            <div className="h-64 bg-[#141722] border border-[#1e2130] rounded-xl animate-pulse" />
          </div>
        ) : (
          <>
            {/* Identity Card */}
            <Card className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold uppercase shadow-lg shadow-violet-500/20 shrink-0">
                {fullName ? fullName.charAt(0) : user?.email?.charAt(0) || <User className="w-10 h-10" />}
              </div>
              
              <div className="space-y-3 text-center sm:text-left flex-1 relative z-10">
                <div>
                  <h2 className="text-2xl font-bold text-white">{fullName || 'Set your name'}</h2>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-[#9ca3af] mt-1">
                    <Mail className="w-4 h-4" />
                    <span>{user?.email}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <Badge variant="purple" className="flex items-center gap-1.5 px-3 py-1 mt-2 text-sm text-violet-300">
                    <Shield className="w-4 h-4" />
                    <span className="capitalize">{profile?.role || 'No Role Assigned'}</span>
                  </Badge>

                  {profile?.assigned_class && (
                    <Badge variant="info" className="flex items-center gap-1.5 px-3 py-1 mt-2 text-sm">
                      <GraduationCap className="w-4 h-4" />
                      Class {profile.assigned_class}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>

            {/* Settings Form */}
            <Card>
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-violet-400" />
                Personal Information
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-[#141722] border border-[#2a2f45] text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder:text-[#4b5563]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Role (Read-only)</label>
                    <input
                      type="text"
                      value={profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Not assigned'}
                      disabled
                      className="w-full bg-[#11131c] border border-[#1e2130] text-[#6b7280] text-sm rounded-lg px-4 py-2.5 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">Assigned Class (Read-only)</label>
                    <input
                      type="text"
                      value={profile?.assigned_class ? `Class ${profile.assigned_class}` : 'Not assigned'}
                      disabled
                      className="w-full bg-[#11131c] border border-[#1e2130] text-[#6b7280] text-sm rounded-lg px-4 py-2.5 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1e2130] flex justify-end">
                  <Button type="submit" loading={saving} icon={<Save className="w-4 h-4" />}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
