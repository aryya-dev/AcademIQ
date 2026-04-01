'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Shield, UserCog, Edit2 } from 'lucide-react';
import { getAllProfiles, updateUserRoleAndClass } from '@/lib/queries/users';
import type { Profile } from '@/lib/queries/profiles';
import { useRole } from '@/hooks/useRole';
import { createClient } from '@/lib/supabase/client';

export default function UserManagementPage() {
  const router = useRouter();
  const { role, subRole, loading: roleLoading } = useRole();
  const [users, setUsers] = useState<Profile[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ 
    role: Profile['role']; 
    sub_role?: Profile['sub_role'];
    assigned_class: string;
    teacher_id: string;
  }>({
    role: null as any, 
    sub_role: undefined,
    assigned_class: '',
    teacher_id: ''
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newUserInfo, setNewUserInfo] = useState({ id: '', full_name: '' });

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').insert({
        id: newUserInfo.id,
        full_name: newUserInfo.full_name
      });
      if (error) throw error;
      setOpen(false);
      setIsAdding(false);
      setNewUserInfo({ id: '', full_name: '' });
      await load();
    } catch (err: any) {
      alert(`Failed to add user: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  function openAddModal() {
    setSelectedUser(null);
    setIsAdding(true);
    setOpen(true);
  }

  async function load() {
    try {
      const [p, t] = await Promise.all([
        getAllProfiles(),
        supabase.from('teachers').select('*').order('name')
      ]);
      setUsers(p || []);
      setTeachers(t.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (roleLoading) return;
    // Only 'king' admins can manage users
    if (role !== 'admin' || (subRole !== 'king' && subRole !== 'knight' && subRole !== 'mentor')) {
      router.push('/dashboard');
      return;
    }
    load();
  }, [role, subRole, roleLoading, router]);

  function handleEdit(user: Profile) {
    setIsAdding(false);
    setSelectedUser(user);
    setForm({
      role: user.role,
      sub_role: user.sub_role || undefined,
      assigned_class: user.assigned_class || '',
      teacher_id: user.teacher_id || ''
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    try {
      await updateUserRoleAndClass(selectedUser.id, {
        role: form.role,
        sub_role: form.sub_role,
        assigned_class: form.role === 'admin' ? (form.assigned_class || null) : null,
        teacher_id: form.role === 'teacher' ? (form.teacher_id || null) : null
      });
      setOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      alert('Failed to update user');
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: 'full_name', header: 'Name', render: (u: Profile) => <span className="font-medium text-white">{u.full_name || 'Unnamed'}</span> },
    { key: 'role', header: 'Role', render: (u: Profile) => {
        if (!u.role) return <span className="text-[#6b7280]">Not Assigned</span>;
        if (u.role === 'admin') {
          return <Badge variant="purple">{u.sub_role || 'Admin'}</Badge>;
        }
        return <Badge variant="info">Teacher</Badge>;
    }},
    { key: 'details', header: 'Details', render: (u: Profile) => {
      if (u.role === 'admin' && u.assigned_class) return <span>Class {u.assigned_class}</span>;
      if (u.role === 'teacher') {
        const teacher = teachers.find(t => t.id === u.teacher_id);
        return <span className="text-violet-400 font-medium">{teacher?.name || 'Linked Teacher'}</span>;
      }
      return <span className="text-[#6b7280]">—</span>;
    }},
    { key: 'actions', header: '', render: (u: Profile) => (
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" icon={<Edit2 className="w-3 h-3" />} onClick={() => handleEdit(u)}>
          Edit Access
        </Button>
      </div>
    )},
  ];

  if (roleLoading) return <div className="p-8 text-center text-[#9ca3af]">Initializing access...</div>;
  if (role !== 'admin' || (subRole !== 'king' && subRole !== 'knight' && subRole !== 'mentor')) return null;

  return (
    <div className="min-h-screen bg-[#0b0d14]">
      <Header title="User Management" subtitle="Authorized Management: Manage authentication and roles" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[#9ca3af] text-sm">
            <Shield className="w-4 h-4 text-violet-400" />
            {users.length} total profiles
          </div>
          <Button onClick={openAddModal} className="bg-violet-600 hover:bg-violet-500 text-xs py-2">
            + Authorize New User ID
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-[#141722] border border-[#1e2130] rounded-xl animate-pulse" />)}</div>
        ) : (
          <Table columns={columns} data={users} emptyMessage="No profiles found." getKey={(u) => u.id} />
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={isAdding ? "Authorize New User" : "Edit User Access"} size="sm">
        {isAdding ? (
          <form onSubmit={handleAddUser} className="space-y-6">
            <div className="space-y-2 text-[#9ca3af] text-xs">
              <p>1. Copy the <b>User ID (UUID)</b> from Supabase Auth.</p>
              <p>2. Paste it here to create their system profile.</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#4b5563] uppercase tracking-wider">User ID (UUID)</label>
              <input 
                required
                className="w-full bg-[#0a0c14] border-[#1e2130] rounded-xl py-2.5 px-4 text-white text-sm font-mono"
                placeholder="00000000-0000-0000-0000-000000000000"
                value={newUserInfo.id}
                onChange={(e) => setNewUserInfo(f => ({ ...f, id: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#4b5563] uppercase tracking-wider">Full Name</label>
              <input 
                required
                className="w-full bg-[#0a0c14] border-[#1e2130] rounded-xl py-2.5 px-4 text-white text-sm"
                placeholder="e.g. Suvankar Sir"
                value={newUserInfo.full_name}
                onChange={(e) => setNewUserInfo(f => ({ ...f, full_name: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-[#1e2130]">
              <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving} className="bg-violet-600 hover:bg-violet-500">Add to System</Button>
            </div>
          </form>
        ) : selectedUser && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#4b5563] uppercase tracking-wider">Role Category</label>
              <select 
                className="w-full bg-[#0a0c14] border-[#1e2130] rounded-xl py-2.5 px-4 text-white"
                value={form.role || ''} 
                onChange={(e) => setForm(f => ({ ...f, role: (e.target.value as Profile['role']), sub_role: undefined }))}
              >
                <option value="">No Access</option>
                <option value="admin">Admin / Management</option>
                <option value="teacher">Teacher / Instructor</option>
              </select>
            </div>

            {form.role === 'admin' && (
              <div className="space-y-4 pt-4 border-t border-[#1e2130] animate-in fade-in duration-300">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#4b5563] uppercase tracking-wider">Admin Sub-Role</label>
                  <select 
                    className="w-full bg-[#0a0c14] border-[#1e2130] rounded-xl py-2.5 px-4 text-white"
                    value={form.sub_role || ''} 
                    onChange={(e) => setForm(f => ({ ...f, sub_role: e.target.value as any }))}
                  >
                    <option value="">Standard Admin</option>
                    <option value="king">King (Super Admin)</option>
                    <option value="knight">Knight</option>
                    <option value="mentor">Mentor</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#4b5563] uppercase tracking-wider">Assigned Class (Optional)</label>
                  <select 
                    className="w-full bg-[#0a0c14] border-[#1e2130] rounded-xl py-2.5 px-4 text-white"
                    value={form.assigned_class} 
                    onChange={(e) => setForm(f => ({ ...f, assigned_class: e.target.value }))}
                  >
                    <option value="">All Classes</option>
                    {['8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
              </div>
            )}

            {form.role === 'teacher' && (
              <div className="space-y-2 pt-4 border-t border-[#1e2130] animate-in fade-in duration-300">
                <label className="text-xs font-bold text-[#4b5563] uppercase tracking-wider">Link to Teacher Profile</label>
                <select 
                  className="w-full bg-[#0a0c14] border-[#1e2130] rounded-xl py-2.5 px-4 text-white"
                  value={form.teacher_id} 
                  onChange={(e) => setForm(f => ({ ...f, teacher_id: e.target.value }))}
                  required
                >
                  <option value="">Select teacher profile...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <p className="text-[10px] text-[#4b5563]">This links the auth account to the teacher's dashboard data.</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-[#1e2130]">
              <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving} className="bg-violet-600 hover:bg-violet-500">Save Permissions</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
