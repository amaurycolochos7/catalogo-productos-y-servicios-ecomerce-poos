-- ============================================
-- CATÁLOGO WEB DE PRODUCTOS Y SERVICIOS
-- Script completo para Supabase
-- Ejecutar en: SQL Editor de tu proyecto Supabase
-- ============================================

-- 1. CREAR TABLAS
-- ============================================

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  imagen_url TEXT,
  destacado BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de servicios
CREATE TABLE IF NOT EXISTS servicios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL DEFAULT 0,
  imagen_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de imágenes de productos (galería)
CREATE TABLE IF NOT EXISTS producto_imagenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  imagen_url TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de imágenes de servicios (galería)
CREATE TABLE IF NOT EXISTS servicio_imagenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  servicio_id UUID NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
  imagen_url TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de configuración del negocio (PERSONALIZACIÓN TOTAL)
CREATE TABLE IF NOT EXISTS configuracion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Información básica
  nombre_negocio TEXT NOT NULL DEFAULT 'Mi Negocio',
  slogan TEXT DEFAULT '',
  whatsapp_contacto TEXT DEFAULT '',
  telefono TEXT DEFAULT '',
  logo_url TEXT,
  direccion TEXT DEFAULT '',
  horario JSONB DEFAULT '{}'::jsonb,

  -- Hero
  hero_titulo TEXT DEFAULT 'Tu Selección de Calidad',
  hero_subtitulo TEXT DEFAULT 'Productos y Servicios de Origen Familiar',
  hero_imagen_url TEXT,
  hero_badge TEXT DEFAULT '● Catálogo disponible',
  hero_boton_texto TEXT DEFAULT 'Explorar Catálogo',
  hero_boton_secundario_texto TEXT DEFAULT 'Contáctanos',

  -- Estadísticas del Hero
  stats JSONB DEFAULT '[{"valor":"100+","etiqueta":"Productos"},{"valor":"500+","etiqueta":"Clientes felices"},{"valor":"24/7","etiqueta":"WhatsApp"}]'::jsonb,

  -- Colores personalizables
  color_primario TEXT DEFAULT '#1a365d',
  color_secundario TEXT DEFAULT '#c9a84c',
  color_acento TEXT DEFAULT '#e8a020',
  color_fondo TEXT DEFAULT '#faf5eb',
  color_texto TEXT DEFAULT '#1a202c',

  -- Textos de secciones
  texto_categorias_titulo TEXT DEFAULT 'Explora Nuestras Categorías',
  texto_categorias_subtitulo TEXT DEFAULT 'Encuentra lo que necesitas organizados por categoría',
  texto_catalogo_titulo TEXT DEFAULT 'Nuestro Catálogo Destacado',
  texto_catalogo_subtitulo TEXT DEFAULT 'Los mejores productos seleccionados para ti',
  texto_servicios_titulo TEXT DEFAULT 'Nuestros Servicios',
  texto_servicios_subtitulo TEXT DEFAULT 'Servicios profesionales a tu alcance',
  texto_contacto_titulo TEXT DEFAULT 'Visítanos y Contáctanos',
  texto_contacto_subtitulo TEXT DEFAULT 'Estamos aquí para atenderte',

  -- Footer
  texto_footer TEXT DEFAULT 'Tu selección de calidad en productos y servicios.',

  -- Redes sociales
  redes_sociales JSONB DEFAULT '{"facebook":"","instagram":"","tiktok":""}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now()
);


-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_imagenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicio_imagenes ENABLE ROW LEVEL SECURITY;


-- 3. POLÍTICAS DE ACCESO PÚBLICO (lectura para todos)
-- ============================================

CREATE POLICY "Lectura pública de categorías"
  ON categorias FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Lectura pública de productos"
  ON productos FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Lectura pública de servicios"
  ON servicios FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Lectura pública de configuración"
  ON configuracion FOR SELECT TO anon, authenticated USING (true);


-- 4. POLÍTICAS DE ESCRITURA (solo administradores autenticados)
-- ============================================

CREATE POLICY "Admin insertar categorías" ON categorias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin actualizar categorías" ON categorias FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin eliminar categorías" ON categorias FOR DELETE TO authenticated USING (true);

CREATE POLICY "Admin insertar productos" ON productos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin actualizar productos" ON productos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin eliminar productos" ON productos FOR DELETE TO authenticated USING (true);

