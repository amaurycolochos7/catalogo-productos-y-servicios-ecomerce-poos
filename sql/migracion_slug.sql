-- Migración: Agregar campo slug a productos
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columna slug
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS slug text;

-- 2. Generar slugs para productos existentes a partir del nombre
UPDATE productos
SET slug = lower(
    regexp_replace(
        regexp_replace(
            translate(
                lower(nombre),
                'áéíóúüñ',
                'aeiouun'
            ),
            '[^a-z0-9\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
    )
)
WHERE slug IS NULL;

-- 3. Crear índice único para slugs
CREATE UNIQUE INDEX IF NOT EXISTS idx_productos_slug ON productos(slug);

COMMENT ON COLUMN productos.slug IS 'URL amigable generada desde el nombre del producto';
