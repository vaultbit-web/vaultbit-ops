# syntax=docker/dockerfile:1.7
# Build multi-stage para VaultBit Ops (Next.js 15 + standalone output)
#
# IMPORTANTE: el contexto de build es la RAÍZ DEL REPO (no la carpeta ops/).
# Dokploy clona el repo entero como context, así que todos los COPY referencian
# rutas con prefijo `ops/`. Si en el futuro alguien construye este Dockerfile
# manualmente, hacer:  docker build -f ops/Dockerfile -t vaultbit-ops .

# ──────────────────────────────────────────────────────────────────────
# Stage 1 · deps: instala dependencias en una capa cacheable
# ──────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Compatibilidad con node-gyp en alpine para algunos binarios opcionales
RUN apk add --no-cache libc6-compat

COPY ops/package.json ops/package-lock.json ./
RUN npm ci --no-audit --no-fund

# ──────────────────────────────────────────────────────────────────────
# Stage 2 · builder: compila la app con next build (output: standalone)
# ──────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY ops/ ./

# Las variables NEXT_PUBLIC_* se inlinean en el bundle del cliente en
# build-time, NO en runtime. Por eso vienen como --build-arg desde Dokploy
# (campo "Build Args" de la application). Si las dejamos como placeholder,
# el navegador intenta hablar con `placeholder.supabase.co` y falla.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL=https://app.vaultbit.es

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

RUN npm run build

# ──────────────────────────────────────────────────────────────────────
# Stage 3 · runner: imagen final, mínima, sólo runtime de Next.js
# ──────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiamos sólo lo necesario del standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3001

CMD ["node", "server.js"]
