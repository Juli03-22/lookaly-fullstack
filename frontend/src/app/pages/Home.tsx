import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useProducts, lowestPrice as getLowest, productImage } from '../hooks/useProducts';
import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'motion/react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function FadeUp({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} className={className} initial={{ opacity: 0, y: 36 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.75, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

function GridImage({ src, index }: { src: string; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} className="aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-50" initial={{ opacity: 0, scale: 0.92, y: 32 }} animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}} transition={{ duration: 0.85, delay: index * 0.14, ease: EASE }} whileHover={{ scale: 1.02 }}>
      <img src={src} alt="Beauty" className="w-full h-full object-cover" />
    </motion.div>
  );
}

export default function Home() {
  const { products, loading } = useProducts();
  const featuredProducts = products.slice(0, 4);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '28%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.3]);

  return (
    <div className="min-h-screen">

      {/* HERO */}
      <section ref={heroRef} className="relative h-screen flex items-center overflow-hidden bg-[#1a0a0f]">
        <motion.div className="absolute inset-0" style={{ y: bgY, opacity: bgOpacity }}>
          <img src="https://images.pexels.com/photos/458766/pexels-photo-458766.jpeg" alt="Luxury Beauty" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a0a0f]/75 via-[#1a0a0f]/30 to-transparent" />
        </motion.div>
        <motion.div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-28 sm:pt-32" style={{ y: textY }}>
          <div className="max-w-3xl">
            <motion.h1
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, ease: EASE }}
              className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl mb-6 tracking-tight leading-[0.9] text-white"
              style={{ fontFamily: "'Bai Jamjuree', sans-serif", fontWeight: 700 }}
            >
              El precio<br />más bajo<br /><span className="text-[#E5B6C3]">siempre.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45, ease: EASE }} className="text-base sm:text-lg text-white/70 mb-10 max-w-md leading-relaxed">
              En tu maquillaje favorito.<br />Compara precios en las mejores tiendas de México.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.7, ease: EASE }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                <Link to="/products" className="inline-flex items-center gap-3 bg-[#E5B6C3] text-[#2D1B22] px-10 py-4 hover:bg-white transition-colors group font-medium rounded-full text-sm">
                  Llevame ahi <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 1 }}>
          <motion.div className="w-px h-12 bg-white/30 origin-top" animate={{ scaleY: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.div>
      </section>

      {/* STATS */}
      <section className="py-20 border-b border-[#E5B6C3]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-16">
            {[{ num: '+500', label: 'Productos Premium' }, { num: '30%', label: 'Ahorro Promedio' }, { num: '5', label: 'Tiendas Comparadas' }].map((stat, i) => (
              <FadeUp key={stat.label} delay={i * 0.12} className="text-center">
                <div className="text-5xl md:text-6xl mb-3 font-extralight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{stat.num}</div>
                <div className="text-xs uppercase tracking-widest text-black/50">{stat.label}</div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      {!loading && featuredProducts.length > 0 && <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <FadeUp className="mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl mb-4 font-extralight tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Productos Destacados</h2>
            <p className="text-black/55 text-sm">Los mas buscados esta semana</p>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product, i) => {
              const lowest = getLowest(product);
              return (
                <FadeUp key={product.id} delay={i * 0.1}>
                  <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.35 }}>
                    <Link to={`/product/${product.id}`} className="group block">
                      <div className="aspect-square overflow-hidden bg-neutral-50 mb-4 rounded-xl">
                        <img src={productImage(product)} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs uppercase tracking-widest text-black/40">{product.brand}</div>
                        <h3 className="text-base group-hover:text-[#7D3150] transition-colors" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{product.name}</h3>
                        {lowest != null && <div className="text-xl font-light text-[#7D3150]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>${lowest.toLocaleString('es-MX')}</div>}
                      </div>
                    </Link>
                  </motion.div>
                </FadeUp>
              );
            })}
          </div>
          <FadeUp delay={0.4} className="text-center mt-16">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link to="/products" className="inline-flex items-center gap-3 border border-[#7D3150] text-[#7D3150] px-10 py-4 hover:bg-[#7D3150] hover:text-white transition-colors group rounded-full text-sm">
                Ver Todos los Productos <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </FadeUp>
        </div>
      </section>}

      {/* HOW IT WORKS */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FBF0F3]">
        <div className="max-w-7xl mx-auto">
          <FadeUp className="mb-20 text-center">
            <h2 className="text-4xl sm:text-5xl md:text-6xl mb-4 font-extralight tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Como Funciona</h2>
            <p className="text-black/55 text-sm">Simple, rapido y transparente</p>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-16">
            {[{ n: '01', title: 'Busca tu Producto', desc: 'Encuentra entre mas de 500 productos premium de las mejores marcas de belleza.' }, { n: '02', title: 'Compara Precios', desc: 'Ve al instante las diferencias entre Sephora, Liverpool, Palacio de Hierro y mas.' }, { n: '03', title: 'Ahorra Siempre', desc: 'Compra al mejor precio con envio seguro a toda la Republica Mexicana.' }].map((step, i) => (
              <FadeUp key={step.n} delay={i * 0.15} className="text-center">
                <motion.div className="w-16 h-16 mx-auto mb-8 flex items-center justify-center text-2xl border border-[#E5B6C3]/60 rounded-full text-[#7D3150]" style={{ fontFamily: "'Cormorant Garamond', serif" }} whileHover={{ scale: 1.18 }} transition={{ duration: 0.3 }}>{step.n}</motion.div>
                <h3 className="text-xl mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{step.title}</h3>
                <p className="text-black/55 leading-relaxed text-sm">{step.desc}</p>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* IMAGE GRID */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {['https://images.unsplash.com/photo-1609468826499-0ec9af2fc7f4?w=600&q=80', 'https://images.unsplash.com/photo-1767458770505-4daf3e3a3f77?w=600&q=80', 'https://images.unsplash.com/photo-1620917669809-1af0497965de?w=600&q=80'].map((src, i) => (
            <GridImage key={src} src={src} index={i} />
          ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#FBF0F3]">
        <div className="max-w-7xl mx-auto">
          <FadeUp className="mb-20 text-center">
            <h2 className="text-4xl sm:text-5xl md:text-6xl mb-4 font-extralight tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Lo Que Dicen</h2>
            <p className="text-black/55 text-sm">Nuestras clientas satisfechas</p>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-8">
            {[{ quote: '"Increible poder comparar precios de productos de lujo en un solo lugar. He ahorrado mas del 25%."', name: 'Maria Gonzalez', city: 'Ciudad de Mexico' }, { quote: '"La experiencia de compra es impecable. Elegante, simple y siempre encuentro el mejor precio."', name: 'Ana Martinez', city: 'Guadalajara' }, { quote: '"Me encanta la seleccion premium. La comparacion de precios es clara y transparente."', name: 'Sofia Ramirez', city: 'Monterrey' }].map((t, i) => (
              <FadeUp key={t.name} delay={i * 0.12}>
                <motion.div className="space-y-6 p-8 bg-white/70 rounded-2xl border border-[#E5B6C3]/20 h-full" whileHover={{ y: -6, boxShadow: '0 16px 48px rgba(180,100,130,0.13)' }} transition={{ duration: 0.3 }}>
                  <p className="text-black/60 italic leading-relaxed text-sm">{t.quote}</p>
                  <div>
                    <div className="font-medium text-[#2D1B22]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{t.name}</div>
                    <div className="text-xs text-black/40 mt-0.5">{t.city}</div>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* BRANDS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-[#E5B6C3]/20">
        <div className="max-w-7xl mx-auto text-center">
          <FadeUp className="mb-10"><p className="text-xs uppercase tracking-widest text-black/35">Marcas Disponibles</p></FadeUp>
          <div className="flex flex-wrap justify-center items-center gap-10 sm:gap-16">
            {['CHANEL', 'LA MER', 'DIOR', 'URBAN DECAY', 'ESTEE LAUDER', 'LANCOME'].map((brand, i) => (
              <FadeUp key={brand} delay={i * 0.07}>
                <motion.div className="text-xl sm:text-2xl font-light text-black/25 cursor-default" style={{ fontFamily: "'Cormorant Garamond', serif" }} whileHover={{ color: '#7D3150', scale: 1.1 }} transition={{ duration: 0.25 }}>{brand}</motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <FadeUp className="mb-20 text-center">
            <h2 className="text-4xl sm:text-5xl md:text-6xl mb-4 font-extralight tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Explora por Categoria</h2>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-6">
            {[{ to: '/products/maquillaje', label: 'Maquillaje', img: 'https://images.unsplash.com/photo-1650725737108-63718b7e8977?w=600&q=80' }, { to: '/products/cuerpo', label: 'Cuerpo', img: 'https://images.unsplash.com/photo-1613381741586-dd07826edc19?w=600&q=80' }, { to: '/products/piel', label: 'Piel', img: 'https://images.unsplash.com/photo-1746723378067-83a345ff3160?w=600&q=80' }].map((cat, i) => (
              <FadeUp key={cat.to} delay={i * 0.12}>
                <Link to={cat.to} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-50">
                  <motion.img src={cat.img} alt={cat.label} className="w-full h-full object-cover" whileHover={{ scale: 1.08 }} transition={{ duration: 0.6, ease: EASE }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent group-hover:from-black/70 transition-colors duration-500" />
                  <div className="absolute bottom-8 left-8 text-white">
                    <h3 className="text-3xl font-extralight mb-2 mt-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{cat.label}</h3>
                    <div className="flex items-center gap-2 text-sm text-white/80 group-hover:gap-3 transition-all">Explorar <ArrowRight className="w-4 h-4" /></div>
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#2D1B22] text-white overflow-hidden relative">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#E5B6C3]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#7D3150]/20 blur-3xl pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <FadeUp>
            <h2 className="text-4xl sm:text-5xl md:text-6xl mb-6 font-extralight tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Mantente Informada</h2>
            <p className="text-white/60 mb-12 text-sm leading-relaxed">Recibe las mejores ofertas y novedades directamente en tu correo</p>
            <form className="flex flex-col sm:flex-row gap-4">
              <input type="email" placeholder="tu@email.com" className="flex-1 px-6 py-4 bg-white/10 border border-[#E5B6C3]/30 text-white placeholder:text-white/40 focus:outline-none focus:border-[#E5B6C3]/60 rounded-full text-sm" />
              <motion.button type="submit" className="px-8 py-4 bg-[#E5B6C3] text-[#2D1B22] hover:bg-white transition-colors font-medium tracking-wide rounded-full text-sm" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>Suscribirse</motion.button>
            </form>
          </FadeUp>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t border-[#E5B6C3]/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <h4 className="mb-6 text-base" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Categorias</h4>
              <ul className="space-y-3 text-sm text-black/50">
                <li><Link to="/products/maquillaje" className="hover:text-[#7D3150] transition-colors">Maquillaje</Link></li>
                <li><Link to="/products/cuerpo" className="hover:text-[#7D3150] transition-colors">Cuerpo</Link></li>
                <li><Link to="/products/piel" className="hover:text-[#7D3150] transition-colors">Piel</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-6 text-base" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Tiendas</h4>
              <ul className="space-y-3 text-sm text-black/50"><li>Sephora MX</li><li>Liverpool</li><li>Palacio de Hierro</li></ul>
            </div>
            <div>
              <h4 className="mb-6 text-base" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Informacion</h4>
              <ul className="space-y-3 text-sm text-black/50">
                <li><a href="#" className="hover:text-[#7D3150] transition-colors">Sobre Nosotros</a></li>
                <li><a href="#" className="hover:text-[#7D3150] transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-[#7D3150] transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-6 text-base" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Legal</h4>
              <ul className="space-y-3 text-sm text-black/50">
                <li><a href="#" className="hover:text-[#7D3150] transition-colors">Privacidad</a></li>
                <li><a href="#" className="hover:text-[#7D3150] transition-colors">Terminos</a></li>
                <li><a href="#" className="hover:text-[#7D3150] transition-colors">Envios</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-[#E5B6C3]/20 text-center text-xs text-black/30">
            2026 Lookaly.mx - Todos los derechos reservados
          </div>
        </div>
      </footer>

    </div>
  );
}
