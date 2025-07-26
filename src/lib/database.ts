import { supabase, type Product, type Sale, type DashboardStats } from './supabase'

// Product functions
export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data || []
}

export const addProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
  const { error } = await supabase
    .from('products')
    .insert([product])

  if (error) {
    console.error('Error adding product:', error)
    return false
  }

  return true
}

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<boolean> => {
  const { error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error updating product:', error)
    return false
  }

  return true
}

export const deleteProduct = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting product:', error)
    return false
  }

  return true
}

// Sale functions
export const getSales = async (): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching sales:', error)
    return []
  }

  return data || []
}

export const addSale = async (sale: Omit<Sale, 'id' | 'created_at'>): Promise<boolean> => {
  const { error } = await supabase
    .from('sales')
    .insert([sale])

  if (error) {
    console.error('Error adding sale:', error)
    return false
  }

  // Update product stock
  const { error: updateError } = await supabase
    .from('products')
    .update({ 
      current_stock: sale.quantity_sold,
      updated_at: new Date().toISOString()
    })
    .eq('id', sale.product_id)
    .lt('current_stock', sale.quantity_sold)

  if (updateError) {
    console.error('Error updating product stock:', updateError)
  }

  return true
}

// Dashboard stats
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const [products, sales] = await Promise.all([
    getProducts(),
    getSales()
  ])

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.revenue, 0)
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0)

  return {
    totalRevenue,
    totalProfit,
    totalProducts: products.length,
    totalSales: sales.length
  }
}

// Product sales stats
export const getProductSalesStats = async (productId: string) => {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('product_id', productId)

  if (error) {
    console.error('Error fetching product sales:', error)
    return { totalSales: 0, totalRevenue: 0 }
  }

  const sales = data || []
  const totalSales = sales.length
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.revenue, 0)

  return { totalSales, totalRevenue }
} 