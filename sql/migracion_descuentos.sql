-- Migración: Agregar campo de precio con descuento a productos
-- Ejecutar en Supabase SQL Editor

ALTER TABLE productos
ADD COLUMN IF NOT EXISTS precio_descuento numeric(10,2) DEFAULT NULL;

COMMENT ON COLUMN productos.precio_descuento IS 'Precio con descuento (opcional). Si tiene valor, se muestra como oferta.';
