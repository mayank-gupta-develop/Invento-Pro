import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Shield, User, Search, AlertTriangle, ChevronLeft, ChevronRight, Download, Printer, Trash2, X } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import UniversalPrintLayout from '@/components/printing/UniversalPrintLayout';

interface AdminUser {
  id: string | number;
  name: string;
  email: string;
  role: 'Admin' | 'User';
  status: string;
  createdAt?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [sortField, setSortField] = useState<'name' | 'joinDate'>('name');
  const [page, setPage] = useState(1);
  const [terminateTarget, setTerminateTarget] = useState<AdminUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'User' as 'Admin' | 'User', password: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const perPage = 8;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get<AdminUser[]>('/admin/users');
      setUsers(res.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => users.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const roleValue = (user.role || '').toLowerCase();
    const filterValue = filterRole.toLowerCase();
    const matchesRole = filterValue === 'all' || roleValue === filterValue;
    return matchesSearch && matchesRole;
  }), [users, searchTerm, filterRole]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => sortField === 'name'
      ? (a.name || '').localeCompare(b.name || '')
      : (a.createdAt || '').localeCompare(b.createdAt || ''));
    return copy;
  }, [filtered, sortField]);

  const totalPages = Math.ceil(sorted.length / perPage) || 1;
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'User', password: '' });
    setShowUserModal(true);
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role, password: '' });
    setShowUserModal(true);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, formData);
      } else {
        await api.post('/admin/users', formData);
      }
      setShowUserModal(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save user');
    }
  };

  const deleteUser = async (user: AdminUser) => {
    if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const terminateUser = async () => {
    if (!terminateTarget) return;
    try {
      await api.put(`/admin/users/${terminateTarget.id}/terminate`);
      setTerminateTarget(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to terminate user');
    }
  };

  const reactivateUser = async (user: AdminUser) => {
    try {
      await api.put(`/admin/users/${user.id}/reactivate`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate user');
    }
  };

  const downloadCsv = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/admin/users/export`, {
        credentials: 'include',
        headers: {
          Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'team-members.csv';
      a.click();
    } catch {
      setError('Failed to download CSV');
    }
  };

  const getRoleColor = (role: string) => (role || '').toLowerCase() === 'admin'
    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'terminated') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (s === 'active' || !s) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <DashboardLayout userRole="admin">


      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8" id="print-section">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Monitoring</h1>
            <p className="text-muted-foreground mt-2 font-medium">Manage e-commerce staff accounts and platform access</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-border/50" onClick={downloadCsv}><Download size={18} className="mr-2" />CSV</Button>
            <Button variant="outline" className="border-border/50" onClick={() => window.print()}><Printer size={18} className="mr-2" />Print</Button>
            <Button className="btn-gradient" onClick={openAddModal}><Plus size={20} className="mr-2" />Add User</Button>
          </div>
        </motion.div>

        <UniversalPrintLayout 
          id="users-list-print"
          title="Invento Pro — User Directory"
          subtitle={`Complete list of staff accounts and access levels as of ${new Date().toLocaleDateString()}`}
          columns={[
            { header: '#', key: 'id', render: (_val: any, _row: any, idx: number) => idx + 1 },
            { header: 'User', key: 'name', render: (val: any) => String(val).toUpperCase() },
            { header: 'Email', key: 'email' },
            { header: 'Role', key: 'role', align: 'center' },
            { header: 'Status', key: 'status', align: 'center', render: (val: any) => val || 'Active' },
            { header: 'Join Date', key: 'createdAt', render: (val: any) => new Date(val).toLocaleDateString() }
          ]}
          data={users}
        />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex flex-col md:flex-row gap-4 no-print">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} className="pl-12 bg-card/70 backdrop-blur-md border-border/50" />
          </div>
          <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1); }} className="px-4 py-2 rounded-lg bg-card/70 backdrop-blur-md border border-border/50 text-foreground text-sm outline-none">
            <option>All</option>
            <option>Admin</option>
            <option>User</option>
          </select>
          <select value={sortField} onChange={(e) => setSortField(e.target.value as any)} className="px-4 py-2 rounded-lg bg-card/70 backdrop-blur-md border border-border/50 text-foreground text-sm outline-none">
            <option value="name">Sort: Name</option>
            <option value="joinDate">Sort: Join Date</option>
          </select>
        </motion.div>

        {loading && <div className="text-sm text-muted-foreground no-print">Loading users…</div>}
        {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2 no-print">{error}</div>}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="rounded-lg glass-card overflow-hidden no-print">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">#</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Join Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((user, idx) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${(user.status || '').toLowerCase() === 'terminated' ? 'opacity-50' : ''}`}
                  >
                    <td className="px-6 py-4 text-sm text-muted-foreground">{(page - 1) * perPage + idx + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 no-print rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-primary-foreground text-xs font-bold">{(user.name || 'U').charAt(0)}</div>
                        <p className="font-medium text-foreground">{user.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getRoleColor(user.role)}`}>{user.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(user.status)}`}>{user.status || 'Active'}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4 no-print">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground" disabled={(user.status || '').toLowerCase() === 'terminated'} onClick={() => openEditModal(user)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors text-destructive" onClick={() => deleteUser(user)}>
                          <Trash2 size={14} />
                        </button>
                        {(user.status || '').toLowerCase() === 'terminated' ? (
                          <button
                            onClick={() => reactivateUser(user)}
                            className="px-2 py-1 rounded text-[10px] font-bold border border-green-500/20 text-green-500 hover:bg-green-500/5 transition-colors"
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => setTerminateTarget(user)}
                            className="px-2 py-1 rounded text-[10px] font-bold border border-destructive/20 text-destructive hover:bg-destructive/5 transition-colors"
                          >
                            Terminate
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-4 border-t border-border/50 no-print">
            <p className="text-xs text-muted-foreground">Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, sorted.length)} of {sorted.length}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-20 text-muted-foreground">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`w-7 h-7 rounded-md text-xs font-bold transition-colors ${page === i + 1 ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'}`}>{i + 1}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-20 text-muted-foreground">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showUserModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUserModal(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="fixed inset-0 z-[101] flex items-center justify-center p-4">
              <div className="w-full max-w-md rounded-2xl glass-card p-6 shadow-2xl border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-foreground">{editingUser ? 'Edit Team Member' : 'Add New Member'}</h3>
                  <button onClick={() => setShowUserModal(false)} className="p-2 hover:bg-muted rounded-full transition-colors"><X size={20} /></button>
                </div>
                <form onSubmit={saveUser} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground ml-1">Full Name</label>
                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Enter name" className="bg-muted/30 border-white/5" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground ml-1">Email Address</label>
                    <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required placeholder="Email address" className="bg-muted/30 border-white/5" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground ml-1">Role Type</label>
                    <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as any })} className="w-full h-10 px-3 rounded-md bg-muted/30 border border-white/5 text-foreground outline-none focus:ring-1 ring-primary/50">
                      <option value="User">User</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  {!editingUser && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-muted-foreground ml-1">Initial Password</label>
                      <Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required placeholder="Set password" className="bg-muted/30 border-white/5" />
                    </div>
                  )}
                  <div className="pt-4 flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setShowUserModal(false)}>Cancel</Button>
                    <Button type="submit" className="flex-1 btn-gradient">Save Member</Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}

        {terminateTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTerminateTarget(null)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="fixed inset-0 z-[101] flex items-center justify-center p-4">
              <div className="w-full max-w-sm rounded-2xl glass-card p-6 shadow-2xl border border-white/10 text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} className="text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Suspend Access?</h3>
                <p className="text-sm text-muted-foreground mb-6">You are about to terminate <span className="text-foreground font-bold">{terminateTarget.name}</span>. They will lose all access to the system immediately.</p>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setTerminateTarget(null)}>No, Keep</Button>
                  <Button onClick={terminateUser} className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground">Yes, Terminate</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
