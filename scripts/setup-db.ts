import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('Setting up database tables...');
    
    // Create vegetables table
    const { data: vegetablesTable, error: vegetablesError } = await supabase.rpc('create_vegetables_table');
    
    if (vegetablesError) {
      if (vegetablesError.message.includes('already exists')) {
        console.log('Vegetables table already exists');
      } else {
        throw vegetablesError;
      }
    } else {
      console.log('Created vegetables table');
    }

    // Create sales table
    const { data: salesTable, error: salesError } = await supabase.rpc('create_sales_table');
    
    if (salesError) {
      if (salesError.message.includes('already exists')) {
        console.log('Sales table already exists');
      } else {
        throw salesError;
      }
    } else {
      console.log('Created sales table');
    }

    // Create expenses table
    const { data: expensesTable, error: expensesError } = await supabase.rpc('create_expenses_table');
    
    if (expensesError) {
      if (expensesError.message.includes('already exists')) {
        console.log('Expenses table already exists');
      } else {
        throw expensesError;
      }
    } else {
      console.log('Created expenses table');
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
