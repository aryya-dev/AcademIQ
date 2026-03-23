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

export default function UserManagementPage() {
  const router = useRouter();
  const { role, loading: roleLoading } = useRole();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ role: Profile['role']; assigned_class: string }>({
    role: null,
    assigned_class: ''
  });

  async function load() {
    try {
      const p = await getAllProfiles();
      setUsers(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (roleLoading) return;
    if (role !== 'king') {
      router.push('/dashboard');
      return;
    }
    load();
  }, [role, roleLoading, router]);

  function handleEdit(user: Profile) {
    setSelectedUser(user);
    setForm({
      role: user.role,
      assigned_class: user.assigned_class || ''
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
        assigned_class: form.assigned_class || null
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
    { key: 'id', header: 'User ID', render: (u: Profile) => <span className="text-[#6b7280] text-xs font-mono">{u.id}</span> },
    { key: 'role', header: 'Role', render: (u: Profile) => {
        if (!u.role) return <span className="text-[#6b7280]">Not Assigned</span>;
        if (u.role === 'king') return <Badge variant="purple">King</Badge>;
        if (u.role === 'knight') return <Badge variant="info">Knight</Badge>;
        return <Badge variant="default">Mentor</Badge>;
    }},
    { key: 'assigned_class', header: 'Class', render: (u: Profile) => (
      u.assigned_class ? <span>Class {u.assigned_class}</span> : <span className="text-[#6b7280]">—</span>
    )},
    { key: 'actions', header: '', render: (u: Profile) => (
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" icon={<Edit2 className="w-3 h-3" />} onClick={() => handleEdit(u)}>
          Edit Access
        </Button>
      </div>
    )},
  ];

  if (roleLoading) return <div className="p-8 text-center text-[#9ca3af]">Initializing access...</div>;
  if (role !== 'king') return null;

  return (
    <div>
      <Header title="User Management" subtitle="Kings only: Assign roles and classes" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-[#9ca3af] text-sm mb-4">
          <Shield className="w-4 h-4 text-violet-400" />
          {users.length} total profiles
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-[#141722] border border-[#1e2130] rounded-xl animate-pulse" />)}</div>
        ) : (
          <Table columns={columns} data={users} emptyMessage="No profiles found." getKey={(u) => u.id} />
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Edit User Access" size="sm">
        {selectedUser && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label>Role</label>
              <select 
                value={form.role || ''} 
                onChange={(e) => setForm(f => ({ ...f, role: (e.target.value as Profile['role']) }))}
              >
                <option value="">No Role (Remove Access)</option>
                <option value="king">King (Full Admin)</option>
                <option value="knight">Knight (Admin + Mentor)</option>
                <option value="mentor">Mentor</option>
              </select>
            </div>
            {(form.role === 'mentor' || form.role === 'knight') && (
              <div>
                <label>Assigned Class</label>
                <select 
                  value={form.assigned_class} 
                  onChange={(e) => setForm(f => ({ ...f, assigned_class: e.target.value }))}
                >
                  <option value="">No Class</option>
                  {['8','9','10','11','12'].map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>Save Changes</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
