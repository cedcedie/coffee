# Database Setup Instructions

## How to Run SQL Migrations

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard: https://app.supabase.com/
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Run the Migration
1. Open the SQL file you want to run (e.g., `01_create_orders_table.sql`)
2. Copy the entire contents
3. Paste it into the SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)

### Step 3: Verify
1. Go to **"Table Editor"** in the left sidebar
2. You should see your new `orders` table
3. Check the **"Policies"** tab to see RLS is enabled

## Migration Files

- `01_create_orders_table.sql` - Creates the orders table with RLS policies

## Adding More Tables

To add more tables, create new SQL files following the same pattern:
- `02_create_products_table.sql`
- `03_create_customers_table.sql`
- etc.

Run them in order (01, 02, 03...) to maintain dependencies.

## Notes

- All tables have Row Level Security (RLS) enabled
- Policies ensure users can only access their own data
- The `updated_at` field is automatically updated via trigger
- Foreign keys reference `auth.users` for user relationships




