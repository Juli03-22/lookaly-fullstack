import { useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import { motion, useInView, AnimatePresence } from 'motion/react';
import { Search, X, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { mockProducts, Product } from '../data/products';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const categories = [
  { value: '', label: 'Todo' },
  { value: 'maquillaje', label: 'Maquillaje' },
  { value: 'cuerpo', label: 'Cuerpo' },
  { value: 'piel', label: 'Piel' },
];

const sortOptions = [
  { value: 'popular', label: 'Más populares' },
  { value: 'price-low', label: 'Precio: menor a mayor' },
  { value: 'price-high', label: 'Precio: mayor a menor' },
];

function ProductSearchCard({ product, index }: { product: Product; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const lowestPrice = Math.min(...product.prices.map(p => p.price));
  const highestPrice = Math.max(...product.prices.map(p => p.price));
  const savings = highestPrice - lowestPrice;

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: EASE, delay: index * 0.06 }}>
      <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.3 }}>
        <Link to={`/product/${product.id}`} className="group flex gap-5 p-4 bg-white/70 rounded-2xl border border-[#E5B6C3]/15 hover:border-[#E5B6C3]/40 hover:shadow-[0_8px_32px_rgba(180,100,130,0.1)] transition-all">
          <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-neutral-50">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <p className="text-xs uppercase tracking-widest text-black/35 mb-0.5">{product.brand}</p>
                <h3 className="text-lg leading-tight group-hover:text-[#7D3150] transition-colors"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}>{product.name}</h3>
              </div>
              {savings > 0 && (
                <span className="shrink-0 text-[10px] bg-[#E5B6C3]/30 text-[#7D3150] px-2.5 py-1 rounded-full uppercase tracking-widest">
                  Ahorra ${savings}
                </span>
              )}
            </div>
            <p className="text-xs text-black/45 line-clamp-2 mb-2">{product.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-light text-[#7D3150]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  ${lowestPrice.toLocaleString('es-MX')}
                </span>
                <span className="text-xs text-black/30">desde · {product.prices.length} tiendas</span>
              </div>
              <ArrowRight className="w-4 h-4 text-black/25 group-hover:text-[#7D3150] group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);

  const results = mockProducts.filter(p => {
    const matchesQuery = query.length < 2 || [p.name, p.brand, p.description].some(s => s.toLowerCase().includes(query.toLowerCase()));
    const matchesCategory = !activeCategory || p.category === activeCategory;
    return matchesQuery && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return Math.min(...a.prices.map(p => p.price)) - Math.min(...b.prices.map(p => p.price));
    if (sortBy === 'price-high') return Math.min(...b.prices.map(p => p.price)) - Math.min(...a.prices.map(p => p.price));
    return b.rating - a.rating;
  });

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (val) setSearchParams({ q: val });
    else setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-[#FDF8F9] pt-28">

      {/* Search header */}
      <div className="sticky top-20 z-40 bg-[#FDF8F9]/90 backdrop-blur-xl border-b border-[#E5B6C3]/20 px-4 sm:px-8 py-5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 bg-white rounded-2xl border border-[#E5B6C3]/40 px-5 py-4 shadow-[0_4px_24px_rgba(180,100,130,0.08)] focus-within:border-[#7D3150]/30 focus-within:shadow-[0_4px_32px_rgba(125,49,80,0.12)] transition-all">
            <Search className="w-5 h-5 text-[#7D3150]/60 shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              placeholder="¿Qué belleza buscas?"
              className="flex-1 bg-transparent outline-none text-base placeholder:text-black/30"
            />
            {query && (
              <button onClick={() => handleQueryChange('')} className="text-black/30 hover:text-black/60 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-full transition-colors ${showFilters ? 'bg-[#E5B6C3]/30 text-[#7D3150]' : 'hover:bg-[#E5B6C3]/20 text-black/40'}`}>
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35 }} className="overflow-hidden">
                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  {/* Categories */}
                  <div className="flex gap-2 flex-wrap">
                    {categories.map(cat => (
                      <button key={cat.value} onClick={() => setActiveCategory(cat.value)}
                        className={`px-4 py-2 rounded-full text-xs uppercase tracking-widest transition-colors ${activeCategory === cat.value ? 'bg-[#7D3150] text-white' : 'bg-white border border-[#E5B6C3]/40 text-black/50 hover:border-[#7D3150]/30'}`}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  {/* Sort */}
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                    className="ml-auto text-xs border border-[#E5B6C3]/40 rounded-full px-4 py-2 bg-white text-black/60 outline-none cursor-pointer">
                    {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10">

        {/* Stats row */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-black/45">
            {query.length >= 2
              ? <>{results.length} resultado{results.length !== 1 ? 's' : ''} para <span className="text-[#7D3150] font-medium">"{query}"</span></>
              : <>{mockProducts.length} productos disponibles</>
            }
          </p>
          {activeCategory && (
            <button onClick={() => setActiveCategory('')}
              className="flex items-center gap-1.5 text-xs text-[#7D3150] border border-[#E5B6C3]/40 rounded-full px-3 py-1.5 hover:bg-[#E5B6C3]/10 transition-colors">
              {categories.find(c => c.value === activeCategory)?.label} <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Results list */}
        {results.length > 0 ? (
          <div className="space-y-4">
            {results.map((product, i) => (
              <ProductSearchCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-32 text-center">
            <div className="text-6xl mb-6">✨</div>
            <h3 className="text-3xl font-extralight mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Sin resultados</h3>
            <p className="text-black/45 text-sm mb-8">Prueba con otro término o explora todas las categorías</p>
            <Link to="/products" className="inline-flex items-center gap-2 text-[#7D3150] border border-[#7D3150]/30 px-8 py-3 rounded-full text-sm hover:bg-[#7D3150]/5 transition-colors">
              Ver todos los productos <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

        {/* Popular searches if empty query */}
        {query.length < 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-16">
            <p className="text-xs uppercase tracking-widest text-black/30 mb-5">Búsquedas populares</p>
            <div className="flex flex-wrap gap-3">
              {['Labial Chanel', 'Suero La Mer', 'Paleta Urban Decay', 'Perfume Dior', 'Base Estée Lauder'].map(term => (
                <button key={term} onClick={() => handleQueryChange(term)}
                  className="px-5 py-2.5 bg-white border border-[#E5B6C3]/30 rounded-full text-sm text-black/55 hover:border-[#7D3150]/30 hover:text-[#7D3150] transition-colors">
                  {term}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
