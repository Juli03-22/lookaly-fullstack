# Fotos de productos

Coloca aquí las fotos de tus productos.

**Formato recomendado:**
- Tipo: `.jpg`, `.jpeg`, `.webp`, `.png`
- Tamaño: 600×600 px (cuadradas)
- Peso máximo: 500 KB por imagen

**Nombre de archivo:** usa guiones, sin espacios ni caracteres especiales.  
Ejemplo: `charlotte-tilbury-flawless-filter.jpg`

**En `catalog/products.csv`** usa:
```
products/charlotte-tilbury-flawless-filter.jpg
```

El backend lo sirve automáticamente en:
```
GET /static/images/products/charlotte-tilbury-flawless-filter.jpg
```
