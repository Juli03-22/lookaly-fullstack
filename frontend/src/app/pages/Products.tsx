import { useParams } from 'react-router';
import { useState } from 'react';
import { mockProducts } from '../data/products';
import ProductCard from '../components/ProductCard';
import { Filter, ChevronDown } from 'lucide-react';

export default function Products() {
  const { category } = useParams();
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'popular'>('popular');
  const [showFilters, setShowFilters] = useState(false);

  // Filter products by category if provided
  let filteredProducts = category
    ? mockProducts.filter(p => p.category === category)
    : mockProducts;

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') {
      const aMin = Math.min(...a.prices.map(p => p.price));
      const bMin = Math.min(...b.prices.map(p => p.price));
      return aMin - bMin;
    } else if (sortBy === 'price-high') {
      const aMax = Math.max(...a.prices.map(p => p.price));
      const bMax = Math.max(...b.prices.map(p => p.price));
      return bMax - aMax;
    } else {
      return b.rating - a.rating;
    }
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
            {sortedProducts.length} productos disponibles
          </p>
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-black/10 hover:border-black/30 transition-colors font-light text-sm tracking-wide"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-white border border-black/10 px-6 py-3 pr-12 cursor-pointer hover:border-black/30 transition-colors font-light text-sm"
            >
              <option value="popular">Más Populares</option>
              <option value="price-low">Precio: Menor a Mayor</option>
              <option value="price-high">Precio: Mayor a Menor</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {sortedProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Empty State */}
        {sortedProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl text-black/40 font-light">No se encontraron productos en esta categoría.</p>
          </div>
        )}
      </div>
    </div>
  );
}