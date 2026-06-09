# =====================================================================
# Deploy de AllergenSmart API a Google Cloud Run.
# Edita las variables de abajo y corre desde la carpeta `backend/`:
#   .\scripts\deploy_cloudrun.ps1
#
# Requisitos previos (una sola vez):
#   gcloud auth login
#   gcloud config set project <TU_PROJECT_ID>
#   gcloud services enable run.googleapis.com artifactregistry.googleapis.com `
#       vision.googleapis.com secretmanager.googleapis.com
#
# Secretos en Secret Manager (una sola vez; pega el valor cuando lo pida):
#   gcloud secrets create SUPABASE_SERVICE_ROLE_KEY --replication-policy=automatic
#   echo "<valor>" | gcloud secrets versions add SUPABASE_SERVICE_ROLE_KEY --data-file=-
#   (repetir para DATABASE_URL y GOOGLE_CLOUD_API_KEY)
# =====================================================================

$ErrorActionPreference = "Stop"

# ---- EDITA ESTO ----
$PROJECT_ID = "TU_PROJECT_ID"
$REGION     = "southamerica-west1"   # cercano a Ecuador
$SERVICE    = "allergensmart-api"
$SUPABASE_URL      = "https://TU_PROJECT.supabase.co"
$SUPABASE_ANON_KEY = "TU_ANON_KEY"
$CORS_ORIGINS      = "https://tu-frontend.app"
# --------------------

Write-Host "Desplegando $SERVICE a Cloud Run ($REGION)..." -ForegroundColor Cyan

gcloud run deploy $SERVICE `
  --source . `
  --project $PROJECT_ID `
  --region $REGION `
  --allow-unauthenticated `
  --port 8000 `
  --set-env-vars "ENVIRONMENT=production,SUPABASE_URL=$SUPABASE_URL,SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY,CORS_ORIGINS=$CORS_ORIGINS" `
  --set-secrets "SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,DATABASE_URL=DATABASE_URL:latest,GOOGLE_CLOUD_API_KEY=GOOGLE_CLOUD_API_KEY:latest"

Write-Host "Listo. Prueba: curl -I https://<URL_DE_CLOUD_RUN>/" -ForegroundColor Green
