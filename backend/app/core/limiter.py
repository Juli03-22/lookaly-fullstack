"""
Rate limiter centralizado — evita importaciones circulares.
Importar desde aquí tanto en main.py como en los routers.

4.2 – Rate limiting por IP (slowapi sobre limits)
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Identifica al cliente por IP real.
# En producción con múltiples workers: pasar storage_uri=Redis para estado compartido.
limiter = Limiter(key_func=get_remote_address)
