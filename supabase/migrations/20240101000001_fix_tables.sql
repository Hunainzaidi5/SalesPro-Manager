-- Drop existing tables if they exist to avoid conflicts
DROP TRIGGER IF EXISTS update_vegetable_stock_trigger ON public.sales;
DROP TRIGGER IF EXISTS update_stock_on_sale_update_trigger ON public.sales;
DROP FUNCTION IF EXISTS update_vegetable_stock() CASCADE;
DROP FUNCTION IF EXISTS update_stock_on_sale_update() CASCADE;
DROP FUNCTION IF EXISTS update_stock_on_sale_delete() CASCADE;

-- Drop tables in the correct order to handle foreign key constraints
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.vegetables CASCADE;

-- Recreate vegetables table
CREATE TABLE public.vegetables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT,
  retail_price DECIMAL(10, 2) NOT NULL,
  manufacturing_cost DECIMAL(10, 2) NOT NULL,
  current_stock DECIMAL(10, 2) DEFAULT 0,
  category TEXT,
  unit TEXT DEFAULT 'kg',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sales table
CREATE TABLE public.sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vegetable_id UUID REFERENCES public.vegetables(id) ON DELETE CASCADE,
  vegetable_name TEXT NOT NULL,
  quantity_sold DECIMAL(10, 2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  retail_price DECIMAL(10, 2) NOT NULL,
  manufacturing_cost DECIMAL(10, 2) NOT NULL,
  revenue DECIMAL(10, 2) GENERATED ALWAYS AS (quantity_sold * retail_price) STORED,
  profit DECIMAL(10, 2) GENERATED ALWAYS AS (quantity_sold * (retail_price - manufacturing_cost)) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add some default vegetables
INSERT INTO public.vegetables (name, retail_price, manufacturing_cost, current_stock, unit, category)
VALUES 
  ('Tomato', 120.00, 80.00, 50.0, 'kg', 'Vegetables'),
  ('Potato', 60.00, 40.00, 100.0, 'kg', 'Vegetables'),
  ('Onion', 70.00, 50.00, 80.0, 'kg', 'Vegetables'),
  ('Carrot', 90.00, 60.00, 40.0, 'kg', 'Vegetables'),
  ('Cabbage', 50.00, 35.00, 30.0, 'kg', 'Vegetables');

-- Create trigger function to update stock when a sale is inserted
CREATE OR REPLACE FUNCTION update_vegetable_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vegetables
  SET current_stock = current_stock - NEW.quantity_sold,
      updated_at = now()
  WHERE id = NEW.vegetable_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to update stock when a sale is updated
CREATE OR REPLACE FUNCTION update_stock_on_sale_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Add back the old quantity and subtract the new quantity
  IF OLD.vegetable_id = NEW.vegetable_id THEN
    UPDATE public.vegetables
    SET current_stock = current_stock + OLD.quantity_sold - NEW.quantity_sold,
        updated_at = now()
    WHERE id = NEW.vegetable_id;
  ELSE
    -- If vegetable was changed, update both old and new vegetable stocks
    UPDATE public.vegetables
    SET current_stock = current_stock + OLD.quantity_sold,
        updated_at = now()
    WHERE id = OLD.vegetable_id;
    
    UPDATE public.vegetables
    SET current_stock = current_stock - NEW.quantity_sold,
        updated_at = now()
    WHERE id = NEW.vegetable_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to update stock when a sale is deleted
CREATE OR REPLACE FUNCTION update_stock_on_sale_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vegetables
  SET current_stock = current_stock + OLD.quantity_sold,
      updated_at = now()
  WHERE id = OLD.vegetable_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_vegetable_stock_trigger
AFTER INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION update_vegetable_stock();

CREATE TRIGGER update_stock_on_sale_update_trigger
AFTER UPDATE OF quantity_sold, vegetable_id ON public.sales
FOR EACH ROW
WHEN (OLD.quantity_sold IS DISTINCT FROM NEW.quantity_sold OR OLD.vegetable_id IS DISTINCT FROM NEW.vegetable_id)
EXECUTE FUNCTION update_stock_on_sale_update();

CREATE TRIGGER update_stock_on_sale_delete_trigger
AFTER DELETE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION update_stock_on_sale_delete();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_vegetable_id ON public.sales(vegetable_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);

-- Enable Row Level Security
ALTER TABLE public.vegetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policies for vegetables
CREATE POLICY "Enable read access for all users" 
ON public.vegetables
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON public.vegetables
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
ON public.vegetables
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
ON public.vegetables
FOR DELETE
TO authenticated
USING (true);

-- Create policies for sales
CREATE POLICY "Enable read access for all users"
ON public.sales
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON public.sales
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
ON public.sales
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
ON public.sales
FOR DELETE
TO authenticated
USING (true);

-- Create policies for expenses
CREATE POLICY "Enable read access for all users"
ON public.expenses
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON public.expenses
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
ON public.expenses
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
ON public.expenses
FOR DELETE
TO authenticated
USING (true);
