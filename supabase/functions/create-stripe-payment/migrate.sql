
-- This SQL is not applied directly, but is provided as a reference
-- for what needs to be added to the pedidos table

-- Add stripe_session_id column to pedidos table
ALTER TABLE IF EXISTS pedidos
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- Add data_criacao column to pedidos table
ALTER TABLE IF EXISTS pedidos
ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMP WITH TIME ZONE;

-- Add data_pagamento column to pedidos table
ALTER TABLE IF EXISTS pedidos
ADD COLUMN IF NOT EXISTS data_pagamento TIMESTAMP WITH TIME ZONE;

-- Add invalidado column to codigos_retirada table
ALTER TABLE IF EXISTS codigos_retirada
ADD COLUMN IF NOT EXISTS invalidado BOOLEAN DEFAULT false;
