import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, useInView } from 'motion/react';
import { Eye, EyeOff, ArrowRight, AlertCircle, Loader2, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ── Reglas de validación (idénticas a las del backend) ─────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Mínimo 8 chars, 1 mayúscula, 1 número, 1 especial
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,72}$/;
const NAME_REGEX = /^[\w\s'\-\u00C0-\u024F]{2,100}$/;

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  api?: string;  // error devuelto por el backend
}

function validate(mode: 'login' | 'register', name: string, email: string, password: string): FormErrors {
  const errors: FormErrors = {};

  // Nombre (solo en registro)
  if (mode === 'register') {
    if (!name.trim()) {
      errors.name = 'El nombre es obligatorio';
    } else if (name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (!NAME_REGEX.test(name.trim())) {
      errors.name = 'El nombre solo puede contener letras, espacios y guiones';
    }
  }

  // Email — tipo y formato
  if (!email.trim()) {
    errors.email = 'El correo es obligatorio';
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Ingresa un correo electrónico válido (ej. tu@email.com)';
  } else if (email.length > 254) {
    errors.email = 'El correo no puede superar 254 caracteres';
  }

  // Contraseña — longitud y complejidad
  if (!password) {
    errors.password = 'La contraseña es obligatoria';
  } else if (password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres';
  } else if (mode === 'register' && !PASSWORD_REGEX.test(password)) {
    errors.password = 'Debe incluir al menos 1 mayúscula, 1 número y 1 símbolo (!@#$...)';
  }

  return errors;
}

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ── Estado 2FA ───────────────────────────────────────────────
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [totpError, setTotpError] = useState('');
  const [isTotpLoading, setIsTotpLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setErrors(prev => ({ ...prev, api: 'No se pudo conectar con Google' }));
    }
  };

  const handleTotpSubmit = async () => {
    if (totpCode.length !== 6) { setTotpError('El código debe tener 6 dígitos'); return; }
    setIsTotpLoading(true);
    setTotpError('');
    try {
      await login(pendingEmail, pendingPassword, totpCode);
      navigate('/');
    } catch (err: unknown) {
      setTotpError(err instanceof Error ? err.message : 'Código incorrecto');
    } finally {
      setIsTotpLoading(false);
    }
  };

  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <div className="min-h-screen flex bg-[#FDF8F9]">

      {/* Left — Image panel */}
      <div className="hidden lg:block relative w-1/2 overflow-hidden">
        <img
          src="https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=1200"
          alt="Beauty"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D1B22]/80 via-[#7D3150]/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-16">
          <Link to="/">
            <img src="/lookaly_one_line.png" alt="Lookaly.mx" className="h-8 object-contain object-left mb-12 brightness-0 invert" />
          </Link>
          <blockquote className="text-white/90 text-2xl font-extralight leading-relaxed mb-6"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            "Belleza premium al precio más bajo, siempre."
          </blockquote>
          <p className="text-white/50 text-sm">Compara entre las mejores tiendas de México</p>
        </div>
      </div>

      {/* Right — Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div ref={ref} className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASE }}>

          {/* Mobile logo */}
          <Link to="/" className="lg:hidden block mb-10">
            <img src="/lookaly_one_line.png" alt="Lookaly.mx" className="h-7 object-contain object-left" />
          </Link>

          {/* Tab switcher */}
          <div className="flex mb-10 border-b border-[#E5B6C3]/30">
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`pb-4 mr-10 text-sm tracking-wider uppercase transition-all ${mode === m ? 'border-b-2 border-[#7D3150] text-[#7D3150] font-medium -mb-[1px]' : 'text-black/35 hover:text-black/60'}`}
                style={{ fontFamily: mode === m ? "'Cormorant Garamond', serif" : undefined, fontSize: mode === m ? '1rem' : undefined }}>
                {m === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          <h2 className="text-4xl sm:text-5xl font-extralight mb-2 leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            {mode === 'login' ? 'Bienvenida de vuelta' : 'Crea tu cuenta'}
          </h2>
          <p className="text-black/45 text-sm mb-10">
            {mode === 'login' ? 'Accede a tus favoritos y tu historial de compras.' : 'Únete y empieza a ahorrar en tus productos favoritos.'}
          </p>

          <form className="space-y-5" onSubmit={async e => {
              e.preventDefault();
              setSubmitted(true);
              const errs = validate(mode, name, email, password);
              setErrors(errs);
              if (Object.keys(errs).length > 0) return;

              setIsLoading(true);
              try {
                if (mode === 'login') {
                  await login(email, password);
                } else {
                  await register(name, email, password);
                }
                navigate('/');
              } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Error inesperado';
                if (message === '2fa_required') {
                  setPendingEmail(email);
                  setPendingPassword(password);
                  setShow2FAModal(true);
                } else {
                  setErrors(prev => ({ ...prev, api: message }));
                }
              } finally {
                setIsLoading(false);
              }
            }}>

            {/* ── Error de API ── */}
            {errors.api && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{errors.api}</p>
              </div>
            )}

            {/* ── Nombre (solo registro) ── */}
            {mode === 'register' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35 }}>
                <label className="block text-xs uppercase tracking-widest text-black/45 mb-2">Nombre completo</label>
                <input
                  type="text" value={name}
                  onChange={e => { setName(e.target.value); if (submitted) setErrors(v => ({ ...v, name: undefined })); }}
                  placeholder="María García" maxLength={100}
                  className={`w-full px-5 py-4 border rounded-xl bg-white/70 focus:outline-none text-sm placeholder:text-black/30 transition-colors ${
                    errors.name ? 'border-red-400 focus:border-red-500' : 'border-[#E5B6C3]/40 focus:border-[#7D3150]/50'
                  }`} />
                {errors.name && (
                  <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errors.name}
                  </p>
                )}
              </motion.div>
            )}

            {/* ── Email ── tipo="email" + validación JS + mensaje ── */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-black/45 mb-2">Correo electrónico</label>
              <input
                type="email" value={email} autoComplete="email" maxLength={254}
                onChange={e => { setEmail(e.target.value); if (submitted) setErrors(v => ({ ...v, email: undefined })); }}
                placeholder="tu@email.com"
                className={`w-full px-5 py-4 border rounded-xl bg-white/70 focus:outline-none text-sm placeholder:text-black/30 transition-colors ${
                  errors.email ? 'border-red-400 focus:border-red-500' : 'border-[#E5B6C3]/40 focus:border-[#7D3150]/50'
                }`} />
              {errors.email && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errors.email}
                </p>
              )}
            </div>

            {/* ── Contraseña ── min 8 chars, complejidad en registro ── */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-black/45 mb-2">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={8} maxLength={72}
                  onChange={e => { setPassword(e.target.value); if (submitted) setErrors(v => ({ ...v, password: undefined })); }}
                  placeholder="••••••••"
                  className={`w-full px-5 py-4 border rounded-xl bg-white/70 focus:outline-none text-sm placeholder:text-black/30 transition-colors pr-12 ${
                    errors.password ? 'border-red-400 focus:border-red-500' : 'border-[#E5B6C3]/40 focus:border-[#7D3150]/50'
                  }`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-black/35 hover:text-black/60 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errors.password}
                </p>
              )}
              {mode === 'register' && !errors.password && (
                <p className="mt-1.5 text-xs text-black/35">Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 símbolo</p>
              )}
            </div>

            {mode === 'login' && (
              <div className="text-right">
                <a href="#" className="text-xs text-[#7D3150] hover:underline">¿Olvidaste tu contraseña?</a>
              </div>
            )}

            <motion.button type="submit" disabled={isLoading} whileHover={{ scale: isLoading ? 1 : 1.02 }} whileTap={{ scale: isLoading ? 1 : 0.97 }}
              className="w-full py-4 bg-[#7D3150] text-white rounded-xl text-sm font-medium tracking-wide hover:bg-[#6a2943] transition-colors flex items-center justify-center gap-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {isLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>{mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}<ArrowRight className="w-4 h-4" /></>}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-[#E5B6C3]/30" />
            <span className="text-xs text-black/30 uppercase tracking-widest">o continúa con</span>
            <div className="flex-1 h-px bg-[#E5B6C3]/30" />
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-4">
            <motion.button key="Google" onClick={handleGoogleLogin} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="py-3.5 border border-[#E5B6C3]/40 rounded-xl text-sm text-black/60 hover:border-[#E5B6C3]/70 hover:bg-white/60 transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </motion.button>
            <motion.button key="Facebook" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="py-3.5 border border-[#E5B6C3]/40 rounded-xl text-sm text-black/60 hover:border-[#E5B6C3]/70 hover:bg-white/60 transition-colors">
              Facebook
            </motion.button>
          </div>

          {/* ── Modal 2FA ── */}
          {show2FAModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center"
                style={{ fontFamily: "'Lexend Zetta', sans-serif" }}
              >
                <div className="w-14 h-14 rounded-full bg-[#7D3150]/10 flex items-center justify-center mx-auto mb-5">
                  <Smartphone className="w-7 h-7 text-[#7D3150]" />
                </div>
                <h2 className="text-lg font-semibold text-[#2D1B22] mb-1">Verificación en dos pasos</h2>
                <p className="text-xs text-black/40 mb-6 tracking-wide">Ingresa el código de 6 dígitos de tu app autenticadora</p>
                <input
                  type="text" inputMode="numeric" maxLength={6} value={totpCode}
                  onChange={e => { setTotpCode(e.target.value.replace(/\D/g, '')); setTotpError(''); }}
                  placeholder="000000"
                  className="w-full text-center text-2xl tracking-[0.5em] px-4 py-4 border border-[#E5B6C3]/50 rounded-xl focus:outline-none focus:border-[#7D3150]/50 bg-[#FDF8F9] mb-3"
                  autoFocus
                />
                {totpError && (
                  <p className="text-xs text-red-500 mb-3 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />{totpError}
                  </p>
                )}
                <button
                  onClick={handleTotpSubmit} disabled={isTotpLoading || totpCode.length < 6}
                  className="w-full py-3.5 bg-[#7D3150] text-white rounded-xl text-sm font-medium tracking-wide hover:bg-[#6a2943] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
                >
                  {isTotpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verificar'}
                </button>
                <button
                  onClick={() => { setShow2FAModal(false); setTotpCode(''); setTotpError(''); }}
                  className="text-xs text-black/35 hover:text-black/60 transition-colors"
                >Cancelar</button>
              </motion.div>
            </div>
          )}

          <p className="text-center text-xs text-black/35 mt-8">
            Al continuar aceptas nuestros{' '}
            <a href="#" className="text-[#7D3150] hover:underline">Términos</a> y{' '}
            <a href="#" className="text-[#7D3150] hover:underline">Privacidad</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
