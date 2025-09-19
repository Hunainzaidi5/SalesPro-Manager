import { supabase } from './supabase'
import type { Vegetable, Sale } from './supabase'

// Fixed vegetables catalog for vendor use-case
const FIXED_VEGETABLES: Vegetable[] = [
  { id: 'iceberg', name: 'Iceberg', sku: 'ICEBERG', retail_price: 0, manufacturing_cost: 0, current_stock: 0, category: 'Vegetables', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'broccoli', name: 'Broccoli', sku: 'BROCCOLI', retail_price: 0, manufacturing_cost: 0, current_stock: 0, category: 'Vegetables', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'chinese-cabbage', name: 'Chinese Cabbage', sku: 'CHINESE_CABBAGE', retail_price: 0, manufacturing_cost: 0, current_stock: 0, category: 'Vegetables', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'celery', name: 'Celery', sku: 'CELERY', retail_price: 0, manufacturing_cost: 0, current_stock: 0, category: 'Vegetables', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'parsley', name: 'Parsley', sku: 'PARSLEY', retail_price: 0, manufacturing_cost: 0, current_stock: 0, category: 'Vegetables', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'bok-choy', name: 'Bok Choy', sku: 'BOK_CHOY', retail_price: 0, manufacturing_cost: 0, current_stock: 0, category: 'Vegetables', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'leek', name: 'Leek', sku: 'LEEK', retail_price: 0, manufacturing_cost: 0, current_stock: 0, category: 'Vegetables', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'romaine', name: 'Romaine', sku: 'ROMAINE', retail_price: 0, manufacturing_cost: 0, current_stock: 0, category: 'Vegetables', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'red-cabbage', name: 'Red Cabbage', sku: 'RED_CABBAGE', retail_price: 0, manufacturing_cost: 0, current_stock: 0, category: 'Vegetables', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'capsicum', name: 'Capsicum', sku: 'CAPSICUM', retail_price: 0, manufacturing_cost: 0, current_stock: 0, category: 'Vegetables', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  created_at: string;
}

interface DashboardStats {
  totalRevenue: number;
  totalProfit: number;
  totalVegetables: number;
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  lowStockCount: number;
}

// Vegetables Functions
export const getVegetables = async (): Promise<Vegetable[]> => {
  try {
    // First try to fetch from the database
    const { data, error } = await supabase
      .from('vegetables')
      .select('*')

    if (error) {
      console.error('Error fetching vegetables from database, using fallback:', error)
      // If there's an error, return the fixed vegetables array
      return [...FIXED_VEGETABLES]
    }

    // If no data in the database, return the fixed vegetables
    if (!data || data.length === 0) {
      return [...FIXED_VEGETABLES]
    }

    return data
  } catch (error) {
    console.error('Error in getVegetables, using fallback:', error)
    return [...FIXED_VEGETABLES]
  }
}

export const updateVegetablePrices = async (id: string, retailPrice: number, manufacturingCost: number): Promise<Vegetable | null> => {
  try {
    const { data, error } = await supabase
      .from('vegetables')
      .update({ retail_price: retailPrice, manufacturing_cost: manufacturingCost })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating vegetable prices:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('Error in updateVegetablePrices:', error)
    throw error
  }
}

export const getVegetablePrices = async (id: string): Promise<{ retail_price: number; manufacturing_cost: number } | null> => {
  try {
    const { data, error } = await supabase
      .from('vegetables')
      .select('retail_price, manufacturing_cost')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching vegetable prices:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('Error in getVegetablePrices:', error)
    return null
  }
}

export const updateVegetableStock = async (id: string, quantity: number): Promise<Vegetable | null> => {
  try {
    const { data, error } = await supabase
      .from('vegetables')
      .update({ current_stock: quantity })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating vegetable stock:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('Error in updateVegetableStock:', error)
    throw error
  }
}

export const getVegetableStock = async (id: string): Promise<{ current_stock: number } | null> => {
  try {
    const { data, error } = await supabase
      .from('vegetables')
      .select('current_stock')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching vegetable stock:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('Error in getVegetableStock:', error)
    return null
  }
}

// Expense tracking functions
export const getExpenses = async (): Promise<Expense[]> => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching expenses:', error)
      throw error
    }
    return data || []
  } catch (error) {
    console.error('Error in getExpenses:', error)
    return []
  }
}

export const addExpense = async (expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense | null> => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expense])
      .select()
      .single()

    if (error) {
      console.error('Error adding expense:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('Error in addExpense:', error)
    throw error
  }
}

