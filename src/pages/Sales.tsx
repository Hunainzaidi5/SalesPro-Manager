import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getProducts, getSales, addSale } from '@/lib/database';
import type { Product, Sale } from '@/lib/supabase';
import { Plus, ShoppingCart, TrendingUp, DollarSign, Calendar } from 'lucide-react';

const Sales = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsData, salesData] = await Promise.all([
        getProducts(),
        getSales()
      ]);
      setProducts(productsData);
      setSales(salesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProductId || !quantity) {
      toast({
        title: "Validation Error",
        description: "Please select a product and enter quantity",
        variant: "destructive",
      });
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const quantityNum = parseInt(quantity);
    if (quantityNum <= 0) {
      toast({
        title: "Validation Error",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (quantityNum > product.current_stock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.current_stock} items available`,
        variant: "destructive",
      });
      return;
    }

    const sale = {
      product_id: selectedProductId,
      product_name: product.name,
      quantity_sold: quantityNum,
      date: new Date().toISOString(),
      retail_price: product.retail_price,
      manufacturing_cost: product.manufacturing_cost,
      revenue: product.retail_price * quantityNum,
      profit: (product.retail_price - product.manufacturing_cost) * quantityNum
    };

    const result = addSale(sale);
    if (result) {
      toast({
        title: "Success",
        description: "Sale recorded successfully",
      });
      setSelectedProductId('');
      setQuantity('');
      setIsDialogOpen(false);
      loadData();
    } else {
      toast({
        title: "Error",
        description: "Failed to record sale",
        variant: "destructive",
      });
    }
  };

  const getFilteredSales = () => {
    let filtered = sales;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.product_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(sale => new Date(sale.date) >= today);
        break;
      case 'week':
        filtered = filtered.filter(sale => new Date(sale.date) >= weekAgo);
        break;
      case 'month':
        filtered = filtered.filter(sale => new Date(sale.date) >= monthAgo);
        break;
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const filteredSales = getFilteredSales();

  const salesSummary = {
    totalSales: filteredSales.length,
    totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.revenue, 0),
    totalProfit: filteredSales.reduce((sum, sale) => sum + sale.profit, 0),
    avgSaleValue: filteredSales.length > 0 
      ? filteredSales.reduce((sum, sale) => sum + sale.revenue, 0) / filteredSales.length 
      : 0
  };

  const availableProducts = products.filter(p => p.current_stock > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sales Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-button">
              <Plus className="mr-2 h-4 w-4" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Record New Sale</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="product">Product</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Stock: {product.current_stock}) - Rs{product.retail_price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedProductId && (
                <div className="p-3 bg-muted/50 rounded-lg text-sm">
                  {(() => {
                    const product = products.find(p => p.id === selectedProductId);
                    if (!product) return null;
                    
                    const quantityNum = parseInt(quantity) || 0;
                    const revenue = product.retail_price * quantityNum;
                    const profit = (product.retail_price - product.manufacturing_cost) * quantityNum;
                    
                    return (
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Retail Price:</span>
                          <span>Rs{product.retail_price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Manufacturing Cost:</span>
                          <span>Rs{product.manufacturing_cost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Available Stock:</span>
                          <span>{product.current_stock}</span>
                        </div>
                        {quantityNum > 0 && (
                          <>
                            <hr className="my-2" />
                            <div className="flex justify-between font-medium">
                              <span>Total Revenue:</span>
                              <span className="text-success">Rs{revenue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span>Total Profit:</span>
                              <span className="text-success">Rs{profit.toFixed(2)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
              
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  min="1"
                  required
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Record Sale
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sales Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShoppingCart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sales</p>
              <p className="text-2xl font-bold">{salesSummary.totalSales}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <DollarSign className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">Rs{salesSummary.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Profit</p>
              <p className="text-2xl font-bold">Rs{salesSummary.totalProfit.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Calendar className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Sale Value</p>
              <p className="text-2xl font-bold">Rs{salesSummary.avgSaleValue.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 shadow-card">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search sales by product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex gap-2">
            <Button
              variant={dateFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setDateFilter('all')}
              size="sm"
            >
              All Time
            </Button>
            <Button
              variant={dateFilter === 'today' ? 'default' : 'outline'}
              onClick={() => setDateFilter('today')}
              size="sm"
            >
              Today
            </Button>
            <Button
              variant={dateFilter === 'week' ? 'default' : 'outline'}
              onClick={() => setDateFilter('week')}
              size="sm"
            >
              This Week
            </Button>
            <Button
              variant={dateFilter === 'month' ? 'default' : 'outline'}
              onClick={() => setDateFilter('month')}
              size="sm"
            >
              This Month
            </Button>
          </div>
        </div>
      </Card>

      {/* Sales List */}
      <div className="space-y-4">
        {filteredSales.map((sale) => (
          <Card key={sale.id} className="p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{sale.product_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(sale.date).toLocaleString()}
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-muted-foreground">Quantity</p>
                  <p className="font-medium text-lg">{sale.quantity_sold}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Unit Price</p>
                  <p className="font-medium">Rs{sale.retail_price.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Revenue</p>
                  <p className="font-medium text-success">Rs{sale.revenue.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Profit</p>
                  <p className="font-medium text-success">Rs{sale.profit.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredSales.length === 0 && (
        <Card className="p-8 text-center shadow-card">
          <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No sales found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || dateFilter !== 'all' 
              ? 'No sales match your current filters.' 
              : 'Record your first sale to get started.'}
          </p>
          {!searchTerm && dateFilter === 'all' && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record Sale
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};

export default Sales;