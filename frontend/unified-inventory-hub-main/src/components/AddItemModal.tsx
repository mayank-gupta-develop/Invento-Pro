import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { post } from "@/lib/api";
import { isEmpty } from "@/lib/validation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface AddItemModalProps {
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export default function AddItemModal({ onSuccess, trigger }: AddItemModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    qty: "",
    purchase_price: "",
    mrp: "",
    gst: "18",
    show_in_catalog: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation (Issue 2)
    if (
      isEmpty(formData.name) ||
      isEmpty(formData.sku) ||
      isEmpty(formData.category) ||
      isEmpty(formData.qty) ||
      isEmpty(formData.purchase_price) ||
      isEmpty(formData.mrp) ||
      isEmpty(formData.gst)
    ) {
      toast.error("All fields are required");
      return;
    }

    setLoading(true);
    try {
      await post("/items", {
        ...formData,
        qty: Number(formData.qty),
        purchase_price: Number(formData.purchase_price),
        mrp: Number(formData.mrp),
        gst: Number(formData.gst),
      });
      toast.success("Item added successfully");
      setOpen(false);
      onSuccess();
      setFormData({
        name: "",
        sku: "",
        category: "",
        qty: "",
        purchase_price: "",
        mrp: "",
        gst: "18",
        show_in_catalog: false,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Plus size={18} /> Add New Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Inventory Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Wireless Mouse"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="SKU-001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Electronics"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qty">Qty</Label>
              <Input
                id="qty"
                type="number"
                min="0"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: Math.max(0, Number(e.target.value)).toString() })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_price">Purchase Price</Label>
              <Input
                id="purchase_price"
                type="number"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mrp">MRP</Label>
              <Input
                id="mrp"
                type="number"
                min="0"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: Math.max(0, Number(e.target.value)).toString() })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="gst">GST (%)</Label>
              <Input
                id="gst"
                type="number"
                value={formData.gst}
                onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2 pb-2">
              <Checkbox
                id="show_in_catalog"
                checked={formData.show_in_catalog}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, show_in_catalog: !!checked })
                }
              />
              <Label htmlFor="show_in_catalog" className="text-sm font-normal">
                Show in catalog
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
