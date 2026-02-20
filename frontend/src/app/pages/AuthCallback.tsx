/**
 * AuthCallback — captura el token JWT que Google OAuth devuelve en la URL
 * El backend redirige a: /auth-callback?token=ACCESS_JWT
 * Esta página lo guarda en sessionStorage y redirige al home.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) { navigate('/login'); return; }

    // Guardar token y obtener perfil del usuario
    (async () => {
      try {
        const meRes = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meRes.ok) throw new Error('Token inválido');
        const me = await meRes.json();

        // Guardar en sessionStorage (igual que login normal)
        sessionStorage.setItem('lookaly_token', token);
        sessionStorage.setItem('lookaly_user', JSON.stringify({
          id:           String(me.id),
          name:         me.name,
          email:        me.email,
          is_admin:     me.is_admin ?? false,
          totp_enabled: me.totp_enabled ?? false,
        }));

        // Recargar la app para que AuthProvider lea sessionStorage
        window.location.replace('/');
      } catch {
        navigate('/login');
      }
    })();
  }, [navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF8F9]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7D3150] mx-auto mb-4" />
        <p className="text-sm text-black/40 tracking-widest uppercase"
          style={{ fontFamily: "'Lexend Zetta', sans-serif" }}>
          Iniciando sesión con Google...
        </p>
      </div>
    </div>
  );
}
