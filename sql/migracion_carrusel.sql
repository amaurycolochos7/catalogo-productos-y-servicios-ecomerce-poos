-- Migración: Agregar columna hero_carrusel_imagenes a configuracion
-- Ejecutar en Supabase SQL Editor

ALTER TABLE configuracion
ADD COLUMN IF NOT EXISTS hero_carrusel_imagenes text[] DEFAULT '{}';

COMMENT ON COLUMN configuracion.hero_carrusel_imagenes IS 'Array de URLs de imágenes para el carrusel del hero (máximo 3)';
