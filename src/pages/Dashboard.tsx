import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDashboardStats, getProducts, getSales } from '@/lib/database';
import type { DashboardStats, Product, Sale } from '@/lib/supabase';
import { TrendingUp, Package, ShoppingCart, DollarSign, AlertTriangle, Warehouse } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dashboardStats, allSales, allProducts] = await Promise.all([
          getDashboardStats(),
          getSales(),
          getProducts()
        ]);
      
      setStats(dashboardStats);
      setRecentSales(allSales.slice(-5).reverse());
        setLowStockProducts(allProducts.filter(p => p.current_stock <= 5));
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
  }, []);

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Revenue',
      value: `Rs${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      title: 'Total Profit',
      value: `Rs${stats.totalProfit.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      title: 'Products',
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Inventory Items',
      value: stats.totalProducts.toString(),
      icon: Warehouse,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      title: 'Total Sales',
      value: stats.totalSales.toString(),
      icon: ShoppingCart,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          Welcome to SalesPro Manager
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6 shadow-card">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Sales */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Sales</h2>
            <Link to="/sales">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentSales.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No sales recorded yet</p>
            ) : (
              recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{sale.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {sale.quantity_sold} • {new Date(sale.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-success">Rs{sale.revenue.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      Profit: Rs{sale.profit.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Low Stock Alert */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low Stock Alert
            </h2>
            <Link to="/inventory">
              <Button variant="outline" size="sm">Manage Inventory</Button>
            </Link>
          </div>
          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">All products are well stocked!</p>
            ) : (
              lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-warning">{product.current_stock} left</p>
                    <p className="text-sm text-muted-foreground">Restock needed</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 shadow-card">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/products">
            <Button className="w-full justify-start" variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
          <Link to="/sales">
            <Button className="w-full justify-start" variant="outline">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Record Sale
            </Button>
          </Link>
          <Link to="/inventory">
            <Button className="w-full justify-start" variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              Update Stock
            </Button>
          </Link>
          <Link to="/products">
            <Button className="w-full justify-start" variant="outline">
              <DollarSign className="mr-2 h-4 w-4" />
              Update Prices
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;