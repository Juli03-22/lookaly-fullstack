import { useParams, Link } from 'react-router';
import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { mockProducts } from '../data/products';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function FadeUp({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 32 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

const categoryConfig = {
  maquillaje: {
    title: 'Maquillaje',
    subtitle: 'Realza tu belleza natural',
    description: 'Los mejores productos de maquillaje de marcas de lujo. Compara precios en Sephora, Liverpool y Palacio de Hierro.',
    hero: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=1400&q=85',
    accent: '#E5B6C3',
    highlights: ['Labiales', 'Sombras', 'Bases', 'Iluminadores', 'Blushes'],
    editorial: [
      { img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80', label: 'Labios' },
      { img: 'https://images.unsplash.com/photo-1583241475880-083f84372725?w=600&q=80', label: 'Ojos' },
      { img: 'https://images.unsplash.com/photo-1631214498995-b9acacebe1eb?w=600&q=80', label: 'Rostro' },
    ],
  },
  cuerpo: {
    title: 'Cuerpo',
    subtitle: 'Rituales que transforman',
    description: 'Fragancias, cremas y tratamientos corporales de las marcas más exclusivas del mundo.',
    hero: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=1400&q=85',
    accent: '#C9A0B0',
    highlights: ['Perfumes', 'Cremas', 'Aceites', 'Exfoliantes', 'Aromaterapia'],
    editorial: [
      { img: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&q=80', label: 'Fragancias' },
      { img: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?w=600&q=80', label: 'Cremas' },
      { img: 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=600&q=80', label: 'Baño & Spa' },
    ],
  },
  piel: {
    title: 'Piel',
    subtitle: 'Ciencia para tu dermis',
    description: 'Serums, cremas y tratamientos premium para una piel radiante en cualquier etapa de tu vida.',
    hero: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=1400&q=85',
    accent: '#B8936A',
    highlights: ['Serums', 'Hidratantes', 'SPF', 'Contorno de Ojos', 'Mascarillas'],
    editorial: [
      { img: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80', label: 'Serums' },
      { img: 'https://images.unsplash.com/photo-1614159102629-2d2fa25ca67c?w=600&q=80', label: 'Hidratantes' },
      { img: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&q=80', label: 'Tratamientos' },
    ],
  },
} as const;

export default function CategorySection() {
  const { category } = useParams<{ category: 'maquillaje' | 'cuerpo' | 'piel' }>();
  const cat = category && categoryConfig[category as keyof typeof categoryConfig];

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.4]);

  if (!cat) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-4xl font-extralight mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Categoría no encontrada</h2>
          <Link to="/" className="text-[#7D3150] text-sm hover:underline">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const products = mockProducts.filter(p => p.category === category);

  return (
    <div className="min-h-screen bg-[#FDF8F9]">

      {/* HERO */}
      <section ref={heroRef} className="relative h-[75vh] flex items-end overflow-hidden bg-[#1a0a0f]">
        <motion.div className="absolute inset-0" style={{ y: bgY, opacity: bgOpacity }}>
          <img src={cat.hero} alt={cat.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a0f]/80 via-[#1a0a0f]/20 to-transparent" />
        </motion.div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 pb-16 pt-32">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }}>
            <p className="text-xs uppercase tracking-[0.2em] text-[#E5B6C3] mb-4">Lookaly — Sección</p>
            <h1 className="text-7xl sm:text-8xl md:text-9xl font-extralight text-white mb-6 leading-none"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {cat.title}
            </h1>
            <p className="text-white/60 text-base sm:text-lg max-w-md leading-relaxed mb-8">{cat.description}</p>
            <div className="flex flex-wrap gap-3">
              {cat.highlights.map((h, i) => (
                <motion.span key={h} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.08, ease: EASE }}
                  className="px-4 py-1.5 rounded-full border border-white/20 text-white/70 text-xs tracking-widest uppercase bg-white/5 backdrop-blur-sm">
                  {h}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* EDITORIAL SUBCATEGORIES */}
      <section className="py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <FadeUp className="mb-12">
            <h2 className="text-3xl sm:text-4xl font-extralight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Explora por tipo</h2>
          </FadeUp>
          <div className="grid md:grid-cols-3 gap-5">
            {cat.editorial.map((item, i) => (
              <FadeUp key={item.label} delay={i * 0.1}>
                <motion.div className="relative aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer group" whileHover={{ scale: 1.02 }} transition={{ duration: 0.4, ease: EASE }}>
                  <img src={item.img} alt={item.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 text-white">
                    <h3 className="text-2xl font-extralight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{item.label}</h3>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="py-16 px-4 sm:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <FadeUp className="mb-14 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-black/40 mb-2">Comparando precios</p>
              <h2 className="text-4xl sm:text-5xl font-extralight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Productos destacados
              </h2>
            </div>
            <Link to={`/products/${category}`} className="hidden sm:flex items-center gap-2 text-sm text-[#7D3150] hover:gap-3 transition-all">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeUp>

          {products.length === 0 ? (
            <FadeUp className="py-20 text-center text-black/40">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-light">Próximamente más productos en esta categoría</p>
            </FadeUp>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product, i) => {
                const lowest = Math.min(...product.prices.map(p => p.price));
                const highest = Math.max(...product.prices.map(p => p.price));
                const savings = highest - lowest;
                return (
                  <FadeUp key={product.id} delay={i * 0.1}>
                    <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.35 }}>
                      <Link to={`/product/${product.id}`} className="group block">
                        <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-50 mb-4 relative">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          {savings > 0 && (
                            <div className="absolute top-4 left-4 bg-[#7D3150] text-white text-[10px] px-3 py-1 rounded-full tracking-widest uppercase">
                              Ahorra ${savings}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs uppercase tracking-widest text-black/35">{product.brand}</div>
                          <h3 className="text-lg group-hover:text-[#7D3150] transition-colors leading-tight"
                            style={{ fontFamily: "'Cormorant Garamond', serif" }}>{product.name}</h3>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-light text-[#7D3150]"
                              style={{ fontFamily: "'Cormorant Garamond', serif" }}>${lowest.toLocaleString('es-MX')}</span>
                            <span className="text-xs text-black/35">desde</span>
                          </div>
                          <div className="text-xs text-black/40">{product.prices.length} tiendas comparadas</div>
                        </div>
                      </Link>
                    </motion.div>
                  </FadeUp>
                );
              })}
            </div>
          )}

          <FadeUp className="mt-12 text-center sm:hidden">
            <Link to={`/products/${category}`} className="inline-flex items-center gap-2 text-sm text-[#7D3150] border border-[#7D3150]/30 px-8 py-3 rounded-full hover:bg-[#7D3150]/5 transition-colors">
              Ver todos los productos <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* BANNER */}
      <section className="py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <FadeUp>
            <div className="relative rounded-3xl overflow-hidden bg-[#2D1B22] h-64 flex items-center px-12">
              <div className="absolute inset-0 opacity-20">
                <img src={cat.hero} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="relative z-10">
                <p className="text-[#E5B6C3] text-xs uppercase tracking-widest mb-3">Siempre el mejor precio</p>
                <h3 className="text-3xl sm:text-4xl text-white font-extralight mb-6" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {cat.subtitle}
                </h3>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Link to={`/products/${category}`} className="inline-flex items-center gap-3 bg-[#E5B6C3] text-[#2D1B22] px-8 py-3 rounded-full text-sm font-medium hover:bg-white transition-colors">
                    Comprar ahora <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

    </div>
  );
}
