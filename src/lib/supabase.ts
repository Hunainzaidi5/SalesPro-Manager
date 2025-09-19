// In your supabase.ts file, it should look like this:
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
})

// Database types
export interface Vegetable {
  id: string
  name: string
  sku?: string
  retail_price: number
  manufacturing_cost: number
  current_stock: number
  category?: string
  unit?: string
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: string
  name: string
  sku: string
  unit_cost: number
  current_stock: number
  category?: string
  min_stock_level: number
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  vegetable_id: string
  vegetable_name: string
  quantity_sold: number
  date: string
  retail_price: number
  manufacturing_cost: number
  revenue: number
  profit: number
  created_at: string
}

export interface DashboardStats {
  totalRevenue: number
  totalProfit: number
  totalVegetables: number
  totalInventoryItems: number
  totalSales: number
  totalExpenses: number
  netProfit: number
  lowStockCount: number
}