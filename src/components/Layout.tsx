import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  House,
  List,
  Banknote,
  NotebookPen,
  FileDown,
} from 'lucide-react';
import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getDashboardStats, getExpenses } from '@/lib/database';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: House },
    { name: 'Sales', href: '/sales', icon: NotebookPen },
    { name: 'Expenses', href: '/expenses', icon: Banknote },
  ];

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

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-border">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center px-6 border-b border-border">
              <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Sales Manager
              </h1>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-button'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto p-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <FileDown className="mr-2 h-4 w-4" />
                    Report
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top">
                  <DropdownMenuItem onClick={exportToPDF}>Export to PDF</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToXLSX}>Export to Excel</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col bg-white gap-y-5 overflow-y-auto bg-sidebar border-r border-border">
          <div className="flex h-16 shrink-0 items-center px-6 border-b border-border">
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Sales Manager
            </h1>
          </div>
          <nav className="flex flex-1 flex-col px-4">
            <ul role="list" className="flex flex-1 flex-col gap-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`group flex gap-x-3 rounded-lg p-3 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-button'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="px-4 pb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <FileDown className="mr-2 h-4 w-4" />
                  Report
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top">
                <DropdownMenuItem onClick={exportToPDF}>Export to PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={exportToXLSX}>Export to Excel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 lg:hidden">
          <div className="flex h-16 items-center gap-x-4 border-b border-border bg-card px-4 shadow-card sm:gap-x-6 sm:px-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <List className="h-5 w-5" />
            </Button>
            <div className="flex-1 text-sm font-semibold leading-6">
              Sales Manager
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6 bg-main-content min-h-screen">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;