import { Link } from 'react-router';
import { Star } from 'lucide-react';
import { Product } from '../data/products';
import { lowestPrice as getLowest, productImage } from '../hooks/useProducts';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const prices = product.prices ?? [];
  const lowest = getLowest(product);
  const highest = prices.length > 0 ? Math.max(...prices.map(p => Number(p.price))) : lowest ?? 0;
  const savings = lowest != null ? highest - lowest : 0;
  const savingsPercent = highest > 0 ? Math.round((savings / highest) * 100) : 0;

  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="border border-black/5 hover:border-black/20 transition-all duration-300">
        {/* Product Image */}
        <div className="aspect-square overflow-hidden bg-neutral-50">
          <img
            src={productImage(product)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
          />
        </div>

        {/* Product Info */}
        <div className="p-6 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs uppercase tracking-widest text-black/40 font-light">
              {product.brand}
            </span>
            {savingsPercent > 0 && (
              <span className="text-xs bg-black text-white px-2 py-1 font-light">
                -{savingsPercent}%
              </span>
            )}
          </div>

          <h3 className="text-base mb-3 line-clamp-2 group-hover:text-black/60 transition-colors font-light">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-black text-black" />
              <span className="text-sm font-light">{product.rating}</span>
            </div>
            <span className="text-xs text-black/40 font-light">({product.reviews})</span>
          </div>

          {/* Price */}
          <div className="space-y-1 mb-4">
            <div className="text-2xl font-extralight">
              {lowest != null ? `$${lowest.toLocaleString('es-MX')}` : <span className="text-black/30 text-lg">Sin precio</span>}
            </div>
            <div className="text-xs text-black/40 font-light">
              {prices.length > 0 ? `En ${prices.length} tiendas` : 'Precio base'}
            </div>
          </div>

          {/* CTA */}
          <div className="text-xs tracking-widest uppercase font-light border-t border-black/5 pt-4 group-hover:text-black/60 transition-colors">
            Ver Comparación →
          </div>
        </div>
      </div>
    </Link>
  );
}
