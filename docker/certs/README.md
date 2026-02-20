# Este directorio contiene los certificados TLS para desarrollo.
# Los archivos .crt y .key están excluidos en .gitignore (nunca se commitean).
#
# Para generar los certificados de desarrollo:
#   bash docker/gen-certs.sh
#
# Para producción: usar Let's Encrypt (certbot) y apuntar nginx.conf a
#   /etc/letsencrypt/live/yourdomain.com/fullchain.pem
#   /etc/letsencrypt/live/yourdomain.com/privkey.pem
