import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tunnqdtqrypmunxajomv.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bm5xZHRxcnlwbXVueGFqb212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1MTMzNTMsImV4cCI6MjA2OTA4OTM1M30.Kc6cz49FjduNErUCO39Oe-bil9mtMosBeYf-CNlxhYk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface MenuItem {
  id: string
  name: string
  sku: string
  retail_price: number
  manufacturing_cost: number
  current_stock: number
  category?: string
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
  menu_item_id: string
  menu_item_name: string
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
  totalMenuItems: number
  totalInventoryItems: number
  totalSales: number
} 