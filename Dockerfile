# Railway-Deploy des qmp-Aufmaß (Vite-SPA) — Build + statisches Serven mit SPA-Fallback.
# Separater Test-Deploy ("Bruder"), NICHT der Lovable-Prod-Betrieb (der hängt an main).

# --- Build-Stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
# Supabase-URL/anon-Key sind im Client hardcodiert (öffentlich) → kein Build-Secret nötig.
# Prod-Build (import.meta.env.DEV=false) → KI-Foto-Check läuft immer echt (kein Mock).
RUN npm run build

# --- Serve-Stage ---
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve@14
COPY --from=build /app/dist ./dist
# Railway setzt $PORT; SPA-Fallback (-s) für die Client-Routen (/thermocheck/aufmass/:id).
EXPOSE 3000
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
