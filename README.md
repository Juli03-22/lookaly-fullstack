# Lookaly  Monorepo

Compara precios de maquillaje premium entre las mejores tiendas de Mexico.

```
lookaly_docker/
 frontend/          # Vite + React + TypeScript + Tailwind + motion/react
 backend/           # FastAPI + PostgreSQL + SQLAlchemy (async)
 docker-compose.yml # Orquestacion completa
 .env.example       # Variables de entorno de ejemplo
```

## Levantar todo con Docker

```bash
# 1. Copiar variables de entorno
cp .env.example .env

# 2. Construir y levantar
docker compose up --build

# Frontend  -- http://localhost:5173
# Backend   -- http://localhost:8000
# API Docs  -- http://localhost:8000/docs
# Postgres  -- localhost:5432
```

## Desarrollo local (sin Docker)

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Stack

| Capa | Tecnologia |
|------|------------|
| Frontend | Vite, React 19, TypeScript, Tailwind v4, motion/react |
| Backend | FastAPI, SQLAlchemy 2 (async), Pydantic v2 |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Database | PostgreSQL 16 |
| DevOps | Docker, Docker Compose |

## API Endpoints

```
GET    /api/products              Listar (paginado, filtros, sort)
GET    /api/products/:id          Detalle con precios
POST   /api/products              Crear (admin)
PATCH  /api/products/:id          Actualizar (admin)
DELETE /api/products/:id          Eliminar (admin)

GET    /api/prices/product/:id    Precios de un producto
POST   /api/prices                Crear precio (admin)
PATCH  /api/prices/:id            Actualizar precio (admin)

POST   /api/auth/register         Registro
POST   /api/auth/login            Login -> JWT
GET    /api/auth/me               Perfil actual

GET    /api/cart                  Ver carrito (auth)
POST   /api/cart/items            Agregar al carrito
PATCH  /api/cart/items/:id        Actualizar cantidad
DELETE /api/cart/items/:id        Eliminar item
DELETE /api/cart                  Vaciar carrito

GET    /api/users                 Listar usuarios (admin)
GET    /api/users/me              Mi perfil
PATCH  /api/users/me              Editar mi perfil
```
