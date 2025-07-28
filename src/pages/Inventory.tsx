import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getInventoryItems, updateInventoryItem, addInventoryItem, deleteInventoryItem } from '@/lib/database';
import type { InventoryItem } from '@/lib/supabase';
import { Package, AlertTriangle, TrendingUp, Plus, Minus, Edit, Trash2, Warehouse } from 'lucide-react';

const Inventory = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [stockChange, setStockChange] = useState('');
  const [operation, setOperation] = useState<'add' | 'remove'>('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state for adding/editing inventory items
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    unitCost: '',
    currentStock: '',
    category: '',
    minStockLevel: '5'
  });

  useEffect(() => {
    loadInventoryItems();
  }, []);

  const loadInventoryItems = async () => {
    setLoading(true);
    try {
      const allInventoryItems = await getInventoryItems();
      setInventoryItems(allInventoryItems);
    } catch (error) {
      console.error('Error loading inventory items:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stock: number, minStockLevel: number) => {
    if (stock === 0) return { status: 'out', label: 'Out of Stock', color: 'destructive' };
    if (stock <= minStockLevel) return { status: 'low', label: 'Low Stock', color: 'warning' };
    return { status: 'good', label: 'In Stock', color: 'success' };
  };

  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInventoryItem || !stockChange) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    const changeAmount = parseInt(stockChange);
    if (isNaN(changeAmount) || changeAmount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }

    const newStock = operation === 'add' 
      ? selectedInventoryItem.current_stock + changeAmount
      : Math.max(0, selectedInventoryItem.current_stock - changeAmount);

    setSubmitting(true);
    try {
      await updateInventoryItem(selectedInventoryItem.id, { current_stock: newStock });
      
      toast({
        title: "Success",
        description: `Stock ${operation === 'add' ? 'added' : 'removed'} successfully`,
      });

      setStockChange('');
      setIsDialogOpen(false);
      await loadInventoryItems();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddInventoryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.unitCost) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const inventoryItemData = {
      name: formData.name,
      sku: formData.sku || null,
      unit_cost: parseFloat(formData.unitCost),
      current_stock: parseInt(formData.currentStock) || 0,
      category: formData.category || null,
      min_stock_level: parseInt(formData.minStockLevel) || 5
    };

    setSubmitting(true);
    try {
      await addInventoryItem(inventoryItemData);
      toast({
        title: "Success",
        description: "Inventory item added successfully",
      });
      resetForm();
      setIsAddDialogOpen(false);
      await loadInventoryItems();
    } catch (error) {
      console.error('Error adding inventory item:', error);
      toast({
        title: "Error",
        description: "Failed to add inventory item",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditInventoryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInventoryItem || !formData.name || !formData.unitCost) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const inventoryItemData = {
      name: formData.name,
      sku: formData.sku || null,
      unit_cost: parseFloat(formData.unitCost),
      current_stock: parseInt(formData.currentStock) || 0,
      category: formData.category || null,
      min_stock_level: parseInt(formData.minStockLevel) || 5
    };

    setSubmitting(true);
    try {
      await updateInventoryItem(selectedInventoryItem.id, inventoryItemData);
      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      });
      resetForm();
      setIsEditDialogOpen(false);
      await loadInventoryItems();
    } catch (error) {
      console.error('Error updating inventory item:', error);
      toast({
        title: "Error",
        description: "Failed to update inventory item",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInventoryItem = async (inventoryItemId: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await deleteInventoryItem(inventoryItemId);
        toast({
          title: "Success",
          description: "Inventory item deleted successfully",
        });
        await loadInventoryItems();
      } catch (error) {
        console.error('Error deleting inventory item:', error);
        toast({
          title: "Error",
          description: "Failed to delete inventory item",
          variant: "destructive",
        });
      }
    }
  };

  const openStockDialog = (inventoryItem: InventoryItem, op: 'add' | 'remove') => {
    setSelectedInventoryItem(inventoryItem);
    setOperation(op);
    setStockChange('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (inventoryItem: InventoryItem) => {
    setSelectedInventoryItem(inventoryItem);
    setFormData({
      name: inventoryItem.name,
      sku: inventoryItem.sku || '',
      unitCost: inventoryItem.unit_cost.toString(),
      currentStock: inventoryItem.current_stock.toString(),
      category: inventoryItem.category || '',
      minStockLevel: inventoryItem.min_stock_level.toString()
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      unitCost: '',
      currentStock: '',
      category: '',
      minStockLevel: '5'
    });
    setSelectedInventoryItem(null);
  };

  const filteredInventoryItems = inventoryItems.filter(inventoryItem => {
    const matchesSearch = inventoryItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (inventoryItem.sku && inventoryItem.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    const stockStatus = getStockStatus(inventoryItem.current_stock, inventoryItem.min_stock_level);
    if (filterStatus === 'all') return true;
    if (filterStatus === 'low') return stockStatus.status === 'low';
    if (filterStatus === 'out') return stockStatus.status === 'out';
    
    if (filterCategory !== 'all' && inventoryItem.category !== filterCategory) return false;
    
    return true;
  });

  const categories = [...new Set(inventoryItems.map(i => i.category).filter(Boolean))];
  const stockSummary = {
    total: inventoryItems.length,
    lowStock: inventoryItems.filter(i => i.current_stock <= i.min_stock_level && i.current_stock > 0).length,
    outOfStock: inventoryItems.filter(i => i.current_stock === 0).length,
    totalValue: inventoryItems.reduce((sum, i) => sum + (i.current_stock * i.unit_cost), 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage raw materials and stock items</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="shadow-button">
              <Plus className="mr-2 h-4 w-4" />
              Add Inventory Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Inventory Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddInventoryItem} className="space-y-4">
              <div>
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter item name"
                  required
                  disabled={submitting}
                />
              </div>
              
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  placeholder="Enter SKU (optional)"
                  disabled={submitting}
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="Enter category (optional)"
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unitCost">Unit Cost *</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({...formData, unitCost: e.target.value})}
                    placeholder="0.00"
                    required
                    disabled={submitting}
                  />
                </div>
                <div>
                  <Label htmlFor="minStockLevel">Min Stock Level</Label>
                  <Input
                    id="minStockLevel"
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({...formData, minStockLevel: e.target.value})}
                    placeholder="5"
                    disabled={submitting}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="currentStock">Initial Stock</Label>
                <Input
                  id="currentStock"
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({...formData, currentStock: e.target.value})}
                  placeholder="0"
                  disabled={submitting}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Item'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Inventory Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Warehouse className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{stockSummary.total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold">{stockSummary.lowStock}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Package className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold">{stockSummary.outOfStock}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inventory Value</p>
              <p className="text-2xl font-bold">Rs{stockSummary.totalValue.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 shadow-card">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search inventory items by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
              size="sm"
            >
              All Stock
            </Button>
            <Button
              variant={filterStatus === 'low' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('low')}
              size="sm"
            >
              Low Stock
            </Button>
            <Button
              variant={filterStatus === 'out' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('out')}
              size="sm"
            >
              Out of Stock
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterCategory('all')}
              size="sm"
            >
              All Categories
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={filterCategory === category ? 'default' : 'outline'}
                onClick={() => setFilterCategory(category)}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Inventory Items List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading inventory items...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInventoryItems.map((inventoryItem) => {
            const stockStatus = getStockStatus(inventoryItem.current_stock, inventoryItem.min_stock_level);
            
            return (
              <Card key={inventoryItem.id} className="p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{inventoryItem.name}</h3>
                      <Badge variant={stockStatus.color as any}>
                        {stockStatus.label}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">SKU</p>
                        <p className="font-medium">{inventoryItem.sku || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Category</p>
                        <p className="font-medium">{inventoryItem.category || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Current Stock</p>
                        <p className={`font-medium text-lg ${
                          inventoryItem.current_stock === 0 ? 'text-destructive' :
                          inventoryItem.current_stock <= inventoryItem.min_stock_level ? 'text-warning' : 'text-success'
                        }`}>
                          {inventoryItem.current_stock}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Unit Cost</p>
                        <p className="font-medium">Rs{inventoryItem.unit_cost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Min Stock Level</p>
                        <p className="font-medium">{inventoryItem.min_stock_level}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Stock Value</p>
                        <p className="font-medium">
                          Rs{(inventoryItem.current_stock * inventoryItem.unit_cost).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(inventoryItem)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteInventoryItem(inventoryItem.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openStockDialog(inventoryItem, 'add')}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openStockDialog(inventoryItem, 'remove')}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {filteredInventoryItems.length === 0 && !loading && (
        <Card className="p-8 text-center shadow-card">
          <Warehouse className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No inventory items found</h3>
          <p className="text-muted-foreground">
            {searchTerm || filterStatus !== 'all' || filterCategory !== 'all'
              ? 'No inventory items match your current filters.' 
              : 'Add some inventory items to start tracking stock.'}
          </p>
        </Card>
      )}

      {/* Stock Update Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {operation === 'add' ? 'Add Stock' : 'Remove Stock'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStockUpdate} className="space-y-4">
            <div>
              <Label htmlFor="stockChange">Quantity</Label>
              <Input
                id="stockChange"
                type="number"
                value={stockChange}
                onChange={(e) => setStockChange(e.target.value)}
                placeholder={`Enter quantity to ${operation}`}
                required
                disabled={submitting}
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? 'Updating...' : (operation === 'add' ? 'Add Stock' : 'Remove Stock')}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Inventory Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditInventoryItem} className="space-y-4">
            <div>
              <Label htmlFor="editName">Item Name *</Label>
              <Input
                id="editName"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter item name"
                required
                disabled={submitting}
              />
            </div>
            
            <div>
              <Label htmlFor="editSku">SKU</Label>
              <Input
                id="editSku"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                placeholder="Enter SKU (optional)"
                disabled={submitting}
              />
            </div>
            
            <div>
              <Label htmlFor="editCategory">Category</Label>
              <Input
                id="editCategory"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="Enter category (optional)"
                disabled={submitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editUnitCost">Unit Cost *</Label>
                <Input
                  id="editUnitCost"
                  type="number"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({...formData, unitCost: e.target.value})}
                  placeholder="0.00"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <Label htmlFor="editMinStockLevel">Min Stock Level</Label>
                <Input
                  id="editMinStockLevel"
                  type="number"
                  value={formData.minStockLevel}
                  onChange={(e) => setFormData({...formData, minStockLevel: e.target.value})}
                  placeholder="5"
                  disabled={submitting}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="editCurrentStock">Current Stock</Label>
              <Input
                id="editCurrentStock"
                type="number"
                value={formData.currentStock}
                onChange={(e) => setFormData({...formData, currentStock: e.target.value})}
                placeholder="0"
                disabled={submitting}
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Item'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;