import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Download, Upload, Trash2 } from 'lucide-react';

const Settings = () => {
  const { toast } = useToast();

  const handleExportData = () => {
    const products = localStorage.getItem('salespro_products') || '[]';
    const sales = localStorage.getItem('salespro_sales') || '[]';
    
    const data = {
      products: JSON.parse(products),
      sales: JSON.parse(sales),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salespro-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Data exported successfully",
    });
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure? This will delete all products and sales data.')) {
      localStorage.removeItem('salespro_products');
      localStorage.removeItem('salespro_sales');
      toast({
        title: "Success",
        description: "All data cleared successfully",
      });
      window.location.reload();
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
              <p className="text-sm text-muted-foreground">Download your products and sales data</p>
            </div>
            <Button onClick={handleExportData} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">Clear All Data</h3>
              <p className="text-sm text-muted-foreground">Delete all products and sales data</p>
            </div>
            <Button onClick={handleClearData} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Data
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-card">
        <h2 className="text-xl font-semibold mb-4">About SalesPro Manager</h2>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Version: 1.0.0</p>
          <p>A comprehensive sales management application for tracking inventory, sales, and profits.</p>
          <p>Features: Product management, inventory tracking, sales recording, profit calculation</p>
        </div>
      </Card>
    </div>
  );
};

export default Settings;