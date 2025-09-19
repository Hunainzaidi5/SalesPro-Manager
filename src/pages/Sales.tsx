import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSales, getVegetables, addSale, updateSale, deleteSale, addVegetable, deleteVegetable, updateVegetablePrices, updateVegetableStock } from '@/lib/database';
import type { Sale, Vegetable } from '@/lib/supabase';
import { Plus, ShoppingCart, TrendingUp, Edit, Trash2, Package, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const Sales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [vegetables, setVegetables] = useState<Vegetable[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isAddVegetableDialogOpen, setIsAddVegetableDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [selectedVegetableId, setSelectedVegetableId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Form states
  const [itemForm, setItemForm] = useState({
    selectedItemId: '',
    purchaseRate: '',
    salesRate: ''
  });

  const [stockForm, setStockForm] = useState({
    selectedItemId: '',
    quantity: ''
  });

  const [newVegetable, setNewVegetable] = useState({
    name: '',
    retail_price: '',
    manufacturing_cost: '',
    current_stock: '',
    unit: 'kg',
    category: 'Vegetables'
  });

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [salesData, vegetablesData] = await Promise.all([
          getSales(),
          getVegetables()
        ]);
        setSales(salesData);
        setVegetables(vegetablesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVegetableId || !quantity) {
      alert('Please select a vegetable and enter a quantity');
      return;
    }
    
    const selectedVegetable = vegetables.find(v => v.id === selectedVegetableId);
    if (!selectedVegetable) {
      alert('Selected vegetable not found');
      return;
    }
    
    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      alert('Please enter a valid quantity');
      return;
    }
    
    if (quantityNum > (selectedVegetable.current_stock || 0)) {
      alert(`Only ${selectedVegetable.current_stock} items available in stock`);
      return;
    }
    
    try {
      const saleData = {
        vegetable_id: selectedVegetableId,
        vegetable_name: selectedVegetable.name,
        quantity_sold: quantityNum,
        retail_price: selectedVegetable.retail_price,
        manufacturing_cost: selectedVegetable.manufacturing_cost,
        revenue: selectedVegetable.retail_price * quantityNum,
        profit: (selectedVegetable.retail_price - selectedVegetable.manufacturing_cost) * quantityNum,
        date: new Date().toISOString()
      };
      
      if (editingSale) {
        await updateSale(editingSale.id, saleData);
        setSales(sales.map(sale => sale.id === editingSale.id ? { ...sale, ...saleData } : sale));
      } else {
        const newSale = await addSale(saleData);
        setSales([...sales, newSale]);
        
        // Refetch vegetables to reflect DB trigger-updated stock
        const fresh = await getVegetables();
        setVegetables(fresh);
      }
      
      // Reset form
      setSelectedVegetableId('');
      setQuantity('');
      setEditingSale(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving sale:', error);
      alert('Failed to save sale');
    }
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setSelectedVegetableId(sale.vegetable_id);
    setQuantity(sale.quantity_sold.toString());
    setIsDialogOpen(true);
  };

  const handleDeleteSale = async (saleId: string) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        await deleteSale(saleId);
        setSales(sales.filter(sale => sale.id !== saleId));
      } catch (error) {
        console.error('Error deleting sale:', error);
        alert('Failed to delete sale');
      }
    }
  };

  const handleDeleteVegetable = async (vegetableId: string) => {
    if (!window.confirm('Are you sure you want to delete this vegetable? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteVegetable(vegetableId);
      setVegetables(vegetables.filter(veg => veg.id !== vegetableId));
      // Also remove any sales associated with this vegetable
      setSales(sales.filter(sale => sale.vegetable_id !== vegetableId));
      alert('Vegetable deleted successfully');
    } catch (error) {
      console.error('Error deleting vegetable:', error);
      alert('Failed to delete vegetable. Please try again.');
    }
  };

  const handleItemFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemForm.selectedItemId || !itemForm.purchaseRate || !itemForm.salesRate) {
      alert('Please fill in all fields');
      return;
    }

    const purchaseRate = parseFloat(itemForm.purchaseRate);
    const salesRate = parseFloat(itemForm.salesRate);

    if (isNaN(purchaseRate) || isNaN(salesRate) || purchaseRate < 0 || salesRate < 0) {
      alert('Please enter valid rates');
      return;
    }

    try {
      // Persist to database
      const updated = await updateVegetablePrices(itemForm.selectedItemId, salesRate, purchaseRate);
      if (updated) {
        // Refetch to ensure sync with DB and triggers
        const fresh = await getVegetables();
        setVegetables(fresh);
        alert('Item prices updated successfully');
      } else {
        throw new Error('Failed to update item prices');
      }
      
      setItemForm({
        selectedItemId: '',
        purchaseRate: '',
        salesRate: ''
      });
      setIsItemDialogOpen(false);
    } catch (error) {
      console.error('Error updating item prices:', error);
      alert('Failed to update item prices');
    }
  };

  const handleAddVegetable = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newVegetable.name || !newVegetable.retail_price || !newVegetable.manufacturing_cost) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const retailPrice = parseFloat(newVegetable.retail_price);
      const manufacturingCost = parseFloat(newVegetable.manufacturing_cost);
      const currentStock = parseFloat(newVegetable.current_stock) || 0;

      if (isNaN(retailPrice) || retailPrice < 0 || isNaN(manufacturingCost) || manufacturingCost < 0) {
        alert('Please enter valid prices');
        return;
      }

      const vegetableData = {
        name: newVegetable.name,
        retail_price: retailPrice,
        manufacturing_cost: manufacturingCost,
        current_stock: currentStock,
        unit: newVegetable.unit,
        category: newVegetable.category
      };

      const addedVegetable = await addVegetable(vegetableData);
      if (addedVegetable) {
        setVegetables([...vegetables, addedVegetable]);
        setIsAddVegetableDialogOpen(false);
        resetForms();
        alert('Vegetable added successfully!');
      }
    } catch (error) {
      console.error('Error adding vegetable:', error);
      alert('Failed to add vegetable. Please try again.');
    }
  };

  const handleStockFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stockForm.selectedItemId || !stockForm.quantity) {
      alert('Please fill in all fields');
      return;
    }

    const quantity = parseFloat(stockForm.quantity);

    if (isNaN(quantity) || quantity < 0) {
      alert('Please enter a valid quantity');
      return;
    }

    try {
      // Persist to database
      const updated = await updateVegetableStock(stockForm.selectedItemId, quantity);
      if (updated) {
        const fresh = await getVegetables();
        setVegetables(fresh);
        alert('Stock updated successfully');
      } else {
        throw new Error('Failed to update stock');
      }
      
      setStockForm({
        selectedItemId: '',
        quantity: ''
      });
      setIsStockDialogOpen(false);
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock');
    }
  };

  const resetForms = () => {
    setSelectedVegetableId('');
    setQuantity('');
    setEditingSale(null);
    setItemForm({
      selectedItemId: '',
      purchaseRate: '',
      salesRate: ''
    });
    setStockForm({
      selectedItemId: '',
      quantity: ''
    });
    setNewVegetable({
      name: '',
      retail_price: '',
      manufacturing_cost: '',
      current_stock: '',
      unit: 'kg',
      category: 'Vegetables'
    });
  };

  const getFilteredSales = () => {
    let filtered = [...sales];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(sale => 
        sale.vegetable_name.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  const filteredSales = getFilteredSales();

  const salesSummary = {
    totalSales: filteredSales.length,
    totalRevenue: filteredSales.reduce((sum, sale) => sum + (sale.revenue || 0), 0),
    totalProfit: filteredSales.reduce((sum, sale) => sum + (sale.profit || 0), 0),
    avgSaleValue: filteredSales.length > 0 
      ? filteredSales.reduce((sum, sale) => sum + (sale.revenue || 0), 0) / filteredSales.length 
      : 0
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Sales Management</h1>
        <div className="flex gap-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Record Sale
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSale ? 'Edit Sale' : 'Record New Sale'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="vegetable">Vegetable</Label>
                  <Select 
                    value={selectedVegetableId} 
                    onValueChange={setSelectedVegetableId}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vegetable" />
                    </SelectTrigger>
                    <SelectContent>
                      {vegetables.map(vegetable => (
                        <SelectItem key={vegetable.id} value={vegetable.id}>
                          {vegetable.name} (Stock: {vegetable.current_stock || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="quantity">Quantity (kg)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    required
                  />
                </div>
                
                {selectedVegetableId && (
                  <div className="p-4 bg-muted/50 rounded-md space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Price per kg</p>
                        <p className="font-medium">
                          Rs{vegetables.find(v => v.id === selectedVegetableId)?.retail_price?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cost per kg</p>
                        <p className="font-medium">
                          Rs{vegetables.find(v => v.id === selectedVegetableId)?.manufacturing_cost?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Sale</p>
                        <p className="font-medium">
                          Rs{(
                            (vegetables.find(v => v.id === selectedVegetableId)?.retail_price || 0) * 
                            (parseFloat(quantity) || 0)
                          ).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Profit</p>
                        <p className="font-medium text-green-600">
                          Rs{(
                            ((vegetables.find(v => v.id === selectedVegetableId)?.retail_price || 0) - 
                            (vegetables.find(v => v.id === selectedVegetableId)?.manufacturing_cost || 0)) * 
                            (parseFloat(quantity) || 0)
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between pt-4">
                  {editingSale && (
                    <Button 
                      type="button"
                      variant="destructive"
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this sale?')) {
                          try {
                            await deleteSale(editingSale.id);
                            const updatedSales = await getSales();
                            setSales(updatedSales);
                            setIsDialogOpen(false);
                            resetForms();
                          } catch (error) {
                            console.error('Error deleting sale:', error);
                            alert('Failed to delete sale');
                          }
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Sale
                    </Button>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForms();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingSale ? 'Update' : 'Record'} Sale
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Sales Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesSummary.totalSales}</div>
            <p className="text-xs text-muted-foreground">All-time sales transactions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{salesSummary.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total revenue generated</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{salesSummary.totalProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total profit after costs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Sale Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs{salesSummary.avgSaleValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Average per transaction</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Sales List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent Sales</h2>
          <div className="w-full max-w-sm">
            <Input
              type="search"
              placeholder="Search sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        
        {filteredSales.length > 0 ? (
          <div className="space-y-4">
            {filteredSales.map((sale) => (
              <Card key={sale.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        <span className="font-medium">
                          {sale.vegetable_name}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(sale.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {sale.quantity_sold} kg × Rs{sale.retail_price?.toFixed(2)} = Rs{sale.revenue?.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">Rs{sale.profit?.toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditSale(sale)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => sale.id && handleDeleteSale(sale.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No sales recorded yet.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Record Sale
            </Button>
          </Card>
        )}
      </div>
      
      {/* Update Prices Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Vegetable Prices</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleItemFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="item">Vegetable</Label>
              <Select
                value={itemForm.selectedItemId}
                onValueChange={(value) => 
                  setItemForm({ ...itemForm, selectedItemId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vegetable" />
                </SelectTrigger>
                <SelectContent>
                  {vegetables.map((vegetable) => (
                    <SelectItem key={vegetable.id} value={vegetable.id}>
                      {vegetable.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="purchaseRate">Purchase Rate (Rs/kg)</Label>
              <Input
                id="purchaseRate"
                type="number"
                step="0.01"
                min="0"
                value={itemForm.purchaseRate}
                onChange={(e) =>
                  setItemForm({ ...itemForm, purchaseRate: e.target.value })
                }
                placeholder="Enter purchase rate"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="salesRate">Sales Rate (Rs/kg)</Label>
              <Input
                id="salesRate"
                type="number"
                step="0.01"
                min="0"
                value={itemForm.salesRate}
                onChange={(e) =>
                  setItemForm({ ...itemForm, salesRate: e.target.value })
                }
                placeholder="Enter sales rate"
                required
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsItemDialogOpen(false);
                  resetForms();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Update Prices</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Update Stock Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Vegetable Stock</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStockFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="stockItem">Vegetable</Label>
              <Select
                value={stockForm.selectedItemId}
                onValueChange={(value) =>
                  setStockForm({ ...stockForm, selectedItemId: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vegetable" />
                </SelectTrigger>
                <SelectContent>
                  {vegetables.map((vegetable) => (
                    <SelectItem key={vegetable.id} value={vegetable.id}>
                      {vegetable.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="stockQuantity">Current Stock (kg)</Label>
              <Input
                id="stockQuantity"
                type="number"
                min="0"
                step="0.01"
                value={stockForm.quantity}
                onChange={(e) =>
                  setStockForm({ ...stockForm, quantity: e.target.value })
                }
                placeholder="Enter current stock"
                required
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsStockDialogOpen(false);
                  resetForms();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Update Stock</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Vegetable Dialog */}
      <Dialog open={isAddVegetableDialogOpen} onOpenChange={setIsAddVegetableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Vegetable</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVegetable} className="space-y-4">
            <div>
              <Label htmlFor="vegetableName">Vegetable Name *</Label>
              <Input
                id="vegetableName"
                value={newVegetable.name}
                onChange={(e) => setNewVegetable({...newVegetable, name: e.target.value})}
                placeholder="Enter vegetable name"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="retailPrice">Retail Price (Rs/kg) *</Label>
                <Input
                  id="retailPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newVegetable.retail_price}
                  onChange={(e) => setNewVegetable({...newVegetable, retail_price: e.target.value})}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="manufacturingCost">Cost (Rs/kg) *</Label>
                <Input
                  id="manufacturingCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newVegetable.manufacturing_cost}
                  onChange={(e) => setNewVegetable({...newVegetable, manufacturing_cost: e.target.value})}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="initialStock">Initial Stock (kg)</Label>
                <Input
                  id="initialStock"
                  type="number"
                  step="0.1"
                  min="0"
                  value={newVegetable.current_stock}
                  onChange={(e) => setNewVegetable({...newVegetable, current_stock: e.target.value})}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={newVegetable.unit}
                  onValueChange={(value) => setNewVegetable({...newVegetable, unit: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="piece">Piece</SelectItem>
                    <SelectItem value="bunch">Bunch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={newVegetable.category}
                onChange={(e) => setNewVegetable({...newVegetable, category: e.target.value})}
                placeholder="e.g., Leafy Greens, Root Vegetables"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddVegetableDialogOpen(false);
                  resetForms();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Add Vegetable</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Vegetables List */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Available Vegetables</h2>
          <Button 
            onClick={() => setIsAddVegetableDialogOpen(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Vegetable
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vegetables.map((vegetable) => (
            <Card key={vegetable.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{vegetable.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => {
                          setItemForm({
                            selectedItemId: vegetable.id,
                            purchaseRate: String(vegetable.manufacturing_cost ?? ''),
                            salesRate: String(vegetable.retail_price ?? '')
                          });
                          // Ensure any other dialogs are closed and let the dropdown close before opening
                          setIsStockDialogOpen(false);
                          setIsDialogOpen(false);
                          setTimeout(() => setIsItemDialogOpen(true), 0);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Update Prices
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setStockForm({
                            selectedItemId: vegetable.id,
                            quantity: String(vegetable.current_stock ?? '')
                          });
                          // Ensure any other dialogs are closed and let the dropdown close before opening
                          setIsItemDialogOpen(false);
                          setIsDialogOpen(false);
                          setTimeout(() => setIsStockDialogOpen(true), 0);
                        }}
                      >
                        <Package className="mr-2 h-4 w-4" />
                        Update Stock
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteVegetable(vegetable.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Stock:</span>
                    <span className="font-medium">{vegetable.current_stock || 0} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-medium">Rs{vegetable.retail_price?.toFixed(2)}/kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost:</span>
                    <span className="font-medium">Rs{vegetable.manufacturing_cost?.toFixed(2)}/kg</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sales;