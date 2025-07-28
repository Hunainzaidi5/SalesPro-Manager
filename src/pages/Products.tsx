import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getProducts, addProduct, updateProduct, deleteProduct, getProductSalesStats } from '@/lib/database';
import type { Product } from '@/lib/supabase';
import { Plus, Edit, Trash2, DollarSign, TrendingUp, Package, ShoppingCart } from 'lucide-react';

interface ProductWithStats extends Product {
  salesStats: {
    totalSales: number;
    totalRevenue: number;
  };
}

const Products = () => {
  const [products, setProducts] = useState<ProductWithStats[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Form state
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
      
      // Load sales stats for each product
      const productsWithStats = await Promise.all(
        allProducts.map(async (product) => {
          const salesStats = await getProductSalesStats(product.id);
          return {
            ...product,
            salesStats
          };
        })
      );
      
      setProducts(productsWithStats);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        await addProduct(productData);
        toast({
          title: "Success",
          description: "Product added successfully",
        });
      }
      
      resetForm();
      setIsDialogOpen(false);
      await loadProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      retailPrice: product.retail_price.toString(),
      manufacturingCost: product.manufacturing_cost.toString(),
      currentStock: product.current_stock.toString(),
      category: product.category || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        toast({
          title: "Success",
          description: "Product deleted successfully",
        });
        await loadProducts();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete product",
          variant: "destructive",
        });
      }
    }
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
    setEditingProduct(null);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { status: 'out', label: 'Out of Stock', color: 'destructive' };
    if (stock <= 5) return { status: 'low', label: 'Low Stock', color: 'warning' };
    return { status: 'good', label: 'In Stock', color: 'success' };
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    if (filterCategory !== 'all' && product.category !== filterCategory) return false;
    
    return true;
  });

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (p.current_stock * p.retail_price), 0);
  const totalSales = products.reduce((sum, p) => sum + p.salesStats.totalSales, 0);
  const totalRevenue = products.reduce((sum, p) => sum + p.salesStats.totalRevenue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage finished goods for sales</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="shadow-button">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter product name"
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
                  <Label htmlFor="retailPrice">Retail Price *</Label>
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
                  <Label htmlFor="manufacturingCost">Manufacturing Cost *</Label>
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
                <Label htmlFor="currentStock">Available Stock</Label>
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
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Product Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <DollarSign className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inventory Value</p>
              <p className="text-2xl font-bold">Rs{totalValue.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <ShoppingCart className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sales</p>
              <p className="text-2xl font-bold">{totalSales}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">Rs{totalRevenue.toFixed(2)}</p>
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

      {/* Products List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product.current_stock);
            const profitMargin = ((product.retail_price - product.manufacturing_cost) / product.retail_price * 100);
            
            return (
              <Card key={product.id} className="p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <Badge variant={stockStatus.color as any}>
                        {stockStatus.label}
                      </Badge>
                      <Badge variant="outline">
                        {profitMargin.toFixed(1)}% Margin
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">SKU</p>
                        <p className="font-medium">{product.sku || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Category</p>
                        <p className="font-medium">{product.category || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Retail Price</p>
                        <p className="font-medium text-success">Rs{product.retail_price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cost</p>
                        <p className="font-medium text-destructive">Rs{product.manufacturing_cost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Available Stock</p>
                        <p className={`font-medium text-lg ${
                          product.current_stock === 0 ? 'text-destructive' :
                          product.current_stock <= 5 ? 'text-warning' : 'text-success'
                        }`}>
                          {product.current_stock}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Sales</p>
                        <p className="font-medium">{product.salesStats.totalSales}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {filteredProducts.length === 0 && !loading && (
        <Card className="p-8 text-center shadow-card">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground">
            {searchTerm || filterCategory !== 'all' 
              ? 'No products match your current filters.' 
              : 'Add some products to start selling.'}
          </p>
        </Card>
      )}
    </div>
  );
};

export default Products;