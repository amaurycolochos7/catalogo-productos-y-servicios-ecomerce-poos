-- ============================================
-- MIGRACIÓN: Galería de Fotos
-- Ejecutar en: SQL Editor de Supabase
-- ============================================

-- 1. Crear tablas de imágenes
CREATE TABLE IF NOT EXISTS producto_imagenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  imagen_url TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS servicio_imagenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  servicio_id UUID NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
  imagen_url TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE producto_imagenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicio_imagenes ENABLE ROW LEVEL SECURITY;

-- 3. Políticas para producto_imagenes
CREATE POLICY "Lectura pública de imágenes productos" ON producto_imagenes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin insertar imágenes productos" ON producto_imagenes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin actualizar imágenes productos" ON producto_imagenes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin eliminar imágenes productos" ON producto_imagenes FOR DELETE TO authenticated USING (true);

-- 4. Políticas para servicio_imagenes
CREATE POLICY "Lectura pública de imágenes servicios" ON servicio_imagenes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin insertar imágenes servicios" ON servicio_imagenes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin actualizar imágenes servicios" ON servicio_imagenes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin eliminar imágenes servicios" ON servicio_imagenes FOR DELETE TO authenticated USING (true);

-- 5. Crear bucket de categorías
INSERT INTO storage.buckets (id, name, public)
VALUES ('categorias', 'categorias', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Actualizar políticas de storage (si ya existen, ignorar errores)
-- NOTA: Si las políticas de storage ya existen con nombres anteriores,
-- puede que necesites eliminarlas y recrearlas para incluir 'categorias'.
-- Por seguridad, intenta ejecutar esto:
DO $$
BEGIN
  -- Intentar eliminar y recrear las políticas de storage
  -- Si falla, las políticas existentes seguirán funcionando
  BEGIN
    DROP POLICY IF EXISTS "Imágenes públicas lectura" ON storage.objects;
    DROP POLICY IF EXISTS "Admin subir imágenes" ON storage.objects;
    DROP POLICY IF EXISTS "Admin actualizar imágenes" ON storage.objects;
    DROP POLICY IF EXISTS "Admin eliminar imágenes" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

CREATE POLICY "Imágenes públicas lectura"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('productos', 'servicios', 'configuracion', 'categorias'));

CREATE POLICY "Admin subir imágenes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('productos', 'servicios', 'configuracion', 'categorias'));

CREATE POLICY "Admin actualizar imágenes"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('productos', 'servicios', 'configuracion', 'categorias'));

CREATE POLICY "Admin eliminar imágenes"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('productos', 'servicios', 'configuracion', 'categorias'));
