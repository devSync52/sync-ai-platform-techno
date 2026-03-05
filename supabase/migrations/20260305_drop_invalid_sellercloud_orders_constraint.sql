-- Drop the invalid constraint that references non-existent columns
-- This constraint was causing "duplicate key value violates unique constraint" errors
-- even though the columns (account_order_id) don't exist in the table

ALTER TABLE IF EXISTS public.sellercloud_orders 
  DROP CONSTRAINT IF EXISTS sellercloud_orders_account_order_id_key;

-- The table's primary key (id) is already unique and serves as the conflict resolution target
-- for upserts, so this constraint is not needed.
