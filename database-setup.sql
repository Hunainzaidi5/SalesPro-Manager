-- Create menu_items table (finished goods for sales)
CREATE TABLE menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  retail_price DECIMAL(10,2) NOT NULL,
  manufacturing_cost DECIMAL(10,2) NOT NULL,
  current_stock INTEGER DEFAULT 0,
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory_items table (raw materials/stock)
CREATE TABLE inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  unit_cost DECIMAL(10,2) NOT NULL,
  current_stock INTEGER DEFAULT 0,
  category VARCHAR(100),
  min_stock_level INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table (linked to menu_items only)
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  menu_item_name VARCHAR(255) NOT NULL,
  quantity_sold INTEGER NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  retail_price DECIMAL(10,2) NOT NULL,
  manufacturing_cost DECIMAL(10,2) NOT NULL,
  revenue DECIMAL(10,2) NOT NULL,
  profit DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create policies for public read/write access (for demo purposes)
-- In production, you should implement proper authentication and authorization

-- Menu items policies
CREATE POLICY "Allow public read access to menu_items" ON menu_items
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to menu_items" ON menu_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to menu_items" ON menu_items
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to menu_items" ON menu_items
  FOR DELETE USING (true);

-- Inventory items policies
CREATE POLICY "Allow public read access to inventory_items" ON inventory_items
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to inventory_items" ON inventory_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to inventory_items" ON inventory_items
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to inventory_items" ON inventory_items
  FOR DELETE USING (true);

-- Sales policies
CREATE POLICY "Allow public read access to sales" ON sales
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to sales" ON sales
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to sales" ON sales
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to sales" ON sales
  FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_sales_menu_item_id ON sales(menu_item_id);
CREATE INDEX idx_sales_date ON sales(date);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 