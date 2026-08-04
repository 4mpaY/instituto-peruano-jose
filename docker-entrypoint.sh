#!/bin/sh
set -e

# Asegura carpetas de uploads (volumen persistente en Coolify/compose).
# Debe ejecutarse como root para poder chown el volumen montado desde el host.
UPLOADS_ROOT="/app/public/uploads"

mkdir -p \
  "$UPLOADS_ROOT/vouchers" \
  "$UPLOADS_ROOT/cursos" \
  "$UPLOADS_ROOT/firmas"

chown -R nextjs:nodejs "$UPLOADS_ROOT" 2>/dev/null || true
chmod -R u+rwX,g+rwX "$UPLOADS_ROOT" 2>/dev/null || true

echo "[entrypoint] uploads listos en $UPLOADS_ROOT"

exec su-exec nextjs:nodejs node server.js
