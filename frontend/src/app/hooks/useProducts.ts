import { useState, useEffect } from 'react';
import { Product } from '../data/products';

export interface ProductsPage {
  items: Product[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ── Fetch list of products ────────────────────────────────────────────────────

export function useProducts(category?: string, brand?: string, subcategory?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ size: '100' });
    if (category) params.set('category', category);
    if (brand) params.set('brand', brand);
    if (subcategory) params.set('subcategory', subcategory);
    fetch(`/api/products?${params}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data: ProductsPage) => { setProducts(data.items ?? []); setLoading(false); })
      .catch(e => { setError((e as Error).message); setLoading(false); });
  }, [category, brand, subcategory]);

  return { products, loading, error };
}

// ── Fetch a single product by id ──────────────────────────────────────────────

export function useProduct(id: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setProduct(null);
    setError(null);
    fetch(`/api/products/${id}`)
      .then(r => { if (!r.ok) throw new Error('Producto no encontrado'); return r.json(); })
      .then((data: Product) => { setProduct(data); setLoading(false); })
      .catch(e => { setError((e as Error).message); setLoading(false); });
  }, [id]);

  return { product, loading, error };
}

// ── Fetch brands list ─────────────────────────────────────────────────────────

export interface BrandItem { id: string; name: string; }

export function useBrands() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/brands')
      .then(r => r.json())
      .then((data: BrandItem[]) => { setBrands(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { brands, loading };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the lowest price across all comparison sites, or undefined if no prices. */
export function lowestPrice(product: Product): number | undefined {
  const prices = product.prices ?? [];
  if (prices.length === 0) return product.unit_price ? Number(product.unit_price) : undefined;
  return Math.min(...prices.map(p => Number(p.price)));
}

/** Returns the primary display image URL for a product. */
export function productImage(product: Product): string {
  return product.primary_image ?? (product.images?.[0]?.url) ?? product.image ?? '';
}
