import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CreditCard, Lock, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';

// ── Reglas de validación (primera capa — backend también valida) ──────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^\+?[\d\s\-()]{8,15}$/;
const ZIP_REGEX   = /^\d{4,6}$/;
// Tarjeta: 13-19 dígitos (con o sin espacios)
const CARD_REGEX  = /^[\d\s]{13,19}$/;
// Expiración: MM/AA
const EXPIRY_REGEX = /^(0[1-9]|1[0-2])\/\d{2}$/;
const CVV_REGEX   = /^\d{3,4}$/;

type Step = 'info' | 'payment' | 'success';
type Errors = Record<string, string | undefined>;

function validateInfo(f: typeof EMPTY): Errors {
  const e: Errors = {};
  if (!EMAIL_REGEX.test(f.email.trim()))  e.email     = 'Ingresa un correo válido (ej. tu@email.com)';
  if (f.firstName.trim().length < 2)      e.firstName = 'El nombre debe tener al menos 2 caracteres';
  if (f.lastName.trim().length < 2)       e.lastName  = 'El apellido debe tener al menos 2 caracteres';
  if (f.address.trim().length < 5)        e.address   = 'Ingresa una dirección válida';
  if (f.city.trim().length < 2)           e.city      = 'Ingresa tu ciudad';
  if (f.state.trim().length < 2)          e.state     = 'Ingresa tu estado';
  if (!ZIP_REGEX.test(f.zipCode.trim()))  e.zipCode   = 'Código postal inválido (4-6 dígitos)';
  if (!PHONE_REGEX.test(f.phone.trim()))  e.phone     = 'Teléfono inválido (ej. 55 1234 5678)';
  return e;
}

function validatePayment(f: typeof EMPTY): Errors {
  const e: Errors = {};
  if (!CARD_REGEX.test(f.cardNumber))     e.cardNumber  = 'Número de tarjeta inválido (13-19 dígitos)';
  if (f.cardName.trim().length < 3)       e.cardName    = 'Ingresa el nombre tal como aparece en la tarjeta';
  if (!EXPIRY_REGEX.test(f.expiryDate))   e.expiryDate  = 'Formato inválido — usa MM/AA (ej. 08/27)';
  if (!CVV_REGEX.test(f.cvv))             e.cvv         = 'CVV inválido (3 o 4 dígitos)';
  return e;
}

const EMPTY = {
  email: '', firstName: '', lastName: '',
  address: '', city: '', state: '', zipCode: '', phone: '',
  // NOTA DE SEGURIDAD: los campos de tarjeta se tokenizan con Stripe.js
  // y NUNCA se envían a nuestros servidores. Solo el token llega al backend.
  cardNumber: '', cardName: '', expiryDate: '', cvv: '',
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{msg}
    </p>
  );
}

function inputClass(hasError: boolean) {
  return `w-full px-4 py-4 border bg-white focus:outline-none font-light transition-colors ${
    hasError ? 'border-red-400 focus:border-red-500' : 'border-black/10 focus:border-black'
  }`;
}