CREATE POLICY "Admin insertar servicios" ON servicios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin actualizar servicios" ON servicios FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin eliminar servicios" ON servicios FOR DELETE TO authenticated USING (true);

CREATE POLICY "Lectura pública de imágenes productos" ON producto_imagenes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin insertar imágenes productos" ON producto_imagenes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin actualizar imágenes productos" ON producto_imagenes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin eliminar imágenes productos" ON producto_imagenes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Lectura pública de imágenes servicios" ON servicio_imagenes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin insertar imágenes servicios" ON servicio_imagenes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin actualizar imágenes servicios" ON servicio_imagenes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin eliminar imágenes servicios" ON servicio_imagenes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Admin insertar configuración" ON configuracion FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin actualizar configuración" ON configuracion FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin eliminar configuración" ON configuracion FOR DELETE TO authenticated USING (true);


-- 5. CREAR BUCKETS DE STORAGE (para imágenes)
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('productos', 'productos', true),
  ('servicios', 'servicios', true),
  ('configuracion', 'configuracion', true),
  ('categorias', 'categorias', true)
ON CONFLICT (id) DO NOTHING;

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


-- 6. DATOS DE EJEMPLO
-- ============================================

INSERT INTO configuracion (
  nombre_negocio, slogan, whatsapp_contacto, telefono, direccion,
  hero_titulo, hero_subtitulo, hero_badge,
  hero_boton_texto, hero_boton_secundario_texto,
  color_primario, color_secundario, color_acento, color_fondo, color_texto,
  horario, redes_sociales
) VALUES (
  'Catálogo de Productos',
  'Tu Selección de Calidad',
  '5219999999999',
  '+52 999 999 9999',
  'Tu dirección aquí',
  'Tu Selección de Calidad.',
  'Productos y Servicios de Origen Familiar. Contáctanos directamente por WhatsApp.',
  '● Catálogo disponible',
  'Explorar Catálogo',
  'Contáctanos',
  '#1a365d',
  '#c9a84c',
  '#e8a020',
  '#faf5eb',
  '#1a202c',
  '{"lunes":"9:00 am - 6:00 pm","martes":"9:00 am - 6:00 pm","miercoles":"9:00 am - 6:00 pm","jueves":"9:00 am - 6:00 pm","viernes":"9:00 am - 6:00 pm","sabado":"9:00 am - 2:00 pm","domingo":"Cerrado"}'::jsonb,
  '{"facebook":"","instagram":"","tiktok":""}'::jsonb
);

INSERT INTO categorias (nombre, descripcion, orden) VALUES
  ('Electrónica', 'Dispositivos y gadgets tecnológicos', 1),
  ('Hogar', 'Artículos para el hogar y decoración', 2),
  ('Ropa', 'Prendas de vestir y accesorios', 3);

INSERT INTO productos (nombre, descripcion, precio, stock, categoria_id, destacado, activo)
VALUES
  ('Audífonos Bluetooth', 'Audífonos inalámbricos con cancelación de ruido.', 599.00, 15, (SELECT id FROM categorias WHERE nombre = 'Electrónica'), true, true),
  ('Lámpara LED Inteligente', 'Lámpara RGB con control desde tu celular.', 349.00, 20, (SELECT id FROM categorias WHERE nombre = 'Hogar'), false, true),
  ('Playera Premium', 'Playera de algodón 100% orgánico.', 299.00, 50, (SELECT id FROM categorias WHERE nombre = 'Ropa'), true, true),
  ('Smartwatch Deportivo', 'Reloj inteligente con monitor cardíaco y GPS.', 1299.00, 8, (SELECT id FROM categorias WHERE nombre = 'Electrónica'), true, true),
  ('Cojín Decorativo', 'Cojín de terciopelo con diseño moderno.', 189.00, 30, (SELECT id FROM categorias WHERE nombre = 'Hogar'), false, true);

INSERT INTO servicios (nombre, descripcion, precio, activo) VALUES
  ('Instalación a Domicilio', 'Servicio de instalación profesional.', 250.00, true),
  ('Asesoría Personalizada', 'Asesoría para elegir los mejores productos.', 0.00, true),
  ('Envío Express', 'Entrega el mismo día en tu zona.', 99.00, true);

-- ============================================
-- ¡LISTO! Ahora crea un usuario en Authentication > Users
-- ============================================
