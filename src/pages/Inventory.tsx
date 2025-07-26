import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getProducts, updateProduct, type Product } from '@/lib/storage';
import { Package, AlertTriangle, TrendingUp, Plus, Minus } from 'lucide-react';

const Inventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [stockChange, setStockChange] = useState('');
  const [operation, setOperation] = useState<'add' | 'remove'>('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    const allProducts = getProducts();
    setProducts(allProducts);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { status: 'out', label: 'Out of Stock', color: 'destructive' };
    if (stock <= 5) return { status: 'low', label: 'Low Stock', color: 'warning' };
    return { status: 'good', label: 'In Stock', color: 'success' };
  };

  const handleStockUpdate = (e: React.FormEvent) => {
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
      ? selectedProduct.currentStock + changeAmount
      : Math.max(0, selectedProduct.currentStock - changeAmount);

    updateProduct(selectedProduct.id, { currentStock: newStock });
    
    toast({
      title: "Success",
      description: `Stock ${operation === 'add' ? 'added' : 'removed'} successfully`,
    });

    setStockChange('');
    setIsDialogOpen(false);
    loadProducts();
  };

  const openStockDialog = (product: Product, op: 'add' | 'remove') => {
    setSelectedProduct(product);
    setOperation(op);
    setStockChange('');
    setIsDialogOpen(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    const stockStatus = getStockStatus(product.currentStock);
    if (filterStatus === 'all') return true;
    if (filterStatus === 'low') return stockStatus.status === 'low';
    if (filterStatus === 'out') return stockStatus.status === 'out';
    
    return true;
  });

  const stockSummary = {
    total: products.length,
    lowStock: products.filter(p => p.currentStock <= 5 && p.currentStock > 0).length,
    outOfStock: products.filter(p => p.currentStock === 0).length,
    totalValue: products.reduce((sum, p) => sum + (p.currentStock * p.manufacturingCost), 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
      </div>

      {/* Inventory Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
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
            placeholder="Search products by name or SKU..."
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
              All
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
        </div>
      </Card>

      {/* Products List */}
      <div className="space-y-4">
        {filteredProducts.map((product) => {
          const stockStatus = getStockStatus(product.currentStock);
          
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
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">SKU</p>
                      <p className="font-medium">{product.sku}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Current Stock</p>
                      <p className={`font-medium text-lg ${
                        product.currentStock === 0 ? 'text-destructive' :
                        product.currentStock <= 5 ? 'text-warning' : 'text-success'
                      }`}>
                        {product.currentStock}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Unit Cost</p>
                      <p className="font-medium">Rs{product.manufacturingCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Stock Value</p>
                      <p className="font-medium">
                        Rs{(product.currentStock * product.manufacturingCost).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => openStockDialog(product, 'add')}
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Stock
                  </Button>
                  <Button
                    onClick={() => openStockDialog(product, 'remove')}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    disabled={product.currentStock === 0}
                  >
                    <Minus className="h-4 w-4" />
                    Remove Stock
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="p-8 text-center shadow-card">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground">
            {searchTerm || filterStatus !== 'all' 
              ? 'No products match your current filters.' 
              : 'Add some products to start managing inventory.'}
          </p>
        </Card>
      )}

      {/* Stock Update Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {operation === 'add' ? 'Add Stock' : 'Remove Stock'} - {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStockUpdate} className="space-y-4">
            <div>
              <Label htmlFor="current-stock">Current Stock</Label>
              <Input
                id="current-stock"
                value={selectedProduct?.currentStock || 0}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="stock-change">
                Quantity to {operation === 'add' ? 'Add' : 'Remove'}
              </Label>
              <Input
                id="stock-change"
                type="number"
                value={stockChange}
                onChange={(e) => setStockChange(e.target.value)}
                placeholder="Enter quantity"
                min="1"
                required
              />
            </div>
            {operation === 'add' && (
              <div>
                <Label>New Stock Level</Label>
                <Input
                  value={selectedProduct ? selectedProduct.currentStock + (parseInt(stockChange) || 0) : 0}
                  disabled
                  className="bg-muted"
                />
              </div>
            )}
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
    </div>
  );
};

export default Inventory;