import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getMenuItems, getInventoryItems, getSales } from '@/lib/database';
import { Settings as SettingsIcon, Download, Upload, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

const Settings = () => {
  const { toast } = useToast();

  const handleExportData = async () => {
    try {
      // Fetch data from database
      const [menuItems, inventoryItems, sales] = await Promise.all([
        getMenuItems(),
        getInventoryItems(),
        getSales()
      ]);
      
      // Create workbook with multiple sheets
      const workbook = XLSX.utils.book_new();
      
      // Menu Items sheet
      const menuItemsData = menuItems.map(menuItem => ({
        'Menu Item Name': menuItem.name,
        'SKU': menuItem.sku || 'N/A',
        'Category': menuItem.category || 'N/A',
        'Retail Price': menuItem.retail_price,
        'Manufacturing Cost': menuItem.manufacturing_cost,
        'Current Stock': menuItem.current_stock,
        'Stock Value': menuItem.current_stock * menuItem.retail_price,
        'Created Date': new Date(menuItem.created_at).toLocaleDateString(),
        'Last Updated': new Date(menuItem.updated_at).toLocaleDateString()
      }));
      
      const menuItemsSheet = XLSX.utils.json_to_sheet(menuItemsData);
      XLSX.utils.book_append_sheet(workbook, menuItemsSheet, 'Menu Items');
      
      // Inventory Items sheet
      const inventoryItemsData = inventoryItems.map(inventoryItem => ({
        'Item Name': inventoryItem.name,
        'SKU': inventoryItem.sku || 'N/A',
        'Category': inventoryItem.category || 'N/A',
        'Unit Cost': inventoryItem.unit_cost,
        'Current Stock': inventoryItem.current_stock,
        'Min Stock Level': inventoryItem.min_stock_level,
        'Stock Value': inventoryItem.current_stock * inventoryItem.unit_cost,
        'Created Date': new Date(inventoryItem.created_at).toLocaleDateString(),
        'Last Updated': new Date(inventoryItem.updated_at).toLocaleDateString()
      }));
      
      const inventoryItemsSheet = XLSX.utils.json_to_sheet(inventoryItemsData);
      XLSX.utils.book_append_sheet(workbook, inventoryItemsSheet, 'Inventory Items');
      
      // Sales sheet
      const salesData = sales.map(sale => ({
        'Menu Item Name': sale.menu_item_name,
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
      const totalMenuItems = menuItems.length;
      const totalInventoryItems = inventoryItems.length;
      const totalSales = sales.length;
      const menuInventoryValue = menuItems.reduce((sum, item) => sum + (item.current_stock * item.retail_price), 0);
      const inventoryValue = inventoryItems.reduce((sum, item) => sum + (item.current_stock * item.unit_cost), 0);
      
      const summaryData = [
        { 'Metric': 'Total Menu Items', 'Value': totalMenuItems },
        { 'Metric': 'Total Inventory Items', 'Value': totalInventoryItems },
        { 'Metric': 'Total Sales', 'Value': totalSales },
        { 'Metric': 'Total Revenue', 'Value': totalRevenue },
        { 'Metric': 'Total Profit', 'Value': totalProfit },
        { 'Metric': 'Menu Inventory Value', 'Value': menuInventoryValue },
        { 'Metric': 'Raw Materials Value', 'Value': inventoryValue },
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
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure? This will delete all menu items, inventory items, and sales data from the database. This action cannot be undone.')) {
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
              <p className="text-sm text-muted-foreground">Download your menu items, inventory items, and sales data as Excel file (XLSX)</p>
            </div>
            <Button onClick={handleExportData} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export XLSX
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Clear All Data</h3>
              <p className="text-sm text-muted-foreground">Delete all menu items, inventory items, and sales data from database</p>
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
          <p>A comprehensive sales management application for tracking menu items, inventory, sales, and profits.</p>
          <p>Features: Menu management, inventory tracking, sales recording, profit calculation</p>
          <p>Built with React, TypeScript, and Supabase</p>
        </div>
      </Card>
    </div>
  );
};

export default Settings;