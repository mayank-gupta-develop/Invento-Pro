import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Download, Printer, Plus, Trash2, Edit2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import InvoicePrintout from '@/components/printing/InvoicePrintout';
import UniversalPrintLayout from '@/components/printing/UniversalPrintLayout';

interface Bill {
  id: string | number;
  invoice_no?: string;
  customer_name: string;
  created_at: string;
  total: number;
}

export default function Bills() {
  const [searchTerm, setSearchTerm] = useState('');
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printData, setPrintData] = useState<{
    username: string;bill: any, items: any[]
} | null>(null);
  const [years, setYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [newYearLabel, setNewYearLabel] = useState('');
  const navigate = useNavigate();

  const fetchYears = async () => {
    try {
      const res = await api.get<string[]>('/bills/years');
      setYears(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await api.get<Bill[]>(`/bills${selectedYear ? `?year=${selectedYear}` : ''}`);
      setBills(res.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSequence = async () => {
    if (!newYearLabel.trim()) return toast.error("Please enter a year label");
    try {
      await api.post('/bills/reset-sequence', { newYear: newYearLabel.trim() });
      toast.success(`Started new sequence: ${newYearLabel}`);
      setIsResetModalOpen(false);
      setNewYearLabel('');
      fetchYears();
      fetchBills();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to reset sequence");
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  useEffect(() => {
    fetchBills();
  }, [selectedYear]);

  useEffect(() => {
    if (printData) {
      // Clear print data after a short delay to allow standard cleanup
      const timer = setTimeout(() => {
        setPrintData(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [printData]);

  const filteredBills = useMemo(() => bills.filter(bill =>
    (bill.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(bill.invoice_no || bill.id).toLowerCase().includes(searchTerm.toLowerCase())
  ), [bills, searchTerm]);

  const handlePrint = async (id: string | number) => {
    try {
      const res = await api.get<any>(`/bills/${id}/print`);
      if (res.data) {
        setPrintData(res.data);
        setTimeout(() => {
          window.print();
        }, 800);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to fetch print data");
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Delete this bill?')) return;
    try {
      await api.delete(`/bills/${id}`);
      fetchBills();
      toast.success("Bill deleted");
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to delete bill');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8 no-print">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bills History</h1>
            <p className="text-muted-foreground mt-2">Manage and print your GST invoices</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-border/50" onClick={() => navigate('/billing')}><Plus size={20} className="mr-2" />Create Bill</Button>
            <Button variant="outline" className="border-border/50" onClick={() => window.print()}><Printer size={18} className="mr-2" />Print List</Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex flex-col md:flex-row gap-4 no-print px-1">
          <div className="flex-1">
            <Input type="text" placeholder="Search by customer or invoice number..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-card/70 backdrop-blur-md border-border/50" />
          </div>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 rounded-lg bg-card/70 border border-border/50 text-sm focus:ring-1 ring-primary outline-none"
          >
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button variant="ghost" onClick={() => setIsResetModalOpen(true)} className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-primary transition-colors">
            Reset Numbers
          </Button>
        </motion.div>

        {loading && <div className="text-sm text-muted-foreground no-print">Loading history…</div>}
        {error && <div className="text-sm text-destructive no-print">{error}</div>}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="rounded-lg glass-card overflow-hidden no-print">
          <div className="overflow-x-auto" id="bills-history-table">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Invoice No</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill, idx) => (
                  <motion.tr key={bill.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: idx * 0.05 }} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{bill.invoice_no || bill.id}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{bill.customer_name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(bill.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">₹{Number(bill.total || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 no-print">
                      <div className="flex items-center gap-2">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-2 hover:bg-muted rounded-lg transition-colors" onClick={() => handlePrint(bill.id)}>
                          <Printer size={16} className="text-muted-foreground" />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-2 hover:bg-muted rounded-lg transition-colors" onClick={() => navigate(`/billing/${bill.id}`)}>
                          <Edit2 size={16} className="text-muted-foreground" />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="p-2 hover:bg-destructive/10 rounded-lg transition-colors" onClick={() => handleDelete(bill.id)}>
                          <Trash2 size={16} className="text-destructive" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {!loading && filteredBills.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No records found</div>
        )}
      </div>

      {!printData && (
        <UniversalPrintLayout 
          id="bills-history-print"
          title="Bills History Report"
          subtitle={`Summary of all generated GST invoices as of ${new Date().toLocaleDateString()}`}
          columns={[
            { header: 'Invoice No', key: 'invoice_no' },
            { header: 'Customer', key: 'customer_name' },
            { header: 'Date', key: 'created_at', render: (val) => new Date(val).toLocaleDateString() },
            { header: 'Amount', key: 'total', align: 'right', render: (val) => `₹${Number(val).toFixed(2)}` }
          ]}
          data={filteredBills}
        />
      )}

      {printData && (
        <InvoicePrintout 
          bill={{
            ...printData.bill,
            customer_name: printData.bill.customer_name,
            customer_gst: printData.bill.customer_gst,
            invoice_no: printData.bill.invoice_no,
            subtotal: Number(printData.bill.subtotal || 0),
            total: Number(printData.bill.total || 0),
            username: printData.username
          }}
          items={printData.items}
        />
      )}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">New Financial Year</h2>
            <p className="text-muted-foreground text-sm mb-6 font-medium">Resetting invoice numbers will start a new sequence from 1 with your desired label. Old bills remain unchanged.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1 mb-2 block">Invoice Prefix (Year Label)</label>
                <Input 
                  placeholder="e.g. 24-25 or 2027" 
                  value={newYearLabel} 
                  onChange={(e) => setNewYearLabel(e.target.value)}
                  className="bg-muted/30 border-border/50 h-12 text-lg font-bold"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsResetModalOpen(false)}>Cancel</Button>
                <Button className="flex-1 bg-primary font-bold shadow-lg shadow-primary/20" onClick={handleResetSequence}>Confirm Reset</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
