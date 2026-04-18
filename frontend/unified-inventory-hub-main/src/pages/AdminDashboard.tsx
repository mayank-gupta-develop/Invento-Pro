import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Package, Activity, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get<any>('/admin/dashboard');
        if (mounted) {
          setData(res.data);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Failed to load admin dashboard');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const cards = useMemo(() => ([
    { icon: Users, label: 'Total Users', value: data?.totalUsers ?? '—', change: '', positive: true },
    { icon: Activity, label: 'Active Users', value: data?.activeUsers ?? '—', change: '', positive: true },
  ]), [data]);

  const trafficData = useMemo(() => data?.traffic || [], [data]);
  const usersGrowthData = useMemo(() => data?.usersGrowth || [], [data]);
  const activityLog = useMemo(() => data?.recentActivity || [], [data]);

  return (
    <DashboardLayout userRole="admin">
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">System overview and analytics</p>
        </motion.div>

        {loading && <div className="text-sm text-muted-foreground">Loading admin dashboard…</div>}
        {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">{error}</div>}

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div key={idx} variants={itemVariants} whileHover={{ y: -4 }} className="p-6 rounded-lg glass-card-hover space-y-3">
                <div className="flex items-start justify-between">
                  <Icon size={24} className="text-primary" />
                  <div className={`flex items-center gap-1 text-sm font-medium ${stat.positive ? 'text-green-600' : 'text-destructive'}`}>
                    {stat.positive ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                    {stat.change}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="p-6 rounded-lg glass-card">
            <h2 className="text-lg font-semibold text-foreground mb-4">Traffic Overview</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="traffic" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="sessions" stroke="hsl(var(--accent))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }} className="p-6 rounded-lg glass-card">
            <h2 className="text-lg font-semibold text-foreground mb-4">Users Growth</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usersGrowthData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="users" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                <Bar dataKey="active" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="lg:col-span-2 rounded-lg glass-card overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <h2 className="text-lg font-semibold text-foreground">Users Overview</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Join Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.users || []).map((user: any) => (
                    <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-primary-foreground text-sm font-semibold">{(user.name || user.username || 'U').charAt(0)}</div>
                          <span className="font-medium text-foreground">{user.name || user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{user.email}</td>
                      <td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">{user.role}</span></td>
                      <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === 'active' || user.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>{user.status || 'Active'}</span></td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{user.createdAt || user.created_at || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }} className="p-6 rounded-lg glass-card">
            <h2 className="text-lg font-semibold text-foreground mb-4">Activity Log</h2>
            <div className="space-y-3">
              {(activityLog || []).map((activity: any, idx: number) => (
                <motion.div key={idx} whileHover={{ x: 4 }} className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/50 transition-all">
                  <p className="text-sm font-medium text-foreground">{activity.message || activity.action}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
