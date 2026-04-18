import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, Printer } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '@/lib/api';
import UniversalPrintLayout from '@/components/printing/UniversalPrintLayout';

const COLORS = ['hsl(230,80%,45%)', 'hsl(190,80%,45%)', 'hsl(225,65%,40%)', 'hsl(220,55%,35%)', 'hsl(215,45%,30%)'];

export default function Sales() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    q: ''
  });

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.q) params.append('q', filters.q);

      const res = await api.get<any>(`/sales?${params.toString()}`);
      setData(res.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [filters.startDate, filters.endDate, filters.q]);

  const summary = data?.summary || {};
  const trend = useMemo(() => data?.trend || [], [data]);
  const topProducts = useMemo(() => (data?.topProducts || []).map((p: any) => ({ ...p, revenue: Number(p.revenue) })), [data]);
  const recentSales = useMemo(() => data?.recentSales || [], [data]);

  const downloadCsv = async () => {
    try {
      const res = await fetch('/api/sales/export', {
        credentials: 'include',
        headers: {
          Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch {
      setError('Failed to download CSV');
    }
  };

  return (
    <DashboardLayout>


      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8" id="sales-content">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Sales Reports</h1>
            <p className="text-muted-foreground mt-2 font-medium">Deep dive into your business growth and total billings</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-border/50" onClick={downloadCsv}><Download size={18} className="mr-2" />CSV Export</Button>
            <Button variant="outline" className="border-border/50" onClick={() => window.print()}><Printer size={18} className="mr-2" />Print Sales Report</Button>
          </div>
        </motion.div>

        <UniversalPrintLayout 
          id="sales-table-print"
          title="GST Sales Report"
          subtitle={`Sales performance from ${filters.startDate || 'Foundation'} to ${filters.endDate || 'Present'}`}
          columns={[
            { header: 'Date', key: 'date', render: (val) => new Date(val).toLocaleDateString() },
            { header: 'Customer/Client', key: 'customer', render: (val) => (val || 'Guest User').toUpperCase() },
            { header: 'Amount', key: 'amount', align: 'right', render: (val) => `₹${Number(val).toFixed(2)}` }
          ]}
          data={recentSales}
          summaryRow={
            <>
              <td colSpan={2} className="px-4 py-3 text-right font-black uppercase text-xs">Total Sales Value</td>
              <td className="px-4 py-3 text-right text-lg font-black">₹{Number(summary.revenue ?? 0).toFixed(2)}</td>
            </>
          }
        />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex flex-wrap gap-4 no-print items-end">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Start Date</label>
            <input 
              type="date" 
              value={filters.startDate} 
              onChange={e => setFilters({...filters, startDate: e.target.value})}
              className="px-4 py-2 rounded-lg bg-card border border-border/50 text-foreground text-sm outline-none focus:ring-1 ring-primary" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">End Date</label>
            <input 
              type="date" 
              value={filters.endDate} 
              onChange={e => setFilters({...filters, endDate: e.target.value})}
              className="px-4 py-2 rounded-lg bg-card border border-border/50 text-foreground text-sm outline-none focus:ring-1 ring-primary" 
            />
          </div>
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Search Customer</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Name of client..."
                value={filters.q} 
                onChange={e => setFilters({...filters, q: e.target.value})}
                className="w-full px-4 py-2 rounded-lg bg-card border border-border/50 text-foreground text-sm outline-none focus:ring-1 ring-primary pr-10" 
              />
              {filters.q && <button onClick={() => setFilters({...filters, q: ''})} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">×</button>}
            </div>
          </div>
          <Button variant="ghost" className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest mt-6" onClick={() => setFilters({startDate: '', endDate: '', q: ''})}>Clear Filters</Button>
        </motion.div>

        {loading && <div className="text-sm text-muted-foreground no-print font-medium animate-pulse">Fetching e-commerce data…</div>}
        {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2 no-print">{error}</div>}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="grid md:grid-cols-4 gap-6 no-print">
          {[
            { label: 'Total Sales Bill', value: `₹${Number(summary.revenue ?? 0).toLocaleString()}`, color: 'text-primary' },
            { label: 'Total Invoices', value: summary.orders ?? '0', color: 'text-foreground' },
            { label: 'Ticket Size', value: `₹${Number(summary.avgOrder ?? 0).toLocaleString()}`, color: 'text-foreground' },
            { label: 'Conversion', value: summary.conversion ?? '—', color: 'text-green-500' },
          ].map((metric, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 + idx * 0.05 }} className="p-6 rounded-2xl glass-card border border-white/5 shadow-xl">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">{metric.label}</p>
              <p className={`text-3xl font-black ${metric.color} tracking-tight`}>{metric.value}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 no-print">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="p-8 rounded-2xl glass-card border border-white/5 shadow-xl chart-container">
            <h2 className="text-xl font-bold text-foreground mb-8">Revenue Progression</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-10" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} 
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="p-8 rounded-2xl glass-card border border-white/5 shadow-xl chart-container">
            <h2 className="text-xl font-bold text-foreground mb-8">Market Segmentation</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={topProducts} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="revenue">
                  {topProducts.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {topProducts.slice(0, 4).map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i]}} />
                  <span className="text-[10px] text-muted-foreground truncate font-bold uppercase">{p.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="p-8 rounded-2xl glass-card border border-white/5 shadow-xl no-print">
          <h2 className="text-xl font-bold text-foreground mb-6">Recent Transactions</h2>
          {(!loading && recentSales.length === 0) && (
            <div className="text-center py-12 text-muted-foreground font-medium italic">No transactions recorded in this period</div>
          )}
          {recentSales.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Booking Date</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Client Identifier</th>
                    <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Settlement Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale: any, idx: number) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{new Date(sale.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-foreground uppercase font-bold tracking-tight">{sale.customer || 'Guest User'}</td>
                      <td className="px-6 py-4 text-right text-sm font-black text-primary">₹{Number(sale.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