export default function Checkout() {
  const navigate  = useNavigate();
  const [step, setStep] = useState<Step>('info');
  const [formData, setFormData] = useState(EMPTY);
  const [errors, setErrors] = useState<Errors>({});

  const set = (field: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'info') {
      const errs = validateInfo(formData);
      setErrors(errs);
      if (!Object.keys(errs).length) setStep('payment');
    } else if (step === 'payment') {
      const errs = validatePayment(formData);
      setErrors(errs);
      if (!Object.keys(errs).length) {
        // En producción: tokenizar con Stripe.js aquí — el número de tarjeta
        // NUNCA viaja en texto plano a nuestros servidores.
        setStep('success');
        setTimeout(() => navigate('/products'), 3000);
      }
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 border border-black/10 flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-4xl sm:text-5xl mb-6 font-extralight">Compra Exitosa</h2>
          <p className="text-lg text-black/60 mb-6 font-light">
            Gracias por tu compra. Recibirás un correo de confirmación en breve.
          </p>
          <p className="text-sm text-black/40 font-light">
            Redirigiendo...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl sm:text-6xl md:text-7xl mb-16 font-extralight tracking-tight">
          Checkout
        </h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-6 mb-16">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 border flex items-center justify-center font-light ${
              step === 'info' ? 'border-black bg-black text-white' : 'border-black/20 text-black/40'
            }`}>
              1
            </div>
            <span className={`text-sm font-light tracking-wide ${
              step === 'info' ? '' : 'text-black/40'
            }`}>
              Información
            </span>
          </div>
          <div className="w-20 h-px bg-black/10" />
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 border flex items-center justify-center font-light ${
              step === 'payment' ? 'border-black bg-black text-white' : 'border-black/20 text-black/40'
            }`}>
              2
            </div>
            <span className={`text-sm font-light tracking-wide ${
              step === 'payment' ? '' : 'text-black/40'
            }`}>
              Pago
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="border border-black/10 p-8 sm:p-12 bg-white">
          {step === 'info' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl mb-8 font-light tracking-tight">Información de Envío</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm mb-2 font-light tracking-wide">Email</label>
                    <input type="email" required value={formData.email} onChange={set('email')}
                      className={inputClass(!!errors.email)} placeholder="tu@email.com" maxLength={254} />
                    <FieldError msg={errors.email} />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm mb-2 font-light tracking-wide">Nombre</label>
                      <input type="text" required value={formData.firstName} onChange={set('firstName')}
                        className={inputClass(!!errors.firstName)} placeholder="María" maxLength={60} />
                      <FieldError msg={errors.firstName} />
                    </div>
                    <div>
                      <label className="block text-sm mb-2 font-light tracking-wide">Apellido</label>
                      <input type="text" required value={formData.lastName} onChange={set('lastName')}
                        className={inputClass(!!errors.lastName)} placeholder="González" maxLength={60} />
                      <FieldError msg={errors.lastName} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2 font-light tracking-wide">Dirección</label>
                    <input type="text" required value={formData.address} onChange={set('address')}
                      className={inputClass(!!errors.address)} placeholder="Calle y número" maxLength={200} />
                    <FieldError msg={errors.address} />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm mb-2 font-light tracking-wide">Ciudad</label>
                      <input type="text" required value={formData.city} onChange={set('city')}
                        className={inputClass(!!errors.city)} placeholder="CDMX" maxLength={80} />
                      <FieldError msg={errors.city} />
                    </div>
                    <div>
                      <label className="block text-sm mb-2 font-light tracking-wide">Estado</label>
                      <input type="text" required value={formData.state} onChange={set('state')}
                        className={inputClass(!!errors.state)} placeholder="Ciudad de México" maxLength={80} />
                      <FieldError msg={errors.state} />
                    </div>
                    <div>
                      <label className="block text-sm mb-2 font-light tracking-wide">CP</label>
                      <input type="text" required value={formData.zipCode} onChange={set('zipCode')}
                        className={inputClass(!!errors.zipCode)} placeholder="01000" maxLength={6} />
                      <FieldError msg={errors.zipCode} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-2 font-light tracking-wide">Teléfono</label>
                    <input type="tel" required value={formData.phone} onChange={set('phone')}
                      className={inputClass(!!errors.phone)} placeholder="55 1234 5678" maxLength={15} />
                    <FieldError msg={errors.phone} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-8">
                <Lock className="w-5 h-5" />
                <h2 className="text-2xl font-light tracking-tight">Información de Pago</h2>
              </div>

              {/* Aviso de seguridad de datos de tarjeta */}
              <div className="bg-neutral-50 p-5 border border-black/5 text-sm font-light flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="font-normal">Datos protegidos.</strong> Los datos de tu tarjeta son
                  tokenizados con Stripe.js directamente en tu navegador.
                  <span className="text-red-600/70"> Nunca se almacenan en nuestros servidores.</span>
                </span>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm mb-2 font-light tracking-wide">Número de Tarjeta</label>
                  <input type="text" required value={formData.cardNumber} onChange={set('cardNumber')}
                    className={inputClass(!!errors.cardNumber)}
                    placeholder="1234 5678 9012 3456" maxLength={19}
                    inputMode="numeric" autoComplete="cc-number" />
                  <FieldError msg={errors.cardNumber} />
                </div>

                <div>
                  <label className="block text-sm mb-2 font-light tracking-wide">Nombre en la Tarjeta</label>
                  <input type="text" required value={formData.cardName} onChange={set('cardName')}
                    className={inputClass(!!errors.cardName)}
                    placeholder="MARÍA GONZÁLEZ" maxLength={60}
                    autoComplete="cc-name" />
                  <FieldError msg={errors.cardName} />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm mb-2 font-light tracking-wide">Fecha de Expiración</label>
                    <input type="text" required value={formData.expiryDate} onChange={set('expiryDate')}
                      className={inputClass(!!errors.expiryDate)}
                      placeholder="MM/AA" maxLength={5}
                      autoComplete="cc-exp" />
                    <FieldError msg={errors.expiryDate} />
                  </div>
                  <div>
                    <label className="block text-sm mb-2 font-light tracking-wide">CVV</label>
                    <input type="password" required value={formData.cvv} onChange={set('cvv')}
                      className={inputClass(!!errors.cvv)}
                      placeholder="•••" maxLength={4}
                      autoComplete="cc-csc" inputMode="numeric" />
                    <FieldError msg={errors.cvv} />
                    <p className="mt-1 text-xs text-black/35">3 dígitos en el reverso (4 para Amex)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-12 pt-8 border-t border-black/5">
            {step === 'payment' && (
              <button
                type="button"
                onClick={() => setStep('info')}
                className="flex-1 py-5 border border-black/10 hover:bg-black hover:text-white transition-colors font-light tracking-wide"
              >
                Atrás
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-black text-white py-5 hover:bg-black/90 transition-colors font-light tracking-wide"
            >
              {step === 'info' ? 'Continuar al Pago' : 'Completar Compra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
