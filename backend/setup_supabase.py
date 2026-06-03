import asyncio
import os
import sys

# Agregar el directorio raíz al path para poder importar 'app'
sys.path.insert(0, '.')

from dotenv import load_dotenv
load_dotenv()

from app.config import settings
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

SQL_COMMANDS = [
"""
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, city, language, is_admin, notifications_enabled)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url',
    'Manta',
    'es-EC',
    FALSE,
    TRUE
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
""",
"DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;",
"""
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
""",
"ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;",
"ALTER TABLE public.allergen_categories ENABLE ROW LEVEL SECURITY;",
"ALTER TABLE public.allergens ENABLE ROW LEVEL SECURITY;",
"ALTER TABLE public.user_allergies ENABLE ROW LEVEL SECURITY;",
"ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;",
"ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;",
"ALTER TABLE public.product_reports ENABLE ROW LEVEL SECURITY;",
"ALTER TABLE public.ocr_cache ENABLE ROW LEVEL SECURITY;",
"DROP POLICY IF EXISTS \"Public profiles are viewable by everyone\" ON public.profiles;",
"CREATE POLICY \"Public profiles are viewable by everyone\" ON public.profiles FOR SELECT USING (true);",
"DROP POLICY IF EXISTS \"Users can update own profile\" ON public.profiles;",
"CREATE POLICY \"Users can update own profile\" ON public.profiles FOR UPDATE USING (auth.uid() = id);",
"DROP POLICY IF EXISTS \"Allergen categories are viewable by everyone\" ON public.allergen_categories;",
"CREATE POLICY \"Allergen categories are viewable by everyone\" ON public.allergen_categories FOR SELECT USING (true);",
"DROP POLICY IF EXISTS \"Allergens are viewable by everyone\" ON public.allergens;",
"CREATE POLICY \"Allergens are viewable by everyone\" ON public.allergens FOR SELECT USING (true);",
"DROP POLICY IF EXISTS \"Users can view own allergies\" ON public.user_allergies;",
"CREATE POLICY \"Users can view own allergies\" ON public.user_allergies FOR SELECT USING (auth.uid() = user_id);",
"DROP POLICY IF EXISTS \"Users can insert own allergies\" ON public.user_allergies;",
"CREATE POLICY \"Users can insert own allergies\" ON public.user_allergies FOR INSERT WITH CHECK (auth.uid() = user_id);",
"DROP POLICY IF EXISTS \"Users can update own allergies\" ON public.user_allergies;",
"CREATE POLICY \"Users can update own allergies\" ON public.user_allergies FOR UPDATE USING (auth.uid() = user_id);",
"DROP POLICY IF EXISTS \"Users can delete own allergies\" ON public.user_allergies;",
"CREATE POLICY \"Users can delete own allergies\" ON public.user_allergies FOR DELETE USING (auth.uid() = user_id);",
"DROP POLICY IF EXISTS \"Users can view own scan history\" ON public.scan_history;",
"CREATE POLICY \"Users can view own scan history\" ON public.scan_history FOR SELECT USING (auth.uid() = user_id);",
"DROP POLICY IF EXISTS \"Users can insert own scan history\" ON public.scan_history;",
"CREATE POLICY \"Users can insert own scan history\" ON public.scan_history FOR INSERT WITH CHECK (auth.uid() = user_id);",
"DROP POLICY IF EXISTS \"Products are viewable by everyone\" ON public.products;",
"CREATE POLICY \"Products are viewable by everyone\" ON public.products FOR SELECT USING (true);",
"DROP POLICY IF EXISTS \"Users can insert products\" ON public.products;",
"CREATE POLICY \"Users can insert products\" ON public.products FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);",
"DROP POLICY IF EXISTS \"Users can insert reports\" ON public.product_reports;",
"CREATE POLICY \"Users can insert reports\" ON public.product_reports FOR INSERT WITH CHECK (auth.uid() = reported_by);",
"DROP POLICY IF EXISTS \"OCR Cache is server only\" ON public.ocr_cache;",
"CREATE POLICY \"OCR Cache is server only\" ON public.ocr_cache FOR ALL USING (false);"
]

async def run_setup():
    engine = create_async_engine(settings.database_url, echo=False)
    async with engine.begin() as conn:
        for cmd in SQL_COMMANDS:
            await conn.execute(text(cmd))
    await engine.dispose()
    print("Supabase triggers and RLS policies setup successfully completed.")

asyncio.run(run_setup())