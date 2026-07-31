-- =====================================================================
-- 🛡️ AllergenSmart - Script SQL de Base de Datos
-- Asignatura: Desarrollo de Sistemas de Información
-- Docente: Ing. José Naranjo, M.Eng.
-- Período Académico: 2026-1
-- =====================================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- 1. ALLERGEN CATEGORIES (Categorías de Alérgenos)
-- =====================================================================
CREATE TABLE IF NOT EXISTS allergen_categories (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL UNIQUE,
    icon_emoji    TEXT,
    description   TEXT,
    display_order INT DEFAULT 0
);

-- =====================================================================
-- 2. ALLERGENS (Catálogo de Alérgenos)
-- =====================================================================
CREATE TABLE IF NOT EXISTS allergens (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id      UUID REFERENCES allergen_categories(id) ON DELETE SET NULL,
    name             TEXT NOT NULL UNIQUE,
    scientific_names TEXT[] DEFAULT '{}',
    synonyms         TEXT[] NOT NULL DEFAULT '{}',
    ocr_variants     TEXT[] DEFAULT '{}',
    is_active        BOOLEAN DEFAULT true
);

-- =====================================================================
-- 3. USER PROFILES (Perfiles de Usuario de Supabase Auth)
-- =====================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id                     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name              TEXT DEFAULT '',
    city                   TEXT DEFAULT 'Manta',
    avatar_url             TEXT,
    notifications_enabled  BOOLEAN DEFAULT true,
    created_at             TIMESTAMPTZ DEFAULT now(),
    updated_at             TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 4. USER ALLERGIES (Relación N:M Perfil - Alérgeno)
-- =====================================================================
CREATE TABLE IF NOT EXISTS user_allergies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    allergen_id UUID NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
    severity    TEXT CHECK (severity IN ('high', 'medium', 'low')) DEFAULT 'high',
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, allergen_id)
);

