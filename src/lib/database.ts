import { supabase } from './supabase'
import type { MenuItem, InventoryItem, Sale, DashboardStats } from './supabase'

// Menu Items Functions
export const getMenuItems = async (): Promise<MenuItem[]> => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const addMenuItem = async (menuItem: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): Promise<MenuItem> => {
  const { data, error } = await supabase
    .from('menu_items')
    .insert([menuItem])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateMenuItem = async (id: string, updates: Partial<MenuItem>): Promise<MenuItem> => {
  const { data, error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteMenuItem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export const getMenuItemSalesStats = async (menuItemId: string) => {
  const { data, error } = await supabase
    .from('sales')
    .select('quantity_sold, revenue')
    .eq('menu_item_id', menuItemId)

  if (error) throw error

  const totalSales = data?.reduce((sum, sale) => sum + sale.quantity_sold, 0) || 0
  const totalRevenue = data?.reduce((sum, sale) => sum + sale.revenue, 0) || 0

  return { totalSales, totalRevenue }
}

// Inventory Items Functions
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const addInventoryItem = async (inventoryItem: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> => {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert([inventoryItem])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> => {
  const { data, error } = await supabase
    .from('inventory_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteInventoryItem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Sales Functions
export const getSales = async (): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

export const addSale = async (sale: Omit<Sale, 'id' | 'created_at'>): Promise<Sale> => {
  const { data, error } = await supabase
    .from('sales')
    .insert([sale])
    .select()
    .single()

  if (error) throw error
  return data
}

// Dashboard Functions
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const [menuItems, inventoryItems, sales] = await Promise.all([
    getMenuItems(),
    getInventoryItems(),
    getSales()
  ])

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.revenue, 0)
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0)

  return {
    totalRevenue,
    totalProfit,
    totalMenuItems: menuItems.length,
    totalInventoryItems: inventoryItems.length,
    totalSales: sales.length
  }
}

// Legacy functions for backward compatibility (will be removed)
export const getProducts = getMenuItems
export const addProduct = addMenuItem
export const updateProduct = updateMenuItem
export const deleteProduct = deleteMenuItem
export const getProductSalesStats = getMenuItemSalesStats 