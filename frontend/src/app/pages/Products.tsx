import { useParams } from 'react-router';
import { useState } from 'react';
import { useProducts, useBrands } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import { Filter, ChevronDown, X } from 'lucide-react';

const SUBCATEGORY_OPTIONS: Record<string, string[]> = {
  maquillaje: ['labios', 'ojos', 'rostro', 'base', 'corrector', 'polvo', 'rubor', 'bronceador', 'iluminador', 'contorno', 'uñas', 'cejas', 'pestañas'],
  piel:       ['hidratante', 'limpiador', 'sérum', 'mascarilla', 'protector solar', 'exfoliante', 'tónico', 'contorno de ojos', 'aceite facial'],
  cuerpo:     ['loción', 'perfume', 'jabón', 'exfoliante corporal', 'aceite corporal', 'desodorante', 'crema de manos'],
};

export default function Products() {
  const { category } = useParams();
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'popular'>('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [filterBrand, setFilterBrand] = useState('');
  const [filterSubcategory, setFilterSubcategory] = useState('');

  const { brands } = useBrands();
  const { products, loading } = useProducts(category, filterBrand || undefined, filterSubcategory || undefined);

  const subcategoryOptions = category ? (SUBCATEGORY_OPTIONS[category] ?? []) : [];
  const hasActiveFilters = !!filterBrand || !!filterSubcategory;

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    const aMin = a.prices?.length ? Math.min(...a.prices.map(p => Number(p.price))) : (Number(a.unit_price) || 0);
    const bMin = b.prices?.length ? Math.min(...b.prices.map(p => Number(p.price))) : (Number(b.unit_price) || 0);
    const aMax = a.prices?.length ? Math.max(...a.prices.map(p => Number(p.price))) : 0;
    const bMax = b.prices?.length ? Math.max(...b.prices.map(p => Number(p.price))) : 0;
    if (sortBy === 'price-low') return aMin - bMin;
    if (sortBy === 'price-high') return bMax - aMax;
    return b.rating - a.rating;
  });

  const categoryNames: Record<string, string> = {
    maquillaje: 'Maquillaje',
    cuerpo: 'Cuerpo',
    piel: 'Piel',
  };

  const title = category ? categoryNames[category] : 'Todos los Productos';

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16 border-b border-black/5 pb-12">
          <h1 className="text-5xl sm:text-6xl md:text-7xl mb-4 font-extralight tracking-tight">{title}</h1>
          <p className="text-lg text-black/60 font-light">
            {loading ? 'Cargando...' : `${sortedProducts.length} productos disponibles`}
          </p>
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-6 py-3 border transition-colors font-light text-sm tracking-wide ${showFilters || hasActiveFilters ? 'bg-black text-white border-black' : 'bg-white border-black/10 hover:border-black/30'}`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && <span className="ml-1 w-5 h-5 rounded-full bg-white text-black text-[10px] flex items-center justify-center font-semibold">{[filterBrand, filterSubcategory].filter(Boolean).length}</span>}
          </button>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="appearance-none bg-white border border-black/10 px-6 py-3 pr-12 cursor-pointer hover:border-black/30 transition-colors font-light text-sm"
            >
              <option value="popular">Más Populares</option>
              <option value="price-low">Precio: Menor a Mayor</option>
              <option value="price-high">Precio: Mayor a Menor</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mb-10 p-6 bg-white border border-black/5 flex flex-wrap gap-6 items-end">
            {/* Brand filter */}
            <div className="min-w-[200px] flex-1">
              <label className="block text-[10px] uppercase tracking-[0.18em] text-black/40 mb-2">Marca</label>
              <div className="relative">
                <select
                  value={filterBrand}
                  onChange={e => setFilterBrand(e.target.value)}
                  className="w-full appearance-none bg-[#FAFAFA] border border-black/10 px-4 py-2.5 pr-10 text-sm font-light cursor-pointer focus:outline-none focus:border-black/30"
                >
                  <option value="">Todas las marcas</option>
                  {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-black/40" />
              </div>
            </div>

            {/* Subcategory filter — shown only if category is set and has options */}
            {subcategoryOptions.length > 0 && (
              <div className="min-w-[200px] flex-1">
                <label className="block text-[10px] uppercase tracking-[0.18em] text-black/40 mb-2">Subcategoría</label>
                <div className="relative">
                  <select
                    value={filterSubcategory}
                    onChange={e => setFilterSubcategory(e.target.value)}
                    className="w-full appearance-none bg-[#FAFAFA] border border-black/10 px-4 py-2.5 pr-10 text-sm font-light cursor-pointer focus:outline-none focus:border-black/30"
                  >
                    <option value="">Todas</option>
                    {subcategoryOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-black/40" />
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <button
                onClick={() => { setFilterBrand(''); setFilterSubcategory(''); }}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-black/10 text-sm font-light text-black/50 hover:text-black hover:border-black/30 transition-colors"
              >
                <X className="w-4 h-4" /> Limpiar
              </button>
            )}
          </div>
        )}

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-8">
            {filterBrand && (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-black text-white text-xs font-light">
                Marca: {filterBrand}
                <button onClick={() => setFilterBrand('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {filterSubcategory && (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-black text-white text-xs font-light">
                {filterSubcategory}
                <button onClick={() => setFilterSubcategory('')}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="py-24 text-center text-black/30 text-sm tracking-widest uppercase">Cargando productos...</div>
        ) : sortedProducts.length === 0 ? (
          <div className="py-32 text-center">
            <p className="text-5xl font-extralight mb-4 text-black/20" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Sin productos</p>
            <p className="text-sm text-black/40 font-light">
              {hasActiveFilters ? 'No hay productos con esos filtros. Prueba con otra combinación.' : 'No hay productos disponibles en esta categoría. Vuelve pronto.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {sortedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