-- =====================================================================
-- 5. PRODUCTS (Catálogo de Productos)
-- =====================================================================
CREATE TABLE IF NOT EXISTS products (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode           TEXT UNIQUE,
    name              TEXT,
    brand             TEXT,
    ingredients_raw   TEXT,
    ingredients_array TEXT[] DEFAULT '{}',
    image_url         TEXT,
    verified_by_admin BOOLEAN DEFAULT false,
    verified_by       UUID REFERENCES profiles(id),
    verified_at       TIMESTAMPTZ,
    country_origin    TEXT DEFAULT 'EC',
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 6. SCAN HISTORY (Historial de Escaneos de Alérgenos)
-- =====================================================================
CREATE TABLE IF NOT EXISTS scan_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    product_id          UUID REFERENCES products(id),
    barcode             TEXT,
    result_status       TEXT NOT NULL CHECK (result_status IN ('safe', 'warning', 'danger')),
    detected_allergens  JSONB DEFAULT '[]',
    ocr_confidence      REAL CHECK (ocr_confidence >= 0.0 AND ocr_confidence <= 1.0),
    ingredients_found   TEXT[] DEFAULT '{}',
    processing_time_ms  INT,
    from_cache          BOOLEAN DEFAULT false,
    scanned_at          TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 7. PRODUCT REPORTS (Crowdsourcing - Reportes de Productos Locales)
-- =====================================================================
CREATE TABLE IF NOT EXISTS product_reports (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_by UUID NOT NULL REFERENCES profiles(id),
    product_id  UUID REFERENCES products(id),
    barcode     TEXT,
    photo_url   TEXT,
    notes       TEXT,
    status      TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 8. OCR CACHE (Caché L2 de Escaneo por Barcode)
-- =====================================================================
CREATE TABLE IF NOT EXISTS ocr_cache (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode               TEXT UNIQUE NOT NULL,
    ocr_text              TEXT,
    ingredients_extracted  TEXT[] DEFAULT '{}',
    warnings_extracted    TEXT[] DEFAULT '{}',
    ocr_confidence        REAL,
    expires_at            TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
    created_at            TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================
-- 9. INDEXES (Índices para consultas óptimas)
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_scan_history_user_date ON scan_history(user_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_ocr_cache_expires ON ocr_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_allergens_synonyms ON allergens USING GIN(synonyms);
CREATE INDEX IF NOT EXISTS idx_allergens_ocr_variants ON allergens USING GIN(ocr_variants);
CREATE INDEX IF NOT EXISTS idx_reports_pending ON product_reports(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_user_allergies_user ON user_allergies(user_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand) WHERE brand IS NOT NULL;

-- =====================================================================
-- 10. TRIGGERS (Automatizaciones y Sincronizaciones)
-- =====================================================================

-- Creación automática del perfil de usuario tras el registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, city)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'Manta'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Actualización automática de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_products ON products;
CREATE TRIGGER set_updated_at_products
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Función de limpieza de caché expirada
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ocr_cache WHERE expires_at < now();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 11. ROW LEVEL SECURITY (Seguridad de Fila de Supabase)
-- =====================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE user_allergies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own allergies" ON user_allergies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own allergies" ON user_allergies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own allergies" ON user_allergies FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own scans" ON scan_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scans" ON scan_history FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read products" ON products FOR SELECT USING (true);

ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read allergens" ON allergens FOR SELECT USING (true);

ALTER TABLE allergen_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON allergen_categories FOR SELECT USING (true);

ALTER TABLE product_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reports" ON product_reports FOR SELECT USING (auth.uid() = reported_by);
CREATE POLICY "Users can create reports" ON product_reports FOR INSERT WITH CHECK (auth.uid() = reported_by);

ALTER TABLE ocr_cache ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 12. SEED DATA (Datos semilla de alérgenos y categorías de Manta/Ecuador)
-- =====================================================================
INSERT INTO allergen_categories (name, icon_emoji, description, display_order) VALUES
    ('Cereales con Gluten',  '🌾', 'Trigo, cebada, centeno, avena y derivados', 1),
    ('Lácteos',              '🥛', 'Leche, queso, yogur y derivados lácteos', 2),
    ('Frutos de Cáscara',    '🥜', 'Maní, almendras, nueces y frutos secos', 3),
    ('Soya',                 '🫘', 'Soja, lecitina de soya y derivados', 4),
    ('Huevos',               '🥚', 'Huevo, albúmina, ovoalbúmina', 5),
    ('Mariscos',             '🦐', 'Camarón, langosta, cangrejo', 6),
    ('Pescados',             '🐟', 'Atún, sardina, anchoa y derivados', 7),
    ('Sulfitos',             '🧪', 'Dióxido de azufre y sulfitos', 8),
    ('Apio',                 '🥬', 'Apio y extractos de apio', 9),
    ('Mostaza',              '🟡', 'Mostaza y semillas de mostaza', 10),
    ('Sésamo',               '🫓', 'Ajonjolí, tahini y derivados', 11)
ON CONFLICT (name) DO NOTHING;

-- Semillas de Alérgenos
INSERT INTO allergens (category_id, name, scientific_names, synonyms, ocr_variants)
SELECT id, 'gluten',
    ARRAY['Triticum aestivum', 'Hordeum vulgare', 'Secale cereale'],
    ARRAY['trigo', 'cebada', 'centeno', 'avena', 'espelta', 'harina de trigo', 'gluten'],
    ARRAY['glten', 'giuten']
FROM allergen_categories WHERE name = 'Cereales con Gluten'
ON CONFLICT (name) DO NOTHING;

INSERT INTO allergens (category_id, name, scientific_names, synonyms, ocr_variants)
SELECT id, 'lactosa',
    ARRAY['Beta-D-galactopyranosyl-(1-4)-D-glucose'],
    ARRAY['leche', 'lácteo', 'lácteos', 'suero de leche', 'caseína', 'lactosuero', 'lactosa'],
    ARRAY['1actosa', 'lactossa']
FROM allergen_categories WHERE name = 'Lácteos'
ON CONFLICT (name) DO NOTHING;

INSERT INTO allergens (category_id, name, scientific_names, synonyms, ocr_variants)
SELECT id, 'maní',
    ARRAY['Arachis hypogaea'],
    ARRAY['maní', 'cacahuete', 'cacahuate', 'mantequilla de maní', 'pasta de maní'],
    ARRAY['mani']
FROM allergen_categories WHERE name = 'Frutos de Cáscara'
ON CONFLICT (name) DO NOTHING;
