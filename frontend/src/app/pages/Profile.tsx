import { useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, useInView } from 'motion/react';
import { LogOut, Mail, Shield, ShoppingBag, Smartphone, QrCode, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth, avatarColor, avatarInitial } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function Profile() {
  const { user, token, logout, refreshUser } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  // \u2500\u2500 Estado 2FA \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n  const [twoFAStep, setTwoFAStep] = useState<'idle' | 'scanning' | 'disabling'>('idle');\n  const [qrCode, setQrCode] = useState('');\n  const [secret, setSecret] = useState('');\n  const [totpInput, setTotpInput] = useState('');\n  const [twoFALoading, setTwoFALoading] = useState(false);\n  const [twoFAMsg, setTwoFAMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Si no hay usuario (no debería pasar con rutas protegidas) redirigir
  if (!user) {
    navigate('/login');
    return null;
  }

  const color = avatarColor(user.name);
  const initial = avatarInitial(user.name);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };\n
  const setup2FA = async () => {
    setTwoFALoading(true); setTwoFAMsg(null);
    try {
      const res = await fetch('/api/auth/2fa/setup', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setQrCode(data.qr_code); setSecret(data.secret); setTwoFAStep('scanning');
    } catch { setTwoFAMsg({ type: 'err', text: 'Error al generar el QR' }); }
    finally { setTwoFALoading(false); }
  };

  const confirm2FA = async () => {
    if (totpInput.length !== 6) { setTwoFAMsg({ type: 'err', text: 'El código debe tener 6 dígitos' }); return; }
    setTwoFALoading(true); setTwoFAMsg(null);
    try {
      const res = await fetch('/api/auth/2fa/confirm', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ code: totpInput }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail); }
      setTwoFAMsg({ type: 'ok', text: '2FA activado correctamente ✓' }); setTwoFAStep('idle'); setTotpInput(''); await refreshUser();
    } catch (e: unknown) { setTwoFAMsg({ type: 'err', text: e instanceof Error ? e.message : 'Código incorrecto' }); }
    finally { setTwoFALoading(false); }
  };

  const disable2FA = async () => {
    if (totpInput.length !== 6) { setTwoFAMsg({ type: 'err', text: 'El código debe tener 6 dígitos' }); return; }
    setTwoFALoading(true); setTwoFAMsg(null);
    try {
      const res = await fetch('/api/auth/2fa/disable', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ code: totpInput }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail); }
      setTwoFAMsg({ type: 'ok', text: '2FA desactivado' }); setTwoFAStep('idle'); setTotpInput(''); await refreshUser();
    } catch (e: unknown) { setTwoFAMsg({ type: 'err', text: e instanceof Error ? e.message : 'Código incorrecto' }); }
    finally { setTwoFALoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FDF8F9] pt-28 pb-16 px-4">
      <motion.div
        ref={ref}
        className="max-w-lg mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: EASE }}
      >
        {/* ── Avatar grande ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center mb-10">
          <motion.div
            className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg mb-5"
            style={{ backgroundColor: color }}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          >
            <span className="text-white text-4xl font-light select-none"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {initial}
            </span>
          </motion.div>

          <h1 className="text-3xl sm:text-4xl font-extralight text-[#2D1B22] tracking-wide"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {user.name}
          </h1>
          {user.is_admin && (
            <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-[#7D3150] bg-[#7D3150]/10 rounded-full px-3 py-1">
              <Shield className="w-3 h-3" /> Administrador
            </span>
          )}
        </div>

        {/* ── Tarjeta de datos ──────────────────────────────────────── */}
        <div className="bg-white/70 backdrop-blur-sm border border-[#E5B6C3]/30 rounded-2xl overflow-hidden mb-4">
          <div className="px-6 py-4 border-b border-[#E5B6C3]/20 flex items-center gap-3">
            <Mail className="w-4 h-4 text-[#7D3150]/60" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-black/35 mb-0.5"
                style={{ fontFamily: "'Lexend Zetta', sans-serif" }}>
                Correo electrónico
              </p>
              <p className="text-sm text-black/70">{user.email}</p>
            </div>
          </div>

          <div className="px-6 py-4 flex items-center gap-3">
            <ShoppingBag className="w-4 h-4 text-[#7D3150]/60" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-black/35 mb-0.5"
                style={{ fontFamily: "'Lexend Zetta', sans-serif" }}>
                Carrito actual
              </p>
              <p className="text-sm text-black/70">
                {count === 0 ? 'Sin productos' : `${count} producto${count !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </div>

        {/* ── Sección 2FA ───────────────────────────────────────────── */}
        <div className="bg-white/70 backdrop-blur-sm border border-[#E5B6C3]/30 rounded-2xl overflow-hidden mb-4">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-[#7D3150]/60" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-black/35 mb-0.5"
                  style={{ fontFamily: "'Lexend Zetta', sans-serif" }}>
                  Verificación en dos pasos (2FA)
                </p>
                <p className="text-sm text-black/70">{user.totp_enabled ? 'Activo' : 'Inactivo'}</p>
              </div>
            </div>
            {user.totp_enabled ? (
              <button onClick={() => { setTwoFAStep('disabling'); setTwoFAMsg(null); setTotpInput(''); }}
                className="text-[11px] tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors px-3 py-1.5 rounded-full hover:bg-red-50">
                Desactivar
              </button>
            ) : (
              <button onClick={setup2FA} disabled={twoFALoading}
                className="text-[11px] tracking-widest uppercase text-[#7D3150] hover:text-[#5c2238] transition-colors px-3 py-1.5 rounded-full hover:bg-[#7D3150]/5 disabled:opacity-50 flex items-center gap-1">
                {twoFALoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <QrCode className="w-3 h-3" />}
                Activar
              </button>
            )}
          </div>

          {twoFAStep === 'scanning' && (
            <div className="border-t border-[#E5B6C3]/20 px-6 py-5 flex flex-col items-center gap-4">
              <p className="text-xs text-black/50 text-center">Escanea con <strong>Google Authenticator</strong> o <strong>Authy</strong></p>
              {qrCode && <img src={qrCode} alt="QR 2FA" className="w-44 h-44 rounded-xl border border-[#E5B6C3]/30" />}
              <p className="text-[10px] text-black/35 tracking-widest font-mono bg-[#FDF8F9] px-3 py-2 rounded-lg break-all text-center">Clave manual: {secret}</p>
              <input type="text" inputMode="numeric" maxLength={6} value={totpInput}
                onChange={e => { setTotpInput(e.target.value.replace(/\D/g, '')); setTwoFAMsg(null); }}
                placeholder="Código de 6 dígitos" autoFocus
                className="w-full text-center text-xl tracking-[0.4em] px-4 py-3 border border-[#E5B6C3]/50 rounded-xl focus:outline-none focus:border-[#7D3150]/50 bg-white" />
              <button onClick={confirm2FA} disabled={twoFALoading || totpInput.length < 6}
                className="w-full py-3 bg-[#7D3150] text-white rounded-xl text-xs tracking-widest uppercase hover:bg-[#6a2943] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {twoFALoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar y activar'}
              </button>
              <button onClick={() => { setTwoFAStep('idle'); setTotpInput(''); setTwoFAMsg(null); }}
                className="text-xs text-black/35 hover:text-black/60 transition-colors">Cancelar</button>
            </div>
          )}

          {twoFAStep === 'disabling' && (
            <div className="border-t border-[#E5B6C3]/20 px-6 py-5 flex flex-col items-center gap-4">
              <p className="text-xs text-black/50 text-center">Ingresa tu código actual para desactivar 2FA</p>
              <input type="text" inputMode="numeric" maxLength={6} value={totpInput}
                onChange={e => { setTotpInput(e.target.value.replace(/\D/g, '')); setTwoFAMsg(null); }}
                placeholder="000000" autoFocus
                className="w-full text-center text-xl tracking-[0.4em] px-4 py-3 border border-red-200 rounded-xl focus:outline-none focus:border-red-400 bg-white" />
              <button onClick={disable2FA} disabled={twoFALoading || totpInput.length < 6}
                className="w-full py-3 bg-red-500 text-white rounded-xl text-xs tracking-widest uppercase hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {twoFALoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Desactivar 2FA'}
              </button>
              <button onClick={() => { setTwoFAStep('idle'); setTotpInput(''); setTwoFAMsg(null); }}
                className="text-xs text-black/35 hover:text-black/60 transition-colors">Cancelar</button>
            </div>
          )}

          {twoFAMsg && (
            <div className={`mx-6 mb-4 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs ${twoFAMsg.type === 'ok' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
              {twoFAMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              {twoFAMsg.text}
            </div>
          )}
        </div>

        {/* ── Botón cerrar sesión ───────────────────────────────────── */}
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 border border-[#E5B6C3]/50 rounded-2xl text-sm text-black/50 hover:text-[#7D3150] hover:border-[#7D3150]/40 transition-colors flex items-center justify-center gap-2 bg-white/40"
          style={{ fontFamily: "'Lexend Zetta', sans-serif" }}
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[11px] tracking-[0.18em] uppercase">Cerrar sesión</span>
        </motion.button>
      </motion.div>
    </div>
  );
}
