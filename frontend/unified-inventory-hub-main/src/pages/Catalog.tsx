import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Eye, Plus, ShoppingBag } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ProductModal from '@/components/ProductModal';
import AddToCatalogModal from '@/components/AddToCatalogModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function Catalog() {
  const navigate = useNavigate();
  const statusColors = {
    'In Stock': 'bg-green-500/20 text-green-600 border-green-500/30',
    'Low Stock': 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    'Out of Stock': 'bg-red-500/20 text-red-600 border-red-500/30',
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.2 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3 } },
  };

  type CatalogProduct = {
    id: string;
    name: string;
    sku: string;
    mrp: number;
    gst: number;
    qty: number;
    image_url?: string;
    category?: string;
    show_in_catalog: boolean;
  };

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cart State for POS
  const [cart, setCart] = useState<{product: CatalogProduct, qty: number}[]>([]);
  const [draftQty, setDraftQty] = useState<Record<string, number>>({});

  const handleAddToCart = (product: CatalogProduct) => {
    const qtyToAdd = draftQty[product.id] || 1;
    if (qtyToAdd > Number(product.qty)) {
      toast.error(`Only ${product.qty} units available in stock`);
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + qtyToAdd } : item);
      }
      return [...prev, { product, qty: qtyToAdd }];
    });
    
    // Reset qty input for this product
    setDraftQty(prev => ({ ...prev, [product.id]: 1 }));
    toast.success(`Added ${qtyToAdd}x ${product.name} to Bill`);
  };

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const res = await api.get<CatalogProduct[]>('/catalog');
      // Only show items that are explicitly in catalog
      const catalogOnly = (res.data || []).filter(p => p.show_in_catalog);
      setProducts(catalogOnly);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleRemove = async (id: number | string) => {
    try {
      await api.put(`/items/${id}/catalog`);
      fetchCatalog();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to remove item');
    }
  };

  const handleAddItems = async (items: any[]) => {
    try {
      for (const item of items) {
        await api.put(`/items/${item.id}/catalog`);
      }
      fetchCatalog();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to add items');
    }
  };

  const statusForStock = (stock: number) => {
    if (stock <= 0) return 'Out of Stock';
    if (stock < 5) return 'Low Stock';
    return 'In Stock';
  };

  const inventoryItems = useMemo(() => products.map(p => ({ 
    ...p, 
    price: Number(p.mrp), 
    stock: Number(p.qty), 
    category: p.category || '' 
  })), [products]);

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Digital Catalog</h1>
            <p className="text-muted-foreground mt-2">Elevate your product presentation</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="btn-gradient">
            <Plus size={20} className="mr-2" />Sync from Inventory
          </Button>
        </motion.div>

        {loading && <div className="text-sm text-muted-foreground">Polishing catalog view…</div>}
        {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">{error}</div>}

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {products.map((product) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
                layout
                whileHover={{ scale: 1.02, y: -8 }}
                className="group rounded-2xl glass-card overflow-hidden hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 border border-white/5"
              >
                <div className="h-48 relative overflow-hidden bg-muted/20">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black/20 text-muted-foreground transition-transform duration-500 group-hover:scale-105">
                      <span className="text-xs font-bold uppercase tracking-widest opacity-50">Upload An Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 flex items-end p-4 transition-opacity">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedProduct(product)} className="w-full py-2 rounded-lg bg-white/20 backdrop-blur-md text-white font-bold text-xs uppercase tracking-widest border border-white/20">
                      View
                    </motion.button>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{product.category || 'Standard'}</span>
                    <h3 className="font-bold text-lg text-foreground truncate mt-0.5">{product.name}</h3>
                    <p className="text-[10px] font-mono text-muted-foreground">ID: {product.sku}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-tighter">Gross Price</p>
                      <span className="text-xl font-black text-foreground">₹{Number(product.mrp || 0).toFixed(2)}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColors[statusForStock(Number(product.qty))]}`}>{statusForStock(Number(product.qty))}</span>
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    <Input 
                      type="number" 
                      min="1" 
                      value={draftQty[product.id] || 1} 
                      onChange={(e) => setDraftQty({ ...draftQty, [product.id]: parseInt(e.target.value) || 1 })}
                      className="w-16 h-8 text-xs font-bold text-center"
                    />
                    <Button variant="secondary" size="sm" onClick={() => handleAddToCart(product)} className="flex-1 text-xs font-bold uppercase tracking-tighter">
                      Add to Bill
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(product.id)} className="px-2 text-destructive hover:bg-destructive/10 text-xs font-bold uppercase tracking-tighter transition-all">
                      Remove
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {!loading && products.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-muted/5 rounded-3xl border-2 border-dashed border-white/5">
            <Plus size={48} className="mx-auto text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">Catalog is empty. Add items from inventory to begin.</p>
          </motion.div>
        )}

        {/* Floating Cart Interface */}
        <AnimatePresence>
          {cart.length > 0 && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-white/10 z-50 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between w-full max-w-[1400px] mx-auto px-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex flex-col items-center justify-center relative border border-primary/50 shadow-[0_0_20px_-5px] shadow-primary">
                    <ShoppingBag className="text-primary" size={20} />
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] w-6 h-6 rounded-full flex items-center justify-center font-black">{cart.reduce((a,c) => a + c.qty, 0)}</span>
                  </div>
                  <div>
                    <p className="font-black text-xl leading-none text-foreground">Draft Bill Ready</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                      {cart.length} Unique Items
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" onClick={() => setCart([])} className="text-destructive font-bold uppercase tracking-tight text-xs">Clear Cart</Button>
                  <Button size="lg" onClick={() => navigate('/billing', { state: { cartItems: cart } })} className="font-black uppercase tracking-widest bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400">
                    Proceed to Checkout
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectedProduct && (
        <ProductModal 
          isOpen={!!selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onUpdate={fetchCatalog}
          product={{
            id: selectedProduct.id,
            name: selectedProduct.name,
            sku: selectedProduct.sku,
            category: selectedProduct.category || 'Uncategorized',
            price: selectedProduct.mrp,
            gst: selectedProduct.gst,
            stock: Number(selectedProduct.qty),
            image: selectedProduct.image_url || '',
            status: statusForStock(Number(selectedProduct.qty)) as 'In Stock' | 'Low Stock' | 'Out of Stock'
          }} 
        />
      )}

      <AddToCatalogModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddItems={handleAddItems}
        inventoryItems={inventoryItems}
      />
    </DashboardLayout>
  );
}
