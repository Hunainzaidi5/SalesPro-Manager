import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDashboardStats, getMenuItems, getInventoryItems, getSales } from '@/lib/database';
import type { DashboardStats, MenuItem, InventoryItem, Sale } from '@/lib/supabase';
import { TrendingUp, Package, ShoppingCart, DollarSign, AlertTriangle, Warehouse } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStockMenuItems, setLowStockMenuItems] = useState<MenuItem[]>([]);
  const [lowStockInventoryItems, setLowStockInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [dashboardStats, allSales, allMenuItems, allInventoryItems] = await Promise.all([
          getDashboardStats(),
          getSales(),
          getMenuItems(),
          getInventoryItems()
        ]);
      
        setStats(dashboardStats);
        setRecentSales(allSales.slice(-5).reverse());
        setLowStockMenuItems(allMenuItems.filter(m => m.current_stock <= 5));
        setLowStockInventoryItems(allInventoryItems.filter(i => i.current_stock <= i.min_stock_level));
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="text-sm text-muted-foreground">
            Welcome to SalesPro Manager
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="text-sm text-muted-foreground">
            Welcome to SalesPro Manager
          </div>
        </div>
        <Card className="p-8 text-center shadow-card">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2">Error Loading Dashboard</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="text-sm text-muted-foreground">
            Welcome to SalesPro Manager
          </div>
        </div>
        <Card className="p-8 text-center shadow-card">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Data Available</h3>
          <p className="text-muted-foreground">Start by adding some menu items and inventory items.</p>
        </Card>
      </div>
    );
  }

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
      title: 'Menu Items',
      value: stats.totalMenuItems.toString(),
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Inventory Items',
      value: stats.totalInventoryItems.toString(),
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">{sale.menu_item_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(sale.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-success">Rs{sale.revenue.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Qty: {sale.quantity_sold}</p>
                </div>
              </div>
            ))}
            {recentSales.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No recent sales</p>
            )}
          </div>
        </Card>

        {/* Low Stock Menu Items */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Low Stock Menu Items</h2>
            <Link to="/products">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {lowStockMenuItems.map((menuItem) => (
              <div key={menuItem.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">{menuItem.name}</p>
                  <p className="text-sm text-muted-foreground">{menuItem.category || 'No category'}</p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${menuItem.current_stock === 0 ? 'text-destructive' : 'text-warning'}`}>
                    {menuItem.current_stock} in stock
                  </p>
                  <p className="text-sm text-muted-foreground">Rs{menuItem.retail_price}</p>
                </div>
              </div>
            ))}
            {lowStockMenuItems.length === 0 && (
              <p className="text-center text-muted-foreground py-4">All menu items well stocked</p>
            )}
          </div>
        </Card>

        {/* Low Stock Inventory Items */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Low Stock Inventory</h2>
            <Link to="/inventory">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {lowStockInventoryItems.map((inventoryItem) => (
              <div key={inventoryItem.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">{inventoryItem.name}</p>
                  <p className="text-sm text-muted-foreground">{inventoryItem.category || 'No category'}</p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${inventoryItem.current_stock === 0 ? 'text-destructive' : 'text-warning'}`}>
                    {inventoryItem.current_stock} in stock
                  </p>
                  <p className="text-sm text-muted-foreground">Min: {inventoryItem.min_stock_level}</p>
                </div>
              </div>
            ))}
            {lowStockInventoryItems.length === 0 && (
              <p className="text-center text-muted-foreground py-4">All inventory items well stocked</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;