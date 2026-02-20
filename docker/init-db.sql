-- =============================================================================
-- init-db.sql — Script de inicialización de base de datos segura
-- Se ejecuta automáticamente al crear el contenedor de PostgreSQL.
-- =============================================================================
--
-- PRINCIPIO DE MÍNIMO PRIVILEGIO:
--   El usuario principal "lookaly" tiene permisos CRUD completos (INSERT,
--   UPDATE, DELETE) y es usado por la API REST.
--
--   El usuario de solo lectura "lookaly_ro" se usa para:
--     • Dashboards / reportes de BI
--     • Consultas de auditoría
--     • Cualquier proceso externo que no necesite escribir
--
-- Así, un compromiso del proceso de reportes no puede modificar ni borrar datos.
-- =============================================================================

-- 1. Usuario de solo lectura (read-only)
CREATE USER lookaly_ro WITH PASSWORD 'ro_pass_change_in_prod';

-- 2. Conectar a la base de datos de la app
\c lookaly_db

-- 3. Otorgar CONNECT y SELECT sobre todas las tablas presentes y futuras
GRANT CONNECT ON DATABASE lookaly_db TO lookaly_ro;
GRANT USAGE ON SCHEMA public TO lookaly_ro;

-- Para tablas ya existentes
GRANT SELECT ON ALL TABLES IN SCHEMA public TO lookaly_ro;

-- Para tablas que se creen en el futuro (migraciones)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO lookaly_ro;

-- 4. Explícitamente DENEGAR escritura al usuario de solo lectura
-- (redundante con los GRANTs anteriores pero declarativo para documentación)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM lookaly_ro;

-- =============================================================================
-- Resumen de usuarios de la base de datos:
--
--   lookaly      — App principal (API REST): SELECT, INSERT, UPDATE, DELETE
--   lookaly_ro   — Reportes /auditoría: solo SELECT
--
-- En producción: usar AWS Secrets Manager / Vault para rotar contraseñas.
-- =============================================================================
