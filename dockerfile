# Fase 1: Base (Instalación de herramientas necesarias)
FROM node:20-alpine AS base

# Dependencias necesarias para Prisma y Alpine
RUN apk add --no-cache libc6-compat openssl

# Habilitar pnpm
RUN corepack enable pnpm


# Fase 2: Dependencias
FROM base AS deps
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Instalar TODAS las dependencias congelando el lockfile
RUN pnpm install --frozen-lockfile

# Fase 3: Construcción de la aplicación (Builder)
FROM base AS builder
WORKDIR /app

# Copiar las dependencias de la fase anterior
COPY --from=deps /app/node_modules ./node_modules
# Copiar el resto del código fuente
COPY . .

# Deshabilitar telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Variables NEXT_PUBLIC requeridas en tiempo de compilación (build time) para el frontend
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

ARG NEXT_PUBLIC_TEMPLATE_NAME
ENV NEXT_PUBLIC_TEMPLATE_NAME=$NEXT_PUBLIC_TEMPLATE_NAME

ARG NEXT_PUBLIC_TEMPLATE_SLOGAN
ENV NEXT_PUBLIC_TEMPLATE_SLOGAN=$NEXT_PUBLIC_TEMPLATE_SLOGAN

ARG NEXT_PUBLIC_TEMPLATE_LOGO
ENV NEXT_PUBLIC_TEMPLATE_LOGO=$NEXT_PUBLIC_TEMPLATE_LOGO

ARG NEXT_PUBLIC_SETTINGS_COOKIE_NAME
ENV NEXT_PUBLIC_SETTINGS_COOKIE_NAME=$NEXT_PUBLIC_SETTINGS_COOKIE_NAME

ARG NEXT_PUBLIC_PRIMARY_COLOR_MAIN
ENV NEXT_PUBLIC_PRIMARY_COLOR_MAIN=$NEXT_PUBLIC_PRIMARY_COLOR_MAIN

ARG NEXT_PUBLIC_PRIMARY_COLOR_LIGHT
ENV NEXT_PUBLIC_PRIMARY_COLOR_LIGHT=$NEXT_PUBLIC_PRIMARY_COLOR_LIGHT

ARG NEXT_PUBLIC_PRIMARY_COLOR_DARK
ENV NEXT_PUBLIC_PRIMARY_COLOR_DARK=$NEXT_PUBLIC_PRIMARY_COLOR_DARK

ARG NEXT_PUBLIC_IZIPAY_SDK_URL
ENV NEXT_PUBLIC_IZIPAY_SDK_URL=$NEXT_PUBLIC_IZIPAY_SDK_URL

ARG NEXT_PUBLIC_PAYPAL_CLIENT_ID
ENV NEXT_PUBLIC_PAYPAL_CLIENT_ID=$NEXT_PUBLIC_PAYPAL_CLIENT_ID

# Generar el cliente de Prisma para producción
RUN pnpm run db:generate

# Compilar Next.js (esto generará .next/standalone si next.config.js está bien configurado)
RUN pnpm run build


# Fase 4: Producción (Runner ultra-ligero)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Definir puerto por defecto (Coolify lo usará)
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# URL interna para que los Server Components puedan hacer HTTP al propio servidor
ENV INTERNAL_API_URL="http://web:3000"

# Pasada como ARG en build o leída desde .env en runtime
ARG APP_URL
ENV APP_URL=$APP_URL

# su-exec: bajar de root a nextjs tras preparar el volumen de uploads
RUN apk add --no-cache su-exec

# Crear un usuario y grupo sin privilegios de root por seguridad
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# -- COPIAR EL STANDALONE DE NEXT.JS --
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# public DESPUÉS de standalone (evita que standalone pise la carpeta y los permisos)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Carpetas de upload (también se recrean/chown en entrypoint por si hay volumen montado)
RUN mkdir -p \
      /app/public/uploads/vouchers \
      /app/public/uploads/cursos \
      /app/public/uploads/firmas \
  && chown -R nextjs:nodejs /app/public/uploads

# Configurar permisos para la caché de pre-renderizado de Next.js
RUN mkdir -p .next && chown nextjs:nodejs .next

# -- COPIAR SHARP (pnpm: los .so de libvips están en .pnpm, no en symlinks) --
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.pnpm/sharp@0.34.5 ./node_modules/.pnpm/sharp@0.34.5
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.pnpm/@img+sharp-linuxmusl-x64@0.34.5 ./node_modules/.pnpm/@img+sharp-linuxmusl-x64@0.34.5

# Copiar la carpeta Prisma por si se necesitan ejecutar comandos como migraciones desde bash en el VPS
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Entrypoint: prepara volumen de uploads y ejecuta como nextjs
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

# Root solo para entrypoint (chown del volumen); luego su-exec a nextjs
USER root
ENTRYPOINT ["/app/docker-entrypoint.sh"]