export const updateExpense = async (id: string, updates: Partial<Omit<Expense, 'id' | 'created_at'>>): Promise<Expense | null> => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating expense:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('Error in updateExpense:', error)
    throw error
  }
}

export const deleteExpense = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting expense:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in deleteExpense:', error)
    throw error
  }
}

export const getVegetableSalesStats = async (vegetableId: string): Promise<{ totalSales: number; totalRevenue: number }> => {
  const { data, error } = await supabase
    .from('sales')
    .select('quantity_sold, revenue')
    .eq('vegetable_id', vegetableId);

  if (error) {
    console.error('Error fetching vegetable sales stats:', error);
    throw error;
  }

  const totalSales = data.reduce((sum, sale) => sum + (sale.quantity_sold || 0), 0);
  const totalRevenue = data.reduce((sum, sale) => sum + (sale.revenue || 0), 0);
  
  return { totalSales, totalRevenue }
}

// Vegetable management functions for the fixed catalog
// These functions are simplified for the fixed vegetable catalog

export const addVegetable = async (vegetable: Omit<Vegetable, 'id' | 'created_at' | 'updated_at'>): Promise<Vegetable | null> => {
  try {
    const { data, error } = await supabase
      .from('vegetables')
      .insert([{
        name: vegetable.name,
        retail_price: vegetable.retail_price,
        manufacturing_cost: vegetable.manufacturing_cost || 0,
        current_stock: vegetable.current_stock || 0,
        unit: vegetable.unit || 'kg',
        category: vegetable.category || 'Vegetables'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding vegetable:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in addVegetable:', error);
    throw error;
  }
}

export const updateVegetable = async (id: string, updates: Partial<Vegetable>): Promise<Vegetable | null> => {
  const { data, error } = await supabase
    .from('vegetables')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating vegetable:', error);
    throw error;
  }
  
  return data;
}

export const deleteVegetable = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('vegetables')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting vegetable:', error);
    throw error;
  }
}

// Sales Functions
export const getSales = async (): Promise<Sale[]> => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching sales:', error)
      throw error
    }
    return data || []
  } catch (error) {
    console.error('Error in getSales:', error)
    return []
  }
}

export const updateSale = async (id: string, updates: Partial<Sale>): Promise<Sale | null> => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating sale:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('Error in updateSale:', error)
    return null
  }
}

export const deleteSale = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting sale:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in deleteSale:', error)
    throw error
  }
}

export const addSale = async (sale: Omit<Sale, 'id' | 'created_at'>): Promise<Sale | null> => {
  try {
    // Get the vegetable from the database
    const { data: vegetable, error: vegError } = await supabase
      .from('vegetables')
      .select('*')
      .eq('id', sale.vegetable_id)
      .single()

    if (vegError || !vegetable) {
      console.error('Error fetching vegetable:', vegError)
      throw new Error('Vegetable not found')
    }

    // Check if there's enough stock
    if (vegetable.current_stock < sale.quantity_sold) {
      throw new Error(`Not enough stock. Only ${vegetable.current_stock} ${vegetable.unit} available.`)
    }

    // Add the sale with the provided prices
    const { data, error } = await supabase
      .from('sales')
      .insert([{
        ...sale,
        vegetable_name: vegetable.name // Ensure vegetable_name is set from the database
        // Use the prices from the sale object, not from the database
      }])
      .select()
      .single()

    if (error) {
      console.error('Error adding sale:', error)
      throw error
    }

    // Update stock for the sold item
    const newStock = vegetable.current_stock - sale.quantity_sold;
    await updateVegetableStock(sale.vegetable_id, Math.max(0, newStock));

    return data;
  } catch (error) {
    console.error('Error in addSale:', error);
    throw error;
  }
}


export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const [vegetables, sales, expenses] = await Promise.all([
      getVegetables(),
      getSales(),
      getExpenses()
    ])

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.revenue, 0)
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0)
    const totalExpenses = expenses.reduce((sum, exp) => exp.amount ? sum + exp.amount : sum, 0)
    const netProfit = totalProfit - totalExpenses
    const lowStockVegetables = vegetables.filter(v => v.current_stock <= 5).length
    const totalSales = sales.length
    const totalVegetables = vegetables.length

    return {
      totalRevenue,
      totalProfit,
      totalExpenses,
      netProfit,
      totalVegetables,
      totalSales,
      lowStockCount: lowStockVegetables
    }
  } catch (error) {
    console.error('Error in getDashboardStats:', error)
    throw error
  }
}