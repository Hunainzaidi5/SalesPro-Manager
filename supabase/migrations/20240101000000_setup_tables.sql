-- Enable Row Level Security
ALTER TABLE IF EXISTS vegetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses ENABLE ROW LEVEL SECURITY;

-- Create vegetables table if not exists
CREATE OR REPLACE FUNCTION create_vegetables_table()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'vegetables') THEN
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
    
    -- Add some default vegetables if needed
    INSERT INTO public.vegetables (name, retail_price, manufacturing_cost, current_stock, unit, category)
    VALUES 
      ('Tomato', 120.00, 80.00, 50.0, 'kg', 'Vegetables'),
      ('Potato', 60.00, 40.00, 100.0, 'kg', 'Vegetables'),
      ('Onion', 70.00, 50.00, 80.0, 'kg', 'Vegetables'),
      ('Carrot', 90.00, 60.00, 40.0, 'kg', 'Vegetables'),
      ('Cabbage', 50.00, 35.00, 30.0, 'kg', 'Vegetables');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create sales table if not exists
CREATE OR REPLACE FUNCTION create_sales_table()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'sales') THEN
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
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create expenses table if not exists
CREATE OR REPLACE FUNCTION create_expenses_table()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'expenses') THEN
    CREATE TABLE public.expenses (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      category TEXT NOT NULL,
      description TEXT,
      amount DECIMAL(10, 2) NOT NULL,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up RLS policies
CREATE OR REPLACE FUNCTION setup_rls_policies()
RETURNS void AS $$
BEGIN
  -- Vegetables table policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vegetables' AND policyname = 'Enable read access for all users') THEN
    CREATE POLICY "Enable read access for all users" 
    ON public.vegetables
    FOR SELECT
    USING (true);
    
    CREATE POLICY "Enable insert for authenticated users only"
    ON public.vegetables
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
    
    CREATE POLICY "Enable update for authenticated users only"
    ON public.vegetables
    FOR UPDATE
    TO authenticated
    USING (true);
    
    CREATE POLICY "Enable delete for authenticated users only"
    ON public.vegetables
    FOR DELETE
    TO authenticated
    USING (true);
  END IF;
  
  -- Sales table policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Enable read access for all users') THEN
    CREATE POLICY "Enable read access for all users" 
    ON public.sales
    FOR SELECT
    USING (true);
    
    CREATE POLICY "Enable insert for authenticated users only"
    ON public.sales
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
  
  -- Expenses table policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Enable read access for all users') THEN
    CREATE POLICY "Enable read access for all users" 
    ON public.expenses
    FOR SELECT
    USING (true);
    
    CREATE POLICY "Enable insert for authenticated users only"
    ON public.expenses
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
  
  -- Create a trigger to update the updated_at column
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $BODY$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
  END;
  $BODY$ LANGUAGE plpgsql;
  
  -- Apply the trigger to the vegetables table
  DROP TRIGGER IF EXISTS update_vegetables_updated_at ON public.vegetables;
  CREATE TRIGGER update_vegetables_updated_at
  BEFORE UPDATE ON public.vegetables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
  
  -- Apply the trigger to the sales table
  DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
  CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
  
  -- Apply the trigger to the expenses table
  DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
  CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
  
  -- Create a function to update stock on sale
  CREATE OR REPLACE FUNCTION update_stock_on_sale()
  RETURNS TRIGGER AS $BODY$
  BEGIN
    UPDATE public.vegetables 
    SET current_stock = current_stock - NEW.quantity_sold
    WHERE id = NEW.vegetable_id;
    
    RETURN NEW;
  END;
  $BODY$ LANGUAGE plpgsql;
  
  -- Create the trigger for updating stock on sale
  DROP TRIGGER IF EXISTS trigger_update_stock_on_sale ON public.sales;
  CREATE TRIGGER trigger_update_stock_on_sale
  AFTER INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_sale();
  
  -- Create a function to revert stock on sale deletion
  CREATE OR REPLACE FUNCTION revert_stock_on_sale_delete()
  RETURNS TRIGGER AS $BODY$
  BEGIN
    UPDATE public.vegetables 
    SET current_stock = current_stock + OLD.quantity_sold
    WHERE id = OLD.vegetable_id;
    
    RETURN OLD;
  END;
  $BODY$ LANGUAGE plpgsql;
  
  -- Create the trigger for reverting stock on sale deletion
  DROP TRIGGER IF EXISTS trigger_revert_stock_on_sale_delete ON public.sales;
  CREATE TRIGGER trigger_revert_stock_on_sale_delete
  BEFORE DELETE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION revert_stock_on_sale_delete();
  
  -- Create a function to update stock on sale update
  CREATE OR REPLACE FUNCTION update_stock_on_sale_update()
  RETURNS TRIGGER AS $BODY$
  BEGIN
    IF OLD.vegetable_id = NEW.vegetable_id THEN
      -- Same vegetable, adjust stock by the difference
      UPDATE public.vegetables 
      SET current_stock = current_stock + OLD.quantity_sold - NEW.quantity_sold
      WHERE id = OLD.vegetable_id;
    ELSE
      -- Different vegetable, add back to old and subtract from new
      UPDATE public.vegetables 
      SET current_stock = current_stock + OLD.quantity_sold
      WHERE id = OLD.vegetable_id;
      
      UPDATE public.vegetables 
      SET current_stock = current_stock - NEW.quantity_sold
      WHERE id = NEW.vegetable_id;
    END IF;
    
    RETURN NEW;
  END;
  $BODY$ LANGUAGE plpgsql;
  
  -- Create the trigger for updating stock on sale update
  DROP TRIGGER IF EXISTS trigger_update_stock_on_sale_update ON public.sales;
  CREATE TRIGGER trigger_update_stock_on_sale_update
  BEFORE UPDATE OF quantity_sold, vegetable_id ON public.sales
  FOR EACH ROW
  WHEN (OLD.quantity_sold IS DISTINCT FROM NEW.quantity_sold OR OLD.vegetable_id IS DISTINCT FROM NEW.vegetable_id)
  EXECUTE FUNCTION update_stock_on_sale_update();
  
  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(date);
  CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
  CREATE INDEX IF NOT EXISTS idx_vegetables_name ON public.vegetables(name);
  
  -- Create a view for dashboard statistics
  CREATE OR REPLACE VIEW public.dashboard_stats AS
  SELECT 
    (SELECT COALESCE(SUM(revenue), 0) FROM public.sales) as total_revenue,
    (SELECT COALESCE(SUM(profit), 0) FROM public.sales) as total_profit,
    (SELECT COUNT(*) FROM public.vegetables) as total_vegetables,
    (SELECT COUNT(*) FROM public.sales) as total_sales,
    (SELECT COALESCE(SUM(amount), 0) FROM public.expenses) as total_expenses,
    (SELECT COALESCE(SUM(profit), 0) - COALESCE((SELECT SUM(amount) FROM public.expenses), 0) FROM public.sales) as net_profit,
    (SELECT COUNT(*) FROM public.vegetables WHERE current_stock < 10) as low_stock_count;
  
  -- Grant permissions
  GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
  GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
  
  -- Enable Row Level Security
  ALTER TABLE public.vegetables FORCE ROW LEVEL SECURITY;
  ALTER TABLE public.sales FORCE ROW LEVEL SECURITY;
  ALTER TABLE public.expenses FORCE ROW LEVEL SECURITY;
  
  -- Notify that RLS is enabled
  RAISE NOTICE 'Row Level Security (RLS) has been enabled on all tables.';
  
  -- Notify about default data
  RAISE NOTICE 'Default vegetables have been added to the database.';
  
END;
$$ LANGUAGE plpgsql;

-- Execute the setup functions
SELECT create_vegetables_table();
SELECT create_sales_table();
SELECT create_expenses_table();
SELECT setup_rls_policies();

-- Notify completion
DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
  RAISE NOTICE 'The following tables have been created:';
  RAISE NOTICE '- vegetables';
  RAISE NOTICE '- sales';
  RAISE NOTICE '- expenses';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now start using the application with the default data.';
END $$;
