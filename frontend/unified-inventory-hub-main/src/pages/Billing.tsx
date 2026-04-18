import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, Printer, Download, CheckCircle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { isEmpty } from '@/lib/validation';
import { toast } from 'sonner';
import InvoicePrintout from '@/components/printing/InvoicePrintout';

type LineItem = {
  id: string | number;
  itemId?: string | number;
  name: string;
  sku: string;
  qty: number;
  price: number;
  gst: number;
  discount: number;
  total: number;
};

type InventoryItem = {
  id: string | number;
  name: string;
  sku: string;
  mrp: number;
  gst: number;
};

export default function Billing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    gstin: '',
    address: '',
    state: ''
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceNo, setInvoiceNo] = useState('Loading...');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchNextInvoiceNumber = async () => {
    try {
      const res = await api.get<{ nextNumber: string }>('/bills/next-number');
      setInvoiceNo(res.data.nextNumber);
    } catch (err) {
      console.error("Failed to fetch next invoice number", err);
      // Fallback
      setInvoiceNo(`INV-${Date.now().toString().slice(-6)}`);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await api.get<InventoryItem[]>('/inventory');
      setInventory(res.data || []);
    } catch (err) {
      console.error("Inventory fetch failed", err);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setCurrentUser(res.data);
    } catch (err) {
      console.error("User fetch failed", err);
    }
  };

  const fetchBill = async (billId: string) => {
    const res = await api.get<any>(`/bills/${billId}`);
    if (res.data && res.data.bill) {
      const b = res.data.bill;
      setInvoiceNo(b.invoice_no);
      setCustomer({
        name: b.customer_name || '',
        phone: b.customer_phone || '',
        email: b.customer_email || '',
        gstin: b.customer_gst || '',
        address: b.customer_address || '',
        state: b.customer_state || ''
      });

      const items = res.data?.items || [];
      setLineItems(
        items.map((i: any, idx: number) => ({
          id: i.id || idx,
          itemId: i.item_id,
          name: i.name || i.item_name || '',
          sku: i.sku || '',
          qty: Number(i.qty || 0),
          price: Number(i.mrp || 0),
          gst: Number(i.gst || 0),
          discount: Number(i.discount || 0),
          total: (Number(i.qty || 0) * Number(i.mrp || 0)) - Number(i.discount || 0)
        }))
      );
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([fetchInventory(), fetchCurrentUser()]);
        if (isEdit && id) {
          await fetchBill(id!);
        } else {
          await fetchNextInvoiceNumber();
          
          // Import draft bill items from Catalog POS
          // @ts-ignore - Check state dynamically
          const cartItems = location.state?.cartItems;
          if (cartItems && cartItems.length > 0) {
             const mappedLineItems = cartItems.map((c: any, idx: number) => ({
                 id: "pos-" + Date.now() + "-" + idx,
                 itemId: c.product.id,
                 name: c.product.name,
                 sku: c.product.sku,
                 qty: c.qty,
                 price: Number(c.product.mrp),
                 gst: Number(c.product.gst),
                 discount: 0,
                 total: Number(c.product.mrp) * c.qty
             }));
             setLineItems(mappedLineItems);
          } else {
             setLineItems([{ id: Date.now(), name: '', sku: '', qty: 1, price: 0, gst: 0, discount: 0, total: 0 }]);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load billing');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let taxableAmount = 0;

    lineItems.forEach(item => {
      const q = Math.max(0, Number(item.qty || 0));
      const p = Math.max(0, Number(item.price || 0));
      const itemGross = q * p;
      const dPercent = Math.max(0, Number(item.discount || 0));
      const dAmount = (itemGross * dPercent) / 100;
      const itemNetGross = itemGross - dAmount;

      const gPercent = Math.max(0, Number(item.gst || 0)) / 100;
      const itemTaxable = itemNetGross / (1 + gPercent);
      const itemTax = itemNetGross - itemTaxable;

      subtotal += itemGross;
      discountTotal += dAmount;
      taxableAmount += itemTaxable;
      taxTotal += itemTax;
    });

    const grandTotal = subtotal - discountTotal;

    return {
      subtotal,
      discountTotal,
      taxableAmount,
      taxTotal,
      cgst: taxTotal / 2,
      sgst: taxTotal / 2,
      grandTotal
    };
  }, [lineItems]);

  const handleItemSelect = (lineId: string | number, itemId: string) => {
    const item = inventory.find(i => String(i.id) === String(itemId));
    if (!item) return;

    setLineItems(prev =>
      prev.map(li =>
        li.id === lineId ? {
          ...li,
          itemId: item.id,
          name: item.name,
          sku: item.sku || '',
          price: Number(item.mrp || 0),
          gst: Number(item.gst || 0),
          total: (Math.max(0, Number(li.qty || 1)) * Math.max(0, Number(item.mrp || 0))) - Math.max(0, Number(li.discount || 0))
        } : li
      )
    );
  };

  const setItemField = (lineId: string | number, field: keyof LineItem, value: any) => {
    setLineItems(prev => prev.map(li => {
      if (li.id === lineId) {
        // Prepare base updated object with string and sanitized number variants
        const stringVal = String(value);

        // Handle numbers safely. If we're typing a decimal, NumberVal might be NaN/Infinity temporary.
        // We use a safe computation but KEEP the string value in the state so the input doesn't reset.
        const numVal = field === 'name' || field === 'sku' ? value : (parseFloat(stringVal) || 0);

        const safeQty = Math.max(0, field === 'qty' ? numVal : li.qty);
        const safePrice = Math.max(0, field === 'price' ? numVal : li.price);
        const safeDisc = Math.max(0, field === 'discount' ? numVal : li.discount);

        const updated = {
          ...li,
          [field]: value, // Keep raw value to allow typing (like "10.")
          total: (safeQty * safePrice) - safeDisc
        };

        return updated;
      }
      return li;
    }));
  };

  const addLineItem = () => {
    setLineItems(prev => [...prev, { id: Date.now(), name: '', sku: '', qty: 1, price: 0, gst: 0, discount: 0, total: 0 }]);
  };

  const [successfullySaved, setSuccessfullySaved] = useState(false);

  const removeLineItem = (lineId: string | number) => {
    setLineItems(prev => prev.filter(li => li.id !== lineId));
  };

  const handleSave = async () => {
    if (isEmpty(customer.name)) {
      toast.error('Customer name is required');
      return;
    }
    if (!lineItems.length) {
      toast.error('Add at least one item');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        invoice_no: invoiceNo,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email,
        customer_gst: customer.gstin,
        customer_address: customer.address,
        customer_state: customer.state,
        items: lineItems.map(li => ({
          item_id: li.itemId,
          qty: Number(li.qty),
          mrp: Number(li.price),
          gst: Number(li.gst),
          discount: Number(li.discount)
        })),
        total: totals.grandTotal,
        subtotal: totals.taxableAmount
      };

      if (isEdit && id) {
        await api.post('/billing', { ...payload, billId: id });
      } else {
        await api.post('/billing', payload);
      }

      toast.success('Invoice saved successfully');
      setSuccessfullySaved(true);

      // We don't navigate immediately. We trigger print and let them decide to leave.
      setTimeout(() => window.print(), 800);

    } catch (err: any) {
      toast.error(err.message || 'Failed to save bill');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground px-6 py-8">Initialising billing engine…</div>;

  return (
    <DashboardLayout>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print, #invoice-print * { visibility: visible; }
          #invoice-print { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8 no-print">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{isEdit ? 'Modify Invoice' : 'New Transaction'}</h1>
            <p className="text-muted-foreground mt-2">Generate professional GST compliant tax invoices</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Invoice Number</p>
            <p className="text-xl font-black text-primary">{invoiceNo}</p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-8 rounded-2xl glass-card border border-white/5 shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-1.5 h-6 bg-primary rounded-full" />
                <h2 className="text-xl font-bold text-foreground">Customer Details</h2>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Customer Name</Label>
                  <Input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Legal Name" className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Contact Number</Label>
                  <Input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="+91 00000 00000" className="bg-white/5 border-white/10" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Email ID</Label>
                  <Input value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="billing@client.com" className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">GST Identification No.</Label>
                  <Input value={customer.gstin} onChange={(e) => setCustomer({ ...customer, gstin: e.target.value })} placeholder="15 Digit GSTIN" className="bg-white/5 border-white/10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Address</Label>
                <Input value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} placeholder="Street, Building, Landmark" className="bg-white/5 border-white/10" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">State</Label>
                  <Input value={customer.state} onChange={(e) => setCustomer({ ...customer, state: e.target.value })} placeholder="Place of Supply" className="bg-white/5 border-white/10" />
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl glass-card border border-white/5 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
                  <h2 className="text-xl font-bold text-foreground">Billable Items</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={addLineItem} className="text-primary hover:bg-primary/10 font-bold uppercase text-[10px] tracking-widest"><Plus size={14} className="mr-1" /> Add Entry</Button>
              </div>

              <div className="space-y-4">
                {lineItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-3 items-end bg-white/5 p-4 rounded-xl border border-white/5 transition-all hover:border-primary/20">
                    <div className="col-span-4">
                      <Label className="text-[9px] uppercase font-bold text-muted-foreground mb-1 block">Selected Product</Label>
                      <select
                        className="w-full h-10 px-3 rounded-lg bg-card border border-white/10 text-foreground text-sm outline-none focus:ring-1 ring-primary/50"
                        value={item.itemId ? String(item.itemId) : ''}
                        onChange={(e) => handleItemSelect(item.id, e.target.value)}
                      >
                        <option value="">Choose item...</option>
                        {inventory.map(inv => (
                          <option key={inv.id} value={inv.id}>{inv.name} (₹{inv.mrp})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1">
                      <Label className="text-[9px] uppercase font-bold text-muted-foreground mb-1 block">Qty</Label>
                      <Input type="number" value={item.qty} onChange={(e) => setItemField(item.id, 'qty', e.target.value)} className="bg-card h-10" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[9px] uppercase font-bold text-muted-foreground mb-1 block">Rate (₹)</Label>
                      <Input type="number" value={item.price} readOnly className="bg-muted h-10 cursor-not-allowed opacity-70" />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-[9px] uppercase font-bold text-muted-foreground mb-1 block">Disc</Label>
                      <Input type="number" value={item.discount} onChange={(e) => setItemField(item.id, 'discount', e.target.value)} className="bg-card h-10" />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-[9px] uppercase font-bold text-muted-foreground mb-1 block">GST%</Label>
                      <Input type="number" value={item.gst} onChange={(e) => setItemField(item.id, 'gst', e.target.value)} className="bg-card h-10" />
                    </div>
                    <div className="col-span-2 text-right px-2 pb-2">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-1">Total (Net)</span>
                      <span className="font-bold text-foreground">₹{item.total.toFixed(2)}</span>
                    </div>
                    <div className="col-span-1 text-right">
                      <button onClick={() => removeLineItem(item.id)} className="p-2.5 hover:bg-destructive/10 rounded-lg text-destructive transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-8 rounded-2xl glass-card border border-white/5 shadow-2xl sticky top-24">
              <h2 className="text-xl font-bold text-foreground mb-6">Total Bill</h2>
              <div className="space-y-4 border-b border-white/5 pb-6 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gross Value</span>
                  <span className="font-semibold text-foreground">₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trade Discount</span>
                  <span className="font-semibold text-destructive">-₹{totals.discountTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Included GST Portion</span>
                  <div className="text-right">
                    <span className="font-semibold text-cyan-500 block">₹{totals.taxTotal.toFixed(2)}</span>
                    <span className="text-[10px] text-muted-foreground">(CGST: ₹{totals.cgst.toFixed(2)} + SGST: ₹{totals.sgst.toFixed(2)})</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mb-8">
                <span className="font-bold text-muted-foreground uppercase text-xs tracking-widest">Total Bill Amount</span>
                <span className="text-4xl font-black text-primary">₹{totals.grandTotal.toFixed(2)}</span>
              </div>
              <div className="space-y-3">
                <Button className="w-full btn-gradient py-7 text-lg font-black uppercase tracking-widest shadow-lg shadow-primary/20" onClick={handleSave} disabled={saving}>
                  {saving ? 'Validating...' : 'Finalize & Print'}
                </Button>
                <Button variant="outline" className="w-full border-white/10 h-12" onClick={() => navigate('/bills')}>
                  Discard Draft
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <InvoicePrintout
        bill={{
          ...customer,
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_email: customer.email,
          customer_gst: customer.gstin,
          customer_address: customer.address,
          customer_state: customer.state,
          invoice_no: invoiceNo,
          subtotal: totals.taxableAmount,
          total: totals.grandTotal,
          username: currentUser?.username,
          total_discount: totals.discountTotal
        }}
        items={lineItems}
      />

      <AnimatePresence>
        {successfullySaved && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg no-print"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md p-10 rounded-3xl glass-card text-center border border-white/10 shadow-2xl"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <Printer size={40} className="text-green-500" />
              </div>
              <h2 className="text-3xl font-black text-foreground mb-2">Invoice Finalized</h2>
              <p className="text-muted-foreground mb-8">The billing cycle for <strong>{invoiceNo}</strong> is complete and stock has been adjusted.</p>

              <div className="space-y-3">
                <Button className="w-full btn-gradient py-6 text-lg font-bold uppercase tracking-widest" onClick={() => window.print()}>
                  <Printer size={18} className="mr-2" /> Re-Print Invoice
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-12 border-white/10" onClick={() => window.location.reload()}>
                    New Bill
                  </Button>
                  <Button variant="outline" className="h-12 border-white/10" onClick={() => navigate('/bills')}>
                    History
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
