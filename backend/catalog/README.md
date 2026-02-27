# 📋 Catálogo de Productos — Lookaly

> Aquí defines **todos los productos** que aparecen en el sitio.  
> No toques código Python — solo edita los CSV y ejecuta el seed.

---

## Archivos

| Archivo | Qué contiene |
|---|---|
| `products.csv` | Productos: nombre, marca, categoría, descripción, foto, rating |
| `prices.csv` | Precios por tienda para cada producto |
| `../static/images/products/` | Fotos locales de productos |

---

## Flujo para agregar productos reales

### 1. Elige las fotos

Tienes dos opciones para el campo `image` en `products.csv`:

**Opción A — URL externa** (rápido, sin subir archivos)
```
https://example.com/foto-del-producto.jpg
```

**Opción B — Foto local** (recomendado para producción)
1. Coloca la foto en `backend/static/images/products/`  
   Ejemplo: `backend/static/images/products/charlotte-tilbury-flawless.jpg`
2. En el CSV escribe solo el nombre del archivo:  
   `products/charlotte-tilbury-flawless.jpg`
3. El sistema la sirve automáticamente como `/static/images/products/charlotte-tilbury-flawless.jpg`

**Formatos aceptados:** `.jpg`, `.jpeg`, `.png`, `.webp`  
**Tamaño recomendado:** 600×600 px, máximo 500 KB por imagen.

---

### 2. Edita `products.csv`

Abre con Excel, Google Sheets o cualquier editor de texto:

```
id,name,brand,category,description,image,rating,reviews
m01,Flawless Filter,Charlotte Tilbury,maquillaje,Descripción del producto...,products/foto.jpg,4.8,3241
```

**Reglas importantes:**
- `id` debe ser único y sin espacios (ej: `m01`, `p01`, `c01`, `nuevo01`)
- `category` debe ser exactamente: `maquillaje`, `piel` o `cuerpo`
- `rating` con punto decimal (no coma): `4.8` ✅  `4,8` ❌
- Si la descripción tiene comas, enciérrala en comillas dobles:  
  `"Crema con aceite de coco, karité y vitamina E"`
- Las líneas que empiezan con `#` son comentarios y se ignoran

---

### 3. Edita `prices.csv`

Agrega una fila por cada tienda donde se vende el producto:

```
product_id,store,price_mxn,shipping_mxn
m01,Amazon MX,1360,0
m01,Sephora MX,1300,0
m01,Lookaly.mx,1190,0
```

- El `product_id` debe coincidir con el `id` en `products.csv`
- `shipping_mxn` = `0` si el envío es gratis

---

### 4. Carga el catálogo en la base de datos

```bash
# Dentro del contenedor backend:
docker compose exec backend python seed.py

# O si corres localmente:
cd backend
python seed.py
```

⚠️ El seed **borra y recarga** todos los productos. Es seguro correrlo cuantas veces quieras.  
El usuario admin (`admin@lookaly.com`) no se borra.

---

## Convención de IDs

| Prefijo | Categoría |
|---|---|
| `m01`, `m02`... | maquillaje |
| `p01`, `p02`... | piel |
| `c01`, `c02`... | cuerpo |

Puedes usar cualquier ID siempre que sea único. El sistema usa `String(36)` en PostgreSQL —
puede ser un código corto como `m01` o un UUID completo.

---

## Tiendas predefinidas

Puedes usar cualquier nombre de tienda, pero estas son las más comunes en el sitio:

- `Amazon MX`
- `Sephora MX`  
- `Walmart`
- `Lookaly.mx`
- `Liverpool`
- `El Palacio de Hierro`

---

## Estructura de la base de datos

```
products (PK: id String)
├── id          VARCHAR(36) PRIMARY KEY
├── name        VARCHAR(255)
├── brand       VARCHAR(100)
├── category    ENUM(maquillaje, piel, cuerpo)
├── description TEXT
├── image       VARCHAR(512)   ← URL o ruta local
├── rating      FLOAT
├── reviews     INTEGER
├── created_at  TIMESTAMP
└── updated_at  TIMESTAMP

prices (FK → products.id)
├── id           UUID PRIMARY KEY (auto)
├── product_id   VARCHAR(36) FK → products.id
├── site         VARCHAR(100)
├── price        NUMERIC
├── currency     VARCHAR(10)
├── availability ENUM
├── url          VARCHAR(512)
└── shipping     NUMERIC
```
