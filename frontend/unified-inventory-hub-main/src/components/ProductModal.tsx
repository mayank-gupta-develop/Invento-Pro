import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  product: {
    id: string | number;
    name: string;
    sku: string;
    category: string;
    price: number;
    gst: number;
    stock: number;
    image: string;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  };
}

export default function ProductModal({ isOpen, onClose, product, onUpdate }: ProductModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      setLoading(true);
      await api.put(`/items/${product.id}/image-upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      alert("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const removeImage = async () => {
    try {
      setLoading(true);
      await api.delete(`/items/${product.id}/image-remove`);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert("Remove failed");
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    'In Stock': 'bg-green-500/20 text-green-600 border-green-500/30',
    'Low Stock': 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    'Out of Stock': 'bg-red-500/20 text-red-600 border-red-500/30',
  };

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || 'bg-muted text-muted-foreground border-border';
  };

  const taxablePrice = product.price / (1 + (product.gst / 100));
  const gstAmount = product.price - taxablePrice;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} onClick={(e) => e.stopPropagation()} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl glass-card overflow-hidden shadow-2xl border border-white/10 bg-card">
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <h2 className="text-xl font-bold text-foreground">Product Intelligence</h2>
                <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors"><X size={20} /></button>
              </div>

              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="w-full aspect-square rounded-xl bg-muted/30 border border-white/5 overflow-hidden relative group">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-black/20 text-muted-foreground transition-all group-hover:bg-black/30 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                          <Upload size={32} className="mb-2 opacity-30" />
                          <span className="text-xs font-bold uppercase tracking-wider opacity-50">Upload An Image</span>
                        </div>
                      )}
                      
                      {loading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><div className="w-6 h-6 border-2 border-white border-t-transparent animate-spin rounded-full" /></div>}
                      
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    </div>
                    <div className="flex gap-2">
                       <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={loading} className="flex-1 text-[10px] font-bold uppercase"><Upload size={14} className="mr-2" /> Change</Button>
                       <Button variant="destructive" size="sm" onClick={removeImage} disabled={loading} className="flex-1 text-[10px] font-bold uppercase"><Trash2 size={14} className="mr-2" /> Remove</Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(product.status)}`}>{product.status}</span>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{product.category}</span>
                      </div>
                      <h3 className="text-3xl font-bold text-foreground tracking-tight">{product.name}</h3>
                      <p className="text-sm font-mono text-muted-foreground mt-1 text-primary">SKU: {product.sku}</p>
                    </div>

                    <div className="p-5 rounded-xl bg-white/5 border border-white/5 space-y-3">
                       <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">GST Inclusive Price</span>
                        <span className="text-2xl font-black text-foreground">₹{Number(product.price).toFixed(2)}</span>
                      </div>
                      <div className="border-t border-white/10 pt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Excluded Tax (Taxable)</span>
                          <span className="font-medium">₹{taxablePrice.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">GST Component ({product.gst}%)</span>
                          <span className="font-medium text-cyan-500">₹{gstAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/20 border border-white/5">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Stock Availability</p>
                      <p className="text-2xl font-bold text-foreground">{product.stock} <span className="text-sm font-medium text-muted-foreground">Units left</span></p>
                    </div>

                    <div className="flex gap-3">
                      <Button className="flex-1 btn-gradient py-6 font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/20" onClick={onClose}><Eye size={16} className="mr-2" /> Close Preview</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
