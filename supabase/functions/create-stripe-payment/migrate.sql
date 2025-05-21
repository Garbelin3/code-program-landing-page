
-- This SQL is not applied directly, but is provided as a reference
-- for what needs to be added to the pedidos table

-- Add stripe_session_id column to pedidos table
ALTER TABLE IF EXISTS pedidos
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
