import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDashboardStats, getVegetables, getSales, getExpenses } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import type { DashboardStats, Vegetable, Sale } from '@/lib/supabase';
import { TrendingUp, Package, ShoppingCart, DollarSign, AlertTriangle, Receipt, FileDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
          <div className="text-sm text-black/60">
            Welcome to SalesPro Manager
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-black/60">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="text-sm text-black/60">
            Welcome to SalesPro Manager
          </div>
        </div>
        <Card className="p-8 text-center border border-black/10">
          <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium mb-2">Error Loading Dashboard</h3>
          <p className="text-black/60 mb-4">{error}</p>
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
          <div className="text-sm text-black/60">
            Welcome to SalesPro Manager
          </div>
        </div>
        <Card className="p-8 text-center border border-black/10">
          <Package className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Data Available</h3>
          <p className="text-black/60">Start by adding some vegetables and recording sales.</p>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: `Rs${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-black',
      bgColor: 'bg-black/5'
    },
    {
      title: 'Total Profit',
      value: `Rs${stats.totalProfit.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-black',
      bgColor: 'bg-black/5'
    },
    {
      title: 'Vegetables',
      value: stats.totalVegetables.toString(),
      icon: Package,
      color: 'text-black',
      bgColor: 'bg-black/5'
    },
    {
      title: 'Low Stock Items',
      value: stats.totalInventoryItems.toString(),
      icon: AlertTriangle,
      color: 'text-black',
      bgColor: 'bg-black/5'
    },
    {
      title: 'Total Sales',
      value: stats.totalSales.toString(),
      icon: ShoppingCart,
      color: 'text-black',
      bgColor: 'bg-black/5'
    }
  ];

  const exportToPDF = async () => {
    const [stats, expenses] = await Promise.all([getDashboardStats(), getExpenses()]);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = (stats.totalProfit || 0) - totalExpenses;
    const html = `<!doctype html><html><head><meta charset="utf-8"/>
      <title>Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; }
        h1 { margin-bottom: 16px; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #ddd; padding: 8px; }
        th { background: #f5f5f5; text-align: left; }
        .mt { margin-top: 16px; }
      </style>
    </head><body>
      <h1>Sales Report</h1>
      <table>
        <thead><tr><th>Metric</th><th>Value</th></tr></thead>
        <tbody>
          <tr><td>Total Revenue</td><td>Rs${(stats.totalRevenue || 0).toFixed(2)}</td></tr>
          <tr><td>Total Profit (Gross)</td><td>Rs${(stats.totalProfit || 0).toFixed(2)}</td></tr>
          <tr><td>Total Expenses</td><td>Rs${totalExpenses.toFixed(2)}</td></tr>
          <tr><td>Net Profit (After Expenses)</td><td>Rs${netProfit.toFixed(2)}</td></tr>
          <tr><td>Total Sales</td><td>${String(stats.totalSales || 0)}</td></tr>
        </tbody>
      </table>
      <h2 class="mt">Expenses</h2>
      <table>
        <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount (Rs)</th></tr></thead>
        <tbody>
          ${expenses.map(e => `<tr><td>${e.date ? new Date(e.date).toLocaleDateString() : ''}</td><td>${e.category || ''}</td><td>${e.description || ''}</td><td>${Number(e.amount || 0).toFixed(2)}</td></tr>`).join('')}
        </tbody>
      </table>
      <script>setTimeout(() => { window.print(); }, 250);</script>
    </body></html>`;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const loadXLSX = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      if (window && (window as any).XLSX) return resolve((window as any).XLSX);
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.onload = () => {
        // @ts-ignore
        resolve((window as any).XLSX);
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  const exportToXLSX = async () => {
    const [stats, expenses] = await Promise.all([getDashboardStats(), getExpenses()]);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = (stats.totalProfit || 0) - totalExpenses;

    const XLSX = await loadXLSX();

    // Summary sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Revenue', `Rs${(stats.totalRevenue || 0).toFixed(2)}`],
      ['Total Profit (Gross)', `Rs${(stats.totalProfit || 0).toFixed(2)}`],
      ['Total Expenses', `Rs${totalExpenses.toFixed(2)}`],
      ['Net Profit (After Expenses)', `Rs${netProfit.toFixed(2)}`],
      ['Total Sales', String(stats.totalSales || 0)],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

    // Expenses sheet
    const expenseRows = [
      ['Date', 'Category', 'Description', 'Amount (Rs)'],
      ...expenses.map((e: any) => [
        e.date ? new Date(e.date).toLocaleDateString() : '',
        e.category || '',
        e.description || '',
        Number(e.amount || 0)
      ])
    ];
    const expensesSheet = XLSX.utils.aoa_to_sheet(expenseRows);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
    XLSX.utils.book_append_sheet(wb, expensesSheet, 'Expenses');
    XLSX.writeFile(wb, 'report.xlsx');
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-black/10">
                <FileDown className="mr-2 h-4 w-4" />
                Report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border border-black/10">
              <DropdownMenuItem onClick={exportToPDF}>Export to PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={exportToXLSX}>Export to Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6 border border-black/10">
              <div className="flex items-center">
                <div className={`p-2 rounded-md ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-black/60">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
 
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Sales */}
        <Card className="p-6 border border-black/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Sales</h2>
            <Link to="/sales">
              <Button variant="outline" size="sm" className="border-black/10">
                View All
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-black/5 rounded-md">
                <div>
                  <p className="font-medium">{sale.vegetable_name}</p>
                  <p className="text-sm text-black/60">
                    {new Date(sale.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Rs{sale.revenue.toFixed(2)}</p>
                  <p className="text-sm text-black/60">Qty: {sale.quantity_sold}</p>
                </div>
              </div>
            ))}
            {recentSales.length === 0 && (
              <p className="text-center text-black/60 py-4">No recent sales</p>
            )}
          </div>
        </Card>
 
        {/* Low Stock Vegetables */}
        <Card className="p-6 border border-black/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Low Stock Vegetables</h2>
            <Link to="/sales">
              <Button variant="outline" size="sm" className="border-black/10">
                Manage Stock
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {lowStockVegetables.map((vegetable) => (
              <div key={vegetable.id} className="flex items-center justify-between p-3 bg-black/5 rounded-md">
                <div>
                  <p className="font-medium">{vegetable.name}</p>
                  <p className="text-sm text-black/60">{vegetable.category || 'Vegetables'}</p>
                </div>
                <div className="text-right">
                  <p className={`font-medium`}>
                    {vegetable.current_stock} in stock
                  </p>
                  <p className="text-sm text-black/60">Rs{vegetable.retail_price}</p>
                </div>
              </div>
            ))}
            {lowStockVegetables.length === 0 && (
              <p className="text-center text-black/60 py-4">All vegetables well stocked</p>
            )}
          </div>
        </Card>
 
        {/* Recent Expenses */}
        <Card className="p-6 border border-black/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Expenses</h2>
            <Link to="/sales">
              <Button variant="outline" size="sm" className="border-black/10">
                View All
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 bg-black/5 rounded-md">
                <div>
                  <p className="font-medium capitalize">{expense.category}</p>
                  <p className="text-sm text-black/60">{expense.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Rs{expense.amount.toFixed(2)}</p>
                  <p className="text-sm text-black/60">
                    {expense.category || 'Uncategorized'} • {new Date(expense.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {recentExpenses.length === 0 && (
              <p className="text-center text-black/60 py-4">No recent expenses</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
 
export default Dashboard;