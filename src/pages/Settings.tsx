import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getProducts, getSales } from '@/lib/database';
import { Settings as SettingsIcon, Download, Upload, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const Settings = () => {
  const { toast } = useToast();

  const handleExportData = async () => {
    try {
      // Fetch data from database
      const products = await getProducts();
      const sales = await getSales();
      
      // Create workbook with multiple sheets
      const workbook = XLSX.utils.book_new();
      
      // Products sheet
      const productsData = products.map(product => ({
        'Product Name': product.name,
        'SKU': product.sku || 'N/A',
        'Category': product.category || 'N/A',
        'Retail Price': product.retail_price,
        'Manufacturing Cost': product.manufacturing_cost,
        'Current Stock': product.current_stock,
        'Stock Value': product.current_stock * product.manufacturing_cost,
        'Created Date': new Date(product.created_at).toLocaleDateString(),
        'Last Updated': new Date(product.updated_at).toLocaleDateString()
      }));
      
      const productsSheet = XLSX.utils.json_to_sheet(productsData);
      XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');
      
      // Sales sheet
      const salesData = sales.map(sale => ({
        'Product Name': sale.product_name,
        'Quantity Sold': sale.quantity_sold,
        'Unit Price': sale.retail_price,
        'Revenue': sale.revenue,
        'Profit': sale.profit,
        'Sale Date': new Date(sale.date).toLocaleDateString(),
        'Sale Time': new Date(sale.date).toLocaleTimeString()
      }));
      
      const salesSheet = XLSX.utils.json_to_sheet(salesData);
      XLSX.utils.book_append_sheet(workbook, salesSheet, 'Sales');
      
      // Summary sheet
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.revenue, 0);
      const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
      const totalProducts = products.length;
      const totalSales = sales.length;
      const inventoryValue = products.reduce((sum, product) => sum + (product.current_stock * product.manufacturing_cost), 0);
      
      const summaryData = [
        { 'Metric': 'Total Products', 'Value': totalProducts },
        { 'Metric': 'Total Sales', 'Value': totalSales },
        { 'Metric': 'Total Revenue', 'Value': totalRevenue },
        { 'Metric': 'Total Profit', 'Value': totalProfit },
        { 'Metric': 'Inventory Value', 'Value': inventoryValue },
        { 'Metric': 'Export Date', 'Value': new Date().toLocaleDateString() }
      ];
      
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      
      // Generate filename
      const fileName = `salespro-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Download the file
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: "Success",
        description: "Data exported successfully as XLSX file",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure? This will delete all products and sales data from the database. This action cannot be undone.')) {
      toast({
        title: "Warning",
        description: "Data clearing is not implemented for database. Please use Supabase dashboard to clear data if needed.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Card className="p-6 shadow-card">
        <h2 className="text-xl font-semibold mb-4">Data Management</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Export Data</h3>
              <p className="text-sm text-muted-foreground">Download your products and sales data as Excel file (XLSX)</p>
            </div>
            <Button onClick={handleExportData} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export XLSX
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Clear All Data</h3>
              <p className="text-sm text-muted-foreground">Delete all products and sales data from database</p>
            </div>
            <Button onClick={handleClearData} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Data
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-card">
        <h2 className="text-xl font-semibold mb-4">Database Information</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Database: Supabase (PostgreSQL)</p>
          <p>Data is stored securely in the cloud and synchronized across all users.</p>
          <p>To manage data directly, visit your Supabase dashboard.</p>
        </div>
      </Card>

      <Card className="p-6 shadow-card">
        <h2 className="text-xl font-semibold mb-4">About SalesPro Manager</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Version: 1.0.0</p>
          <p>A comprehensive sales management application for tracking inventory, sales, and profits.</p>
          <p>Features: Product management, inventory tracking, sales recording, profit calculation</p>
          <p>Built with React, TypeScript, and Supabase</p>
        </div>
      </Card>
    </div>
  );
};

export default Settings;