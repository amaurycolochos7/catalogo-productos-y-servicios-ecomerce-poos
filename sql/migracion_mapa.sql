-- Migración: Agregar campo mapa_url a configuracion
-- Ejecutar en: SQL Editor de Supabase

ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS mapa_url TEXT DEFAULT '';
