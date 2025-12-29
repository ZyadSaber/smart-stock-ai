-- Migration: Add customer_name and notes to sales table
-- Date: 2025-12-30

ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;
