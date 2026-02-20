import { Link } from 'react-router';
import { Star } from 'lucide-react';
import { Product } from '../data/products';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const lowestPrice = Math.min(...product.prices.map(p => p.price));
  const highestPrice = Math.max(...product.prices.map(p => p.price));
  const savings = highestPrice - lowestPrice;
  const savingsPercent = Math.round((savings / highestPrice) * 100);

  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="border border-black/5 hover:border-black/20 transition-all duration-300">
        {/* Product Image */}
        <div className="aspect-square overflow-hidden bg-neutral-50">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
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
              ${lowestPrice.toLocaleString('es-MX')}
            </div>
            <div className="text-xs text-black/40 font-light">
              En {product.prices.length} tiendas
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
