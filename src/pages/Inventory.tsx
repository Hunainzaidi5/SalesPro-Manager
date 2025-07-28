import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getProducts, updateProduct, addProduct, deleteProduct } from '@/lib/database';
import type { Product } from '@/lib/supabase';
import { Package, AlertTriangle, TrendingUp, Plus, Minus, Edit, Trash2, Warehouse } from 'lucide-react';

const Inventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [stockChange, setStockChange] = useState('');
  const [operation, setOperation] = useState<'add' | 'remove'>('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Form state for adding/editing inventory items
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    retailPrice: '',
    manufacturingCost: '',
    currentStock: '',
    category: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const allProducts = await getProducts();
      setProducts(allProducts);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load inventory items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { status: 'out', label: 'Out of Stock', color: 'destructive' };
    if (stock <= 5) return { status: 'low', label: 'Low Stock', color: 'warning' };
    return { status: 'good', label: 'In Stock', color: 'success' };
  };

  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !stockChange) {
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
      ? selectedProduct.current_stock + changeAmount
      : Math.max(0, selectedProduct.current_stock - changeAmount);

    try {
      await updateProduct(selectedProduct.id, { current_stock: newStock });
      
      toast({
        title: "Success",
        description: `Stock ${operation === 'add' ? 'added' : 'removed'} successfully`,
      });

      setStockChange('');
      setIsDialogOpen(false);
      await loadProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update stock",
        variant: "destructive",
      });
    }
  };

  const handleAddInventoryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.retailPrice || !formData.manufacturingCost) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      name: formData.name,
      sku: formData.sku,
      retail_price: parseFloat(formData.retailPrice),
      manufacturing_cost: parseFloat(formData.manufacturingCost),
      current_stock: parseInt(formData.currentStock) || 0,
      category: formData.category
    };

    try {
      await addProduct(productData);
      toast({
        title: "Success",
        description: "Inventory item added successfully",
      });
      resetForm();
      setIsAddDialogOpen(false);
      await loadProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add inventory item",
        variant: "destructive",
      });
    }
  };

  const handleEditInventoryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct || !formData.name || !formData.retailPrice || !formData.manufacturingCost) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const productData = {
      name: formData.name,
      sku: formData.sku,
      retail_price: parseFloat(formData.retailPrice),
      manufacturing_cost: parseFloat(formData.manufacturingCost),
      current_stock: parseInt(formData.currentStock) || 0,
      category: formData.category
    };

    try {
      await updateProduct(selectedProduct.id, productData);
      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      });
      resetForm();
      setIsEditDialogOpen(false);
      await loadProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update inventory item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInventoryItem = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        await deleteProduct(productId);
        toast({
          title: "Success",
          description: "Inventory item deleted successfully",
        });
        await loadProducts();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete inventory item",
          variant: "destructive",
        });
      }
    }
  };

  const openStockDialog = (product: Product, op: 'add' | 'remove') => {
    setSelectedProduct(product);
    setOperation(op);
    setStockChange('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      retailPrice: product.retail_price.toString(),
      manufacturingCost: product.manufacturing_cost.toString(),
      currentStock: product.current_stock.toString(),
      category: product.category || ''
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      retailPrice: '',
      manufacturingCost: '',
      currentStock: '',
      category: ''
    });
    setSelectedProduct(null);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    const stockStatus = getStockStatus(product.current_stock);
    if (filterStatus === 'all') return true;
    if (filterStatus === 'low') return stockStatus.status === 'low';
    if (filterStatus === 'out') return stockStatus.status === 'out';
    
    if (filterCategory !== 'all' && product.category !== filterCategory) return false;
    
    return true;
  });

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const stockSummary = {
    total: products.length,
    lowStock: products.filter(p => p.current_stock <= 5 && p.current_stock > 0).length,
    outOfStock: products.filter(p => p.current_stock === 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.current_stock * p.manufacturing_cost), 0)
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
                />
              </div>
              
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  placeholder="Enter SKU (optional)"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="Enter category (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="retailPrice">Unit Price *</Label>
                  <Input
                    id="retailPrice"
                    type="number"
                    step="0.01"
                    value={formData.retailPrice}
                    onChange={(e) => setFormData({...formData, retailPrice: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="manufacturingCost">Cost Price *</Label>
                  <Input
                    id="manufacturingCost"
                    type="number"
                    step="0.01"
                    value={formData.manufacturingCost}
                    onChange={(e) => setFormData({...formData, manufacturingCost: e.target.value})}
                    placeholder="0.00"
                    required
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
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Add Item
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
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
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product.current_stock);
            
            return (
              <Card key={product.id} className="p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <Badge variant={stockStatus.color as any}>
                        {stockStatus.label}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">SKU</p>
                        <p className="font-medium">{product.sku || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Category</p>
                        <p className="font-medium">{product.category || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Current Stock</p>
                        <p className={`font-medium text-lg ${
                          product.current_stock === 0 ? 'text-destructive' :
                          product.current_stock <= 5 ? 'text-warning' : 'text-success'
                        }`}>
                          {product.current_stock}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Unit Cost</p>
                        <p className="font-medium">Rs{product.manufacturing_cost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Stock Value</p>
                        <p className="font-medium">
                          Rs{(product.current_stock * product.manufacturing_cost).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteInventoryItem(product.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openStockDialog(product, 'add')}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openStockDialog(product, 'remove')}
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

      {filteredProducts.length === 0 && !loading && (
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
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {operation === 'add' ? 'Add Stock' : 'Remove Stock'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
              />
            </div>
            
            <div>
              <Label htmlFor="editSku">SKU</Label>
              <Input
                id="editSku"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                placeholder="Enter SKU (optional)"
              />
            </div>
            
            <div>
              <Label htmlFor="editCategory">Category</Label>
              <Input
                id="editCategory"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="Enter category (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editRetailPrice">Unit Price *</Label>
                <Input
                  id="editRetailPrice"
                  type="number"
                  step="0.01"
                  value={formData.retailPrice}
                  onChange={(e) => setFormData({...formData, retailPrice: e.target.value})}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editManufacturingCost">Cost Price *</Label>
                <Input
                  id="editManufacturingCost"
                  type="number"
                  step="0.01"
                  value={formData.manufacturingCost}
                  onChange={(e) => setFormData({...formData, manufacturingCost: e.target.value})}
                  placeholder="0.00"
                  required
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
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Update Item
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
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