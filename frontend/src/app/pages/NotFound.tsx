import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, Home, Search } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FDF8F9] flex items-center justify-center px-4 overflow-hidden">

      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-[#E5B6C3]/15 blur-3xl"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#7D3150]/10 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">

        {/* 404 number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mb-4"
        >
          <span
            className="text-[180px] sm:text-[240px] font-extralight leading-none text-[#E5B6C3]/40 select-none"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            404
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
        >
          <h1 className="text-4xl sm:text-5xl font-extralight mb-4 -mt-8"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Página no encontrada
          </h1>
          <p className="text-black/45 text-sm leading-relaxed mb-12 max-w-sm mx-auto">
            Parece que esta página desapareció como el perfume favorito que se agota. Explora desde aquí.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55, ease: EASE }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link to="/" className="inline-flex items-center gap-3 bg-[#7D3150] text-white px-10 py-4 rounded-full text-sm font-medium hover:bg-[#6a2943] transition-colors">
              <Home className="w-4 h-4" /> Ir al inicio
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link to="/search" className="inline-flex items-center gap-3 border border-[#7D3150]/30 text-[#7D3150] px-10 py-4 rounded-full text-sm hover:bg-[#7D3150]/5 transition-colors">
              <Search className="w-4 h-4" /> Buscar productos
            </Link>
          </motion.div>
        </motion.div>

        {/* Category links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-16"
        >
          <p className="text-xs uppercase tracking-widest text-black/25 mb-5">O explora nuestras secciones</p>
          <div className="flex justify-center gap-8">
            {[
              { to: '/categoria/maquillaje', label: 'Maquillaje' },
              { to: '/categoria/cuerpo', label: 'Cuerpo' },
              { to: '/categoria/piel', label: 'Piel' },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                className="text-sm text-black/40 hover:text-[#7D3150] transition-colors flex items-center gap-1.5 group">
                {label} <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
