import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Package, Download, Printer } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import AddItemModal from '@/components/AddItemModal';
import UniversalPrintLayout from '@/components/printing/UniversalPrintLayout';
interface InventoryItem {
  id: number | string;
  name: string;
  sku: string;
  category: string;
  qty: number;
  mrp: number;
  gst: number;
  purchase_price: number;
  profit: number;
  show_in_catalog: boolean;
  status?: string;
}

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get<InventoryItem[]>('/items');
      setItems(res.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = useMemo(() => items.filter(item =>
    (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  ), [items, searchTerm]);

  const toggleCatalog = async (item: InventoryItem) => {
    try {
      await api.put(`/items/${item.id}/catalog`);
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSuccess = () => {
    fetchItems();
  };

  const handleEdit = async (item: InventoryItem) => {
    const name = prompt('Name?', item.name) ?? item.name;
    const sku = prompt('SKU?', item.sku) ?? item.sku;
    const category = prompt('Category?', item.category) ?? item.category;
    const mrp = Number(prompt('MRP?', String(item.mrp)) || item.mrp);
    const gst = Number(prompt('GST %?', String(item.gst)) || item.gst);
    try {
      await api.put(`/items/${item.id}`, { name, sku, category, mrp, gst });
      fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update item');
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    if (!confirm(`Delete ${item.name}? This will remove all batch data.`)) return;
    try {
      await api.delete(`/items/${item.id}`);
      fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to delete item');
    }
  };

  const downloadCsv = async () => {
    try {
      const res = await fetch('/api/items/export', {
        credentials: 'include',
        headers: {
          Authorization: localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch {
      setError('Failed to download CSV');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Low Stock': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Out of Stock': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout>

      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8" id="inventory-content">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
            <p className="text-muted-foreground mt-2">Manage your product inventory and profitability</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-border/50" onClick={downloadCsv}><Download size={18} className="mr-2" />CSV</Button>
            <Button variant="outline" className="border-border/50" onClick={() => window.print()}><Printer size={18} className="mr-2" />Print</Button>
            <AddItemModal onSuccess={handleAddSuccess} />
          </div>
        </motion.div>

        <UniversalPrintLayout 
          id="inventory-print"
          title="Inventory Assets Report"
          subtitle={`Current stock valuation and levels for all products as of ${new Date().toLocaleDateString()}`}
          columns={[
            { header: 'Product', key: 'name' },
            { header: 'SKU', key: 'sku' },
            { header: 'Qty', key: 'qty', align: 'center' },
            { header: 'Purchase Price', key: 'purchase_price', align: 'right', render: (val: any) => `₹${Number(val).toFixed(2)}` },
            { header: 'MRP', key: 'mrp', align: 'right', render: (val: any) => `₹${Number(val).toFixed(2)}` },
            { header: 'GST %', key: 'gst', align: 'center', render: (val: any) => `${val}%` },
            { header: 'Profit', key: 'profit', align: 'right', render: (val: any) => `₹${Number(val).toFixed(2)}` },
            { header: 'Status', key: 'qty', render: (val: any) => Number(val) <= 0 ? 'Out of Stock' : Number(val) < 5 ? 'Low Stock' : 'In Stock' }
          ]}
          data={filteredItems}
        />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="relative no-print">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input type="text" placeholder="Search by name or SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 bg-card/70 backdrop-blur-md border-border/50 focus:border-primary focus:ring-1 ring-primary/20" />
        </motion.div>

        {loading && <div className="text-sm text-muted-foreground no-print">Syncing inventory with server…</div>}
        {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2 no-print">{error}</div>}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="rounded-xl glass-card overflow-hidden no-print">
          <div className="overflow-x-auto" id="inventory-table">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">SKU</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Qty</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Purchase Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">MRP</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">GST %</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Profit</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground no-print">Catalog</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold text-foreground no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const qty = Number(item.qty || 0);
                  const status = qty <= 0 ? 'Out of Stock' : qty < 5 ? 'Low Stock' : 'In Stock';
                  const profit = Number(item.profit || 0);
                  
                  return (
                  <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: idx * 0.05 }} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600/10 to-cyan-500/10 flex items-center justify-center">
                          <Package size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{item.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{item.sku}</td>
                    <td className="px-6 py-4 text-sm font-bold text-foreground">{qty}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-muted-foreground">₹{Number(item.purchase_price || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">₹{Number(item.mrp || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{item.gst}%</td>
                    <td className={`px-6 py-4 text-sm font-bold ${profit >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                      ₹{profit.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider status-badge ${getStatusColor(status)}`}>{status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleCatalog(item)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${item.show_in_catalog 
                          ? 'bg-primary/20 text-primary border border-primary/20' 
                          : 'bg-muted/50 text-muted-foreground border border-border/50 hover:bg-muted'}`}
                      >
                        {item.show_in_catalog ? 'In Catalog' : 'Show in Catalog'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground" onClick={() => handleEdit(item)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive" onClick={() => handleDelete(item)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )})}
              </tbody>
            </table>
          </div>
        </motion.div>

        {(!loading && filteredItems.length === 0) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <Package size={48} className="mx-auto text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">No items matching your search</p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
