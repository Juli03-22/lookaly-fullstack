"""
Sanitización de entradas — Lookaly Backend
==========================================
Elimina tags HTML/JavaScript de cualquier string antes de persistirlo
o procesarlo, previniendo ataques XSS y de inyección.

Uso:
    from app.core.sanitize import sanitize_str, sanitize_dict

    clean_name = sanitize_str(raw_name)
    clean_body = sanitize_dict(request_body)
"""
import re
from typing import Any

# Patrón que detecta tags HTML (<script>, <img onerror=...>, etc.)
_HTML_TAG_RE = re.compile(r"<[^>]+>", re.IGNORECASE)
# Patrón de javascript: inline en atributos
_JS_INLINE_RE = re.compile(r"javascript\s*:", re.IGNORECASE)
# Entidades HTML que podrían usarse para bypass
_HTML_ENTITY_RE = re.compile(r"&#?\w+;")


def sanitize_str(value: str) -> str:
    """
    Limpia un string de entrada:
    1. Elimina tags HTML/XML  (<script>, <b>, etc.)
    2. Elimina 'javascript:' en línea
    3. Elimina entidades HTML (&#60; &#x3C; &lt; etc.)
    4. Recorta espacios extremos
    """
    if not isinstance(value, str):
        return value
    value = _HTML_TAG_RE.sub("", value)
    value = _JS_INLINE_RE.sub("", value)
    value = _HTML_ENTITY_RE.sub("", value)
    return value.strip()


def sanitize_dict(data: dict[str, Any]) -> dict[str, Any]:
    """
    Recorre recursivamente un diccionario y sanitiza todos los strings.
    Útil para limpiar el body de un request antes de validación adicional.
    """
    result: dict[str, Any] = {}
    for key, val in data.items():
        if isinstance(val, str):
            result[key] = sanitize_str(val)
        elif isinstance(val, dict):
            result[key] = sanitize_dict(val)
        elif isinstance(val, list):
            result[key] = [
                sanitize_str(item) if isinstance(item, str)
                else sanitize_dict(item) if isinstance(item, dict)
                else item
                for item in val
            ]
        else:
            result[key] = val
    return result
