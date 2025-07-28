-- Create products table
CREATE TABLE products (
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

-- Create sales table
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  quantity_sold INTEGER NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  retail_price DECIMAL(10,2) NOT NULL,
  manufacturing_cost DECIMAL(10,2) NOT NULL,
  revenue DECIMAL(10,2) NOT NULL,
  profit DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create policies for public read/write access (for demo purposes)
-- In production, you should implement proper authentication and authorization

-- Products policies
CREATE POLICY "Allow public read access to products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to products" ON products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to products" ON products
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access to products" ON products
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
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_sales_product_id ON sales(product_id);
CREATE INDEX idx_sales_date ON sales(date);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 