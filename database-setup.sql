-- Create vegetables table
CREATE TABLE vegetables (
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

-- Create sales table (linked to vegetables)
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vegetable_id UUID REFERENCES vegetables(id) ON DELETE CASCADE,
  vegetable_name VARCHAR(255) NOT NULL,
  quantity_sold INTEGER NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  retail_price DECIMAL(10,2) NOT NULL,
  manufacturing_cost DECIMAL(10,2) NOT NULL,
  revenue DECIMAL(10,2) NOT NULL,
  profit DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table for tracking business expenses
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE vegetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for public read/write access (for demo purposes)
-- In production, you should implement proper authentication and authorization

-- Vegetable items policies
CREATE POLICY "Allow public read access to vegetables" ON vegetables
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to vegetables" ON vegetables
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to vegetables" ON vegetables
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to vegetables" ON vegetables
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

-- Expenses policies
CREATE POLICY "Allow public read access to expenses" ON expenses
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to expenses" ON expenses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to expenses" ON expenses
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to expenses" ON expenses
  FOR DELETE USING (true);

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_vegetables_updated_at
    BEFORE UPDATE ON vegetables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to get sales statistics
CREATE OR REPLACE FUNCTION get_sales_stats()
RETURNS TABLE (
    total_sales BIGINT,
    total_revenue DECIMAL(10,2),
    total_profit DECIMAL(10,2),
    avg_profit_margin DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_sales,
        COALESCE(SUM(revenue), 0) as total_revenue,
        COALESCE(SUM(profit), 0) as total_profit,
        CASE 
            WHEN COALESCE(SUM(revenue), 0) = 0 THEN 0 
            ELSE (COALESCE(SUM(profit), 0) / NULLIF(SUM(revenue), 0) * 100) 
        END as avg_profit_margin
    FROM sales;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX idx_vegetables_category ON vegetables(category);
CREATE INDEX idx_sales_vegetable_id ON sales(vegetable_id);
CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_vegetables_updated_at
    BEFORE UPDATE ON vegetables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 