-- =============================================================================
-- migrate-v2.sql — Migración a esquema v2 (e-commerce completo)
-- =============================================================================
--
-- CUÁNDO USAR:
--   • Si ya tienes una DB con datos (producción o dev con datos guardados).
--   • Corre ANTES de reiniciar el backend con el nuevo código.
--
-- SI EMPIEZAS DESDE CERO:
--   • Borra el volumen de Postgres y levanta Docker → SQLAlchemy crea todo solo.
--   • docker compose down -v && docker compose up -d
--
-- CÓMO CORRER EN DOCKER:
--   docker compose exec db psql -U lookaly -d lookaly_db -f /docker-entrypoint-initdb.d/migrate-v2.sql
--
-- O desde el host con psql instalado:
--   psql postgresql://lookaly:lookalypass@localhost:5432/lookaly_db -f docker/migrate-v2.sql
--
-- Todas las operaciones son idempotentes (IF NOT EXISTS / IF EXISTS).
-- =============================================================================

\c lookaly_db

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ENUM TYPES nuevos
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE cartstatusenum AS ENUM ('open', 'closed', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE orderstatusenum AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABLA products — nuevas columnas
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS subcategory  VARCHAR(100),
    ADD COLUMN IF NOT EXISTS unit_price   NUMERIC(10, 2),
    ADD COLUMN IF NOT EXISTS stock        INTEGER       NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS sku          VARCHAR(100),
    ADD COLUMN IF NOT EXISTS weight_g     INTEGER,
    ADD COLUMN IF NOT EXISTS is_active    BOOLEAN       NOT NULL DEFAULT TRUE;

-- Ampliar columna image a 512 chars (era 512 ya, pero por si acaso)
ALTER TABLE products
    ALTER COLUMN image SET DEFAULT '';

-- Índice único en sku (solo si hay datos, aplica la unicidad desde aquí)
CREATE UNIQUE INDEX IF NOT EXISTS ix_products_sku
    ON products (sku)
    WHERE sku IS NOT NULL;

-- Índice en is_active para filtrar productos activos rápido
CREATE INDEX IF NOT EXISTS ix_products_is_active
    ON products (is_active);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TABLA prices — nueva columna updated_at + índice en site
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE prices
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS ix_prices_site
    ON prices (site);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. NUEVA TABLA product_images
--    N imágenes por producto, ordenadas por sort_order.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_images (
    id          VARCHAR(36)  PRIMARY KEY,
    product_id  VARCHAR(36)  NOT NULL,
    url         VARCHAR(512) NOT NULL,
    is_primary  BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order  INTEGER      NOT NULL DEFAULT 0,

    CONSTRAINT fk_product_images_product
        FOREIGN KEY (product_id)
        REFERENCES products (id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_product_images_product_id
    ON product_images (product_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. NUEVA TABLA carts
--    Un carrito por sesión de compra. El flujo actual (cart_items con user_id)
--    sigue funcionando; esta tabla se usará en el checkout (Fase 2).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS carts (
    id          VARCHAR(36)    PRIMARY KEY,
    user_id     VARCHAR(36)    NOT NULL,
    status      cartstatusenum NOT NULL DEFAULT 'open',
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at  TIMESTAMP,

    CONSTRAINT fk_carts_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_carts_user_id ON carts (user_id);
CREATE INDEX IF NOT EXISTS ix_carts_status  ON carts (status);


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. NUEVA TABLA orders
--    Cabecera del pedido. Snapshot del total al momento de cerrar el carrito.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
    id               VARCHAR(36)     PRIMARY KEY,
    user_id          VARCHAR(36),                  -- nullable: no borrar historial si se elimina usuario
    status           orderstatusenum NOT NULL DEFAULT 'pending',
    shipping_address TEXT,
    total            NUMERIC(10, 2)  NOT NULL DEFAULT 0.00,
    created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at          TIMESTAMP,
    updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS ix_orders_status  ON orders (status);


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. NUEVA TABLA order_items
--    Líneas de detalle con SNAPSHOT de precio al momento de compra.
--    unit_price y product_name/brand se copian al crear el pedido
--    para que el historial sea inmutable aunque el producto cambie.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS order_items (
    id            VARCHAR(36)    PRIMARY KEY,
    order_id      VARCHAR(36)    NOT NULL,
    product_id    VARCHAR(36),                 -- nullable: el producto puede eliminarse
    quantity      INTEGER        NOT NULL CHECK (quantity > 0),
    unit_price    NUMERIC(10, 2) NOT NULL,     -- snapshot del precio
    subtotal      NUMERIC(10, 2) NOT NULL,     -- quantity × unit_price
    product_name  VARCHAR(255),               -- snapshot del nombre
    product_brand VARCHAR(100),               -- snapshot de la marca

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders (id)
        ON DELETE CASCADE,

    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id)
        REFERENCES products (id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_order_items_order_id   ON order_items (order_id);
CREATE INDEX IF NOT EXISTS ix_order_items_product_id ON order_items (product_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. PERMISOS para usuario read-only (lookaly_ro)
-- ─────────────────────────────────────────────────────────────────────────────

GRANT SELECT ON product_images TO lookaly_ro;
GRANT SELECT ON carts           TO lookaly_ro;
GRANT SELECT ON orders          TO lookaly_ro;
GRANT SELECT ON order_items     TO lookaly_ro;


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Resumen de tablas del esquema v2
-- ─────────────────────────────────────────────────────────────────────────────
--
--   products        — catálogo (+unit_price, stock, sku, subcategory, weight_g, is_active)
--   product_images  — N fotos por producto [NUEVA]
--   prices          — comparador de precios por tienda (+updated_at)
--   users           — usuarios con OAuth y 2FA (sin cambios)
--   cart_items      — carrito actual basado en user_id (sin cambios)
--   carts           — sesiones de carrito para checkout [NUEVA]
--   orders          — cabecera de pedido [NUEVA]
--   order_items     — líneas de pedido con snapshots [NUEVA]
--
-- =============================================================================

COMMIT;

-- Verificación rápida (descomentar para confirmar):
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;
