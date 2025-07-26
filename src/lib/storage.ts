// Data models and local storage management for SalesPro Manager

export interface Product {
    id: string;
    name: string;
    sku: string;
    retailPrice: number;
    manufacturingCost: number;
    currentStock: number;
    category?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Sale {
    id: string;
    productId: string;
    productName: string;
    quantitySold: number;
    date: Date;
    retailPrice: number;
    manufacturingCost: number;
    revenue: number;
    profit: number;
  }
  
  export interface DashboardStats {
    totalProducts: number;
    totalSales: number;
    totalRevenue: number;
    totalProfit: number;
    lowStockItems: number;
  }
  
  // Storage keys
  const PRODUCTS_KEY = 'salespro_products';
  const SALES_KEY = 'salespro_sales';
  
  // Product management
  export const getProducts = (): Product[] => {
    try {
      const data = localStorage.getItem(PRODUCTS_KEY);
      if (!data) return getDefaultProducts();
      return JSON.parse(data).map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt)
      }));
    } catch (error) {
      console.error('Error loading products:', error);
      return getDefaultProducts();
    }
  };
  
  export const saveProducts = (products: Product[]): void => {
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Error saving products:', error);
    }
  };
  
  export const addProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const products = getProducts();
    products.push(newProduct);
    saveProducts(products);
    return newProduct;
  };
  
  export const updateProduct = (id: string, updates: Partial<Product>): Product | null => {
    const products = getProducts();
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) return null;
    
    products[index] = {
      ...products[index],
      ...updates,
      updatedAt: new Date()
    };
    
    saveProducts(products);
    return products[index];
  };
  
  export const deleteProduct = (id: string): boolean => {
    const products = getProducts();
    const filtered = products.filter(p => p.id !== id);
    
    if (filtered.length === products.length) return false;
    
    saveProducts(filtered);
    return true;
  };
  
  // Sales management
  export const getSales = (): Sale[] => {
    try {
      const data = localStorage.getItem(SALES_KEY);
      if (!data) return [];
      return JSON.parse(data).map((s: any) => ({
        ...s,
        date: new Date(s.date)
      }));
    } catch (error) {
      console.error('Error loading sales:', error);
      return [];
    }
  };
  
  export const saveSales = (sales: Sale[]): void => {
    try {
      localStorage.setItem(SALES_KEY, JSON.stringify(sales));
    } catch (error) {
      console.error('Error saving sales:', error);
    }
  };
  
  export const addSale = (sale: Omit<Sale, 'id' | 'revenue' | 'profit'>): Sale | null => {
    const products = getProducts();
    const product = products.find(p => p.id === sale.productId);
    
    if (!product) return null;
    if (product.currentStock < sale.quantitySold) return null;
    
    // Calculate revenue and profit
    const revenue = sale.retailPrice * sale.quantitySold;
    const profit = (sale.retailPrice - sale.manufacturingCost) * sale.quantitySold;
    
    const newSale: Sale = {
      ...sale,
      id: Date.now().toString(),
      revenue,
      profit
    };
    
    // Update product stock
    updateProduct(sale.productId, {
      currentStock: product.currentStock - sale.quantitySold
    });
    
    // Save sale
    const sales = getSales();
    sales.push(newSale);
    saveSales(sales);
    
    return newSale;
  };
  
  // Dashboard statistics
  export const getDashboardStats = (): DashboardStats => {
    const products = getProducts();
    const sales = getSales();
    
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.revenue, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
    const lowStockItems = products.filter(p => p.currentStock <= 5).length;
    
    return {
      totalProducts: products.length,
      totalSales: sales.length,
      totalRevenue,
      totalProfit,
      lowStockItems
    };
  };
  
  // Default sample data
  const getDefaultProducts = (): Product[] => [
    {
      id: '1',
      name: 'Wireless Headphones',
      sku: 'WH-001',
      retailPrice: 99.99,
      manufacturingCost: 45.00,
      currentStock: 25,
      category: 'Electronics',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'Bluetooth Speaker',
      sku: 'BS-002',
      retailPrice: 79.99,
      manufacturingCost: 35.00,
      currentStock: 15,
      category: 'Electronics',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      name: 'Phone Case',
      sku: 'PC-003',
      retailPrice: 24.99,
      manufacturingCost: 8.00,
      currentStock: 50,
      category: 'Accessories',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  // Product sales analytics
  export const getProductSalesStats = (productId: string) => {
    const sales = getSales().filter(s => s.productId === productId);
    const totalQuantity = sales.reduce((sum, sale) => sum + sale.quantitySold, 0);
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.revenue, 0);
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
    
    return {
      totalSales: sales.length,
      totalQuantity,
      totalRevenue,
      totalProfit
    };
  };