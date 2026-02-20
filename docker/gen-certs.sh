#!/usr/bin/env bash
# =============================================================================
# gen-certs.sh — Genera certificado TLS autofirmado para desarrollo
#
# 4.1 – Certificados TLS válidos
# ────────────────────────────────
# En DESARROLLO: certificado autofirmado (self-signed) con OpenSSL.
# En PRODUCCIÓN: reemplazar por certificados de Let's Encrypt:
#   certbot certonly --standalone -d yourdomain.com
#   y apuntar nginx.conf a /etc/letsencrypt/live/yourdomain.com/
#
# Uso:
#   bash docker/gen-certs.sh
# =============================================================================
set -euo pipefail

CERTS_DIR="$(dirname "$0")/certs"
mkdir -p "$CERTS_DIR"

echo "[*] Generando certificado TLS autofirmado para desarrollo..."

openssl req -x509 -nodes \
  -newkey rsa:2048 \
  -keyout "$CERTS_DIR/server.key" \
  -out    "$CERTS_DIR/server.crt" \
  -days   365 \
  -subj   "/C=MX/ST=CDMX/L=CDMX/O=Lookaly Dev/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

chmod 600 "$CERTS_DIR/server.key"
chmod 644 "$CERTS_DIR/server.crt"

echo "[✓] Certificados generados en $CERTS_DIR/"
echo "    server.crt  (certificado público)"
echo "    server.key  (clave privada — no commitear)"
echo ""
echo "    Para confiar en él localmente:"
echo "    macOS:  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain $CERTS_DIR/server.crt"
echo "    Linux:  sudo cp $CERTS_DIR/server.crt /usr/local/share/ca-certificates/ && sudo update-ca-certificates"
echo "    Chrome: Configuración > Privacidad > Gestionar certificados > Importar"
