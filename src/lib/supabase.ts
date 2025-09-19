import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { supabaseConfig } from '../config/supabase';

// Validate configuration
if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  console.warn(
    'Supabase URL or Anon Key is missing. ' +
    'Please check your environment variables for web or Capacitor configuration for mobile.'
  );
}

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: !Capacitor.isNativePlatform(), // Only detect session in URL for web
  },
});

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