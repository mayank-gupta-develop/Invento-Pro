import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Search } from 'lucide-react';
import { useState, useMemo } from 'react';

interface InventoryItem {
  id: string | number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  inCatalog?: boolean;
}

interface AddToCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItems: (items: InventoryItem[]) => void;
  inventoryItems: InventoryItem[];
}

export default function AddToCatalogModal({
  isOpen,
  onClose,
  onAddItems,
  inventoryItems,
}: AddToCatalogModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    return inventoryItems.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [inventoryItems, searchQuery]);

  const handleSelectItem = (id: string | number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((item) => item.id)));
    }
  };

  const handleAddSelected = () => {
    const itemsToAdd = inventoryItems.filter((item) => selectedIds.has(item.id));
    onAddItems(itemsToAdd);
    setSelectedIds(new Set());
    setSearchQuery('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl rounded-lg bg-card/95 backdrop-blur-md border border-border/50 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-border/50">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Add Items to Catalog</h2>
                  <p className="text-sm text-muted-foreground mt-1">Select inventory items to add to your catalog</p>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <X size={20} className="text-muted-foreground" />
                </motion.button>
              </div>

              <div className="p-4 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/50 border border-border/50 focus-within:border-primary/50 transition-colors">
                  <Search size={18} className="text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name, SKU, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
                  />
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground">No items found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    <div className="p-4 bg-muted/10 hover:bg-muted/20 transition-colors flex items-center gap-3 sticky top-0 z-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                        onChange={handleSelectAll}
                        className="w-5 h-5 rounded border-border/50 cursor-pointer accent-primary"
                      />
                      <span className="text-sm font-medium text-foreground">Select All ({filteredItems.length})</span>
                    </div>
                    {filteredItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 flex items-center gap-3 hover:bg-muted/10 transition-colors cursor-pointer"
                        onClick={() => handleSelectItem(item.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 rounded border-border/50 cursor-pointer accent-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">SKU: {item.sku}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{item.category}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-foreground">₹{item.price.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Stock: {item.stock}</p>
                        </div>
                        {selectedIds.has(item.id) && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center">
                            <Check size={14} className="text-primary-foreground" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border/50 bg-muted/10 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedIds.size > 0 ? <span className="font-medium text-foreground">{selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected</span> : 'No items selected'}
                </p>
                <div className="flex items-center gap-3">
                  <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors">Cancel</button>
                  <button
                    onClick={handleAddSelected}
                    disabled={selectedIds.size === 0}
                    className="px-6 py-2 text-sm font-medium btn-gradient disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Selected
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
