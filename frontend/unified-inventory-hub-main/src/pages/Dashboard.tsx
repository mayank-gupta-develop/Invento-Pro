import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { TrendingUp, Package, BarChart3, AlertCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get<any>("/dashboard");
        if (mounted) {
          setData(res.data);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) setError(err.response?.data?.error || err.message || "Failed to load dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const salesData = useMemo(() => data?.salesGrowth || [], [data]);
  const inventoryData = useMemo(() => data?.inventoryGrowth || [], [data]);
  const topProducts = useMemo(() => data?.topProducts || [], [data]);
  const recentActivity = useMemo(() => data?.recentActivity || [], [data]);

  const cards = useMemo(() => [
    { icon: TrendingUp, label: 'Total Revenue', value: data?.revenue ?? '—', change: '+', positive: true },
    { icon: Package, label: 'Products', value: data?.products ?? '—', change: '+', positive: true },
    { icon: BarChart3, label: 'Orders', value: data?.orders ?? '—', change: '+', positive: true },
    { icon: AlertCircle, label: 'Low Stock', value: data?.lowStock ?? '—', change: '', positive: false },
  ], [data]);

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back! Here's your business overview.</p>
        </motion.div>

        {loading && <div className="text-sm text-muted-foreground">Loading dashboard…</div>}
        {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">{error}</div>}

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid md:grid-cols-4 gap-6">
          {cards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div key={idx} variants={itemVariants} className="p-6 rounded-lg glass-card-hover">
                <div className="flex items-start justify-between mb-4">
                  <Icon className="w-8 h-8 text-primary" />
                  <div className={`flex items-center gap-1 text-sm font-medium ${stat.positive ? 'text-green-600' : 'text-destructive'}`}>
                    {stat.positive ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                    {stat.change}
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="lg:col-span-2 p-6 rounded-lg glass-card">
            <h2 className="text-lg font-semibold text-foreground mb-6">Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="label" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="p-6 rounded-lg glass-card">
            <h2 className="text-lg font-semibold text-foreground mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <Button onClick={() => navigate("/billing")} className="w-full btn-gradient justify-start">Create Invoice</Button>
              <Button onClick={() => navigate("/inventory")} variant="outline" className="w-full justify-start border-border/50">Add Inventory Item</Button>
              <Button onClick={() => navigate("/sales")} variant="outline" className="w-full justify-start border-border/50">View Reports</Button>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }} className="p-6 rounded-lg glass-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
              <a href="/bills" className="text-primary hover:text-primary/80 text-sm font-medium">View all</a>
            </div>
            <div className="space-y-4">
              {recentActivity.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium text-foreground">{item.message}</p>
                    <p className="text-sm text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.7 }} className="p-6 rounded-lg glass-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Top Products</h2>
              <a href="/inventory" className="text-primary hover:text-primary/80 text-sm font-medium">Manage</a>
            </div>
            <div className="space-y-4">
              {topProducts.map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="text-sm text-muted-foreground">Sales: {p.sales}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    ₹{Number(p.revenue || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
