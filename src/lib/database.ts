import { supabase } from './supabase'
import type { MenuItem, InventoryItem, Sale, DashboardStats } from './supabase'

// Menu Items Functions
export const getMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching menu items:', error)
      throw error
    }
    return data || []
  } catch (error) {
    console.error('Error in getMenuItems:', error)
    return []
  }
}

export const addMenuItem = async (menuItem: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): Promise<MenuItem | null> => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .insert([menuItem])
      .select()
      .single()

    if (error) {
      console.error('Error adding menu item:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('Error in addMenuItem:', error)
    throw error
  }
}

export const updateMenuItem = async (id: string, updates: Partial<MenuItem>): Promise<MenuItem | null> => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating menu item:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('Error in updateMenuItem:', error)
    throw error
  }
}

export const deleteMenuItem = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting menu item:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in deleteMenuItem:', error)
    throw error
  }
}

export const getMenuItemSalesStats = async (menuItemId: string): Promise<{ totalSales: number; totalRevenue: number }> => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .select('quantity_sold, revenue')
      .eq('menu_item_id', menuItemId)

    if (error) {
      console.error('Error fetching menu item sales stats:', error)
      throw error
    }

    const totalSales = data?.reduce((sum, sale) => sum + sale.quantity_sold, 0) || 0
    const totalRevenue = data?.reduce((sum, sale) => sum + sale.revenue, 0) || 0

    return { totalSales, totalRevenue }
  } catch (error) {
    console.error('Error in getMenuItemSalesStats:', error)
    return { totalSales: 0, totalRevenue: 0 }
  }
}

// Inventory Items Functions
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching inventory items:', error)
      throw error
    }
    return data || []
  } catch (error) {
    console.error('Error in getInventoryItems:', error)
    return []
  }
}

export const addInventoryItem = async (inventoryItem: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem | null> => {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([inventoryItem])
      .select()
      .single()

    if (error) {
      console.error('Error adding inventory item:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('Error in addInventoryItem:', error)
    throw error
  }
}

export const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | null> => {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating inventory item:', error)
      throw error
    }
    return data
  } catch (error) {
    console.error('Error in updateInventoryItem:', error)
    throw error
  }
}

export const deleteInventoryItem = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting inventory item:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in deleteInventoryItem:', error)
    throw error
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

export const addSale = async (sale: Omit<Sale, 'id' | 'created_at'>): Promise<Sale | null> => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .insert([sale])
      .select()
      .single()

    if (error) {
      console.error('Error adding sale:', error)
      throw error
    }

    // Update menu item stock
    const menuItems = await getMenuItems()
    const item = menuItems.find(item => item.id === sale.menu_item_id)
    if (item) {
      await updateMenuItem(sale.menu_item_id, {
        current_stock: item.current_stock - sale.quantity_sold
      })
    }

    return data
  } catch (error) {
    console.error('Error in addSale:', error)
    throw error
  }
}

// Dashboard Functions
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const [menuItems, inventoryItems, sales] = await Promise.all([
      getMenuItems(),
      getInventoryItems(),
      getSales()
    ])

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.revenue, 0)
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0)
    const totalMenuItems = menuItems.length
    const totalInventoryItems = inventoryItems.length
    const totalSales = sales.length

    return {
      totalRevenue,
      totalProfit,
      totalMenuItems,
      totalInventoryItems,
      totalSales
    }
  } catch (error) {
    console.error('Error in getDashboardStats:', error)
    return {
      totalRevenue: 0,
      totalProfit: 0,
      totalMenuItems: 0,
      totalInventoryItems: 0,
      totalSales: 0
    }
  }
} 