import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDashboardStats, getVegetables, getSales, getExpenses } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import type { DashboardStats, Vegetable, Sale } from '@/lib/supabase';
import { TrendingUp, Package, ShoppingCart, DollarSign, AlertTriangle, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStockVegetables, setLowStockVegetables] = useState<Vegetable[]>([]);
  
  interface Expense {
    id: string;
    category: string;
    description: string;
    amount: number;
    date: string;
    created_at: string;
  }
  
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [statsData, salesData, expensesData, vegetablesData] = await Promise.all([
          getDashboardStats(),
          getSales(),
          getExpenses(),
          getVegetables()
        ]);
        
        // Filter for low stock vegetables (<= 5, including 0)
        const lowStockVeggies = vegetablesData.filter(item => (item.current_stock ?? 0) <= 5);
      
        // Map the stats to match the expected DashboardStats interface
        const mappedStats = {
          totalRevenue: statsData.totalRevenue || 0,
          totalProfit: statsData.totalProfit || 0,
          totalVegetables: statsData.totalVegetables || 0,
          totalInventoryItems: statsData.totalVegetables || 0, // Kept for backward compatibility
          totalSales: statsData.totalSales || 0,
          totalExpenses: statsData.totalExpenses || 0,
          netProfit: statsData.netProfit || 0,
          // Drive from live computed list for accuracy
          lowStockCount: lowStockVeggies.length
        } as DashboardStats;
        setStats(mappedStats);
        setRecentSales(salesData.slice(-5).reverse());
        setLowStockVegetables(lowStockVeggies);
        setRecentExpenses(expensesData.slice(-5).reverse());
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Realtime subscription for vegetables changes
    const channel = supabase
      .channel('dashboard-vegetables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vegetables' }, async () => {
        try {
          const vegetablesData = await getVegetables();
          const lowStockVeggies = vegetablesData.filter(item => (item.current_stock ?? 0) <= 5);
          setLowStockVegetables(lowStockVeggies);
          // Optionally refresh stats lowStockCount too
          setStats(prev => prev ? { ...prev, lowStockCount: lowStockVeggies.length, totalVegetables: vegetablesData.length, totalInventoryItems: vegetablesData.length } : prev);
        } catch (err) {
          console.error('Error refreshing vegetables in realtime:', err);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, async () => {
        // Sales changes adjust stock via triggers; refresh vegetables
        try {
          const vegetablesData = await getVegetables();
          const lowStockVeggies = vegetablesData.filter(item => (item.current_stock ?? 0) <= 5);
          setLowStockVegetables(lowStockVeggies);
          setStats(prev => prev ? { ...prev, lowStockCount: lowStockVeggies.length, totalVegetables: vegetablesData.length, totalInventoryItems: vegetablesData.length } : prev);
        } catch (err) {
          console.error('Error refreshing vegetables after sales change:', err);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
          <p className="text-muted-foreground">Start by adding some vegetables and recording sales.</p>
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
      title: 'Vegetables',
      value: stats.totalVegetables.toString(),
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Low Stock Items',
      value: stats.totalInventoryItems.toString(),
      icon: AlertTriangle,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
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
          Welcome to Sales Manager
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
                  <p className="font-medium">{sale.vegetable_name}</p>
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
 
        {/* Low Stock Vegetables */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Low Stock Vegetables</h2>
            <Link to="/sales">
              <Button variant="outline" size="sm">
                Manage Stock
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {lowStockVegetables.map((vegetable) => (
              <div key={vegetable.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">{vegetable.name}</p>
                  <p className="text-sm text-muted-foreground">{vegetable.category || 'Vegetables'}</p>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${vegetable.current_stock === 0 ? 'text-destructive' : 'text-warning'}`}>
                    {vegetable.current_stock} in stock
                  </p>
                  <p className="text-sm text-muted-foreground">Rs{vegetable.retail_price}</p>
                </div>
              </div>
            ))}
            {lowStockVegetables.length === 0 && (
              <p className="text-center text-muted-foreground py-4">All vegetables well stocked</p>
            )}
          </div>
        </Card>
 
        {/* Recent Expenses */}
        <Card className="p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Expenses</h2>
            <Link to="/sales">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium capitalize">{expense.category}</p>
                  <p className="text-sm text-muted-foreground">{expense.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-destructive">Rs{expense.amount.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    {expense.category || 'Uncategorized'} • {new Date(expense.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {recentExpenses.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No recent expenses</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
 
export default Dashboard;