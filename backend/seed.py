"""
Seed script — solo crea/resetea las cuentas de usuario del equipo Lookaly.
Los productos se agregan manualmente desde el panel de administración.

Credenciales:
  admin@lookaly.com         Admin123!      Super Admin (único con acceso total)
  gestor@lookaly.com        Gestor123!     Gestor de inventario
  it@lookaly.com            Itstaff1!      IT / Seguridad
  analista@lookaly.com      Analista1!     Analista
  vendedor@lookaly.com      Vendedor1!     Vendedor
  admin2@lookaly.com        Admin456!      Administrativo
  usuario@lookaly.com       Usuario1!      Usuario normal
"""
import asyncio
from app.database import AsyncSessionLocal, engine, Base
from app.core.security import hash_password


async def seed():
    from sqlalchemy import text, select
    from datetime import datetime
    from app.models.user import User

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Si ya existe el admin, no hacer nada (seed idempotente)
        result = await session.execute(text("SELECT 1 FROM users WHERE email='admin@lookaly.com' LIMIT 1"))
        if result.scalar():
            print("ℹ️  Seed omitido — la BD ya tiene datos (admin@lookaly.com existe).")
            return

        # Limpiar solo datos de usuarios y carritos (los productos se gestionan manualmente)
        for table in ("order_items", "orders", "cart_items", "users"):
            try:
                await session.execute(text(f"DELETE FROM {table}"))
            except Exception:
                pass
        await session.commit()

        # ── Usuarios del equipo ────────────────────────────────────────────────
        # IMPORTANTE: solo admin@lookaly.com tiene is_admin=True (Super Admin).
        # El resto son staff con rol específico e is_admin=False.
        # Solo el Super Admin puede modificar roles desde el panel.
        now = datetime.utcnow()
        _staff = [
            dict(email="admin@lookaly.com",    name="Admin Lookaly",        password="Admin123!",  is_admin=True,  role=None),
            dict(email="gestor@lookaly.com",    name="Gestor Inventario",    password="Gestor123!", is_admin=False, role="gestor_inventario"),
            dict(email="it@lookaly.com",        name="IT Seguridad",         password="Itstaff1!",  is_admin=False, role="it"),
            dict(email="analista@lookaly.com",  name="Analista Datos",       password="Analista1!", is_admin=False, role="analista"),
            dict(email="vendedor@lookaly.com",  name="Vendedor Plus",        password="Vendedor1!", is_admin=False, role="vendedor"),
            dict(email="admin2@lookaly.com",    name="Administrativo Staff", password="Admin456!",  is_admin=False, role="administrativo"),
            dict(email="usuario@lookaly.com",   name="Usuario Prueba",       password="Usuario1!",  is_admin=False, role=None),
        ]
        for s in _staff:
            session.add(User(
                email=s["email"],
                name=s["name"],
                hashed_password=hash_password(s["password"]),
                is_active=True,
                is_admin=s["is_admin"],
                role=s["role"],
                password_changed_at=now,
            ))

        await session.commit()

        print("\n✅ Seed completado — solo usuarios (sin productos):")
        print("\n👤 Credenciales:")
        print("   admin@lookaly.com       Admin123!   → Super Admin (único admin total)")
        print("   gestor@lookaly.com      Gestor123!  → Gestor inventario (productos + marcas)")
        print("   it@lookaly.com          Itstaff1!   → IT / Seguridad (tab seguridad)")
        print("   analista@lookaly.com    Analista1!  → Analista (tab resumen)")
        print("   vendedor@lookaly.com    Vendedor1!  → Vendedor (tab ventas)")
        print("   admin2@lookaly.com      Admin456!   → Administrativo (tab usuarios, solo lectura)")
        print("   usuario@lookaly.com     Usuario1!   → Usuario normal (tienda)")
        print("\n💡 Los productos se agregan manualmente desde el panel de admin.")


if __name__ == "__main__":
    asyncio.run(seed())
