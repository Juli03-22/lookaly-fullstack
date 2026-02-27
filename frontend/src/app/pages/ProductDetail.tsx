import { useParams, useNavigate, Link, Navigate } from "react-router";
import { useState, useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import ReactMarkdown from 'react-markdown';
import { useProduct, useProducts, productImage, lowestPrice as getLowest } from "../hooks/useProducts";
import { useCart } from "../context/CartContext";
import { Star, ShoppingBag, ArrowLeft, Check, ExternalLink, TrendingDown, ChevronRight, Heart, Minus, Plus, Trash2 } from "lucide-react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function FadeUp({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: EASE, delay }}>
      {children}
    </motion.div>
  );
}

const availabilityConfig = {
  "in-stock": { label: "En stock", color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-400" },
  "low-stock": { label: "Pocas unidades", color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-400" },
  "out-of-stock": { label: "Agotado", color: "text-red-400", bg: "bg-red-50", dot: "bg-red-300" },
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { product, loading } = useProduct(id);
  const { products: allProducts } = useProducts();
  const { addItem, removeItem, items } = useCart();
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [qty, setQty] = useState(1);
  const [selectedImg, setSelectedImg] = useState(0);
  const [wishlist, setWishlist] = useState(false);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF8F9]">
        <div className="text-sm tracking-widest uppercase text-black/30">Cargando...</div>
      </div>
    );
  }

  if (!product) return <Navigate to="/404" replace />;

  const sortedPrices = [...(product.prices ?? [])].sort((a, b) => Number(a.price) - Number(b.price));
  const lowestPrice = sortedPrices.length > 0 ? Number(sortedPrices[0].price) : (product.unit_price != null ? Number(product.unit_price) : 0);
  const highestPrice = sortedPrices.length > 0 ? Number(sortedPrices[sortedPrices.length - 1].price) : lowestPrice;
  const savings = highestPrice - lowestPrice;
  const activeSite = selectedSite || (sortedPrices[0]?.site ?? '');
  const activePrice = product.prices?.find(p => p.site === activeSite);
  const cartEntry = items.find(i => i.productId === product.id);

  const displayImage = product.images?.length
    ? (product.images[selectedImg]?.url ?? productImage(product))
    : productImage(product);

  const handleAddToCart = () => {
    addItem(product.id, activeSite, qty);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const related = allProducts.filter(p => p.id !== product.id && p.category === product.category).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#FDF8F9]">

      {/* Breadcrumb */}
      <div className="pt-28 pb-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-black/35">
          <Link to="/" className="hover:text-[#7D3150] transition-colors">Inicio</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/products/${product.category}`} className="hover:text-[#7D3150] transition-colors capitalize">{product.category}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-black/60 truncate max-w-[160px]">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* IMAGE */}
          <div ref={heroRef} className="lg:sticky lg:top-28">
            <motion.div className="relative overflow-hidden rounded-3xl aspect-square bg-neutral-50" style={{ y: imgY }}>
              <img src={displayImage} alt={product.name} className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
              {savings > 0 && (
                <div className="absolute top-5 left-5 bg-[#7D3150] text-white text-xs px-4 py-1.5 rounded-full tracking-widest uppercase">
                  Ahorra ${savings.toLocaleString("es-MX")}
                </div>
              )}
              <motion.button
                onClick={() => setWishlist(!wishlist)}
                className="absolute top-5 right-5 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Heart className={`w-4 h-4 transition-colors ${wishlist ? "fill-rose-400 text-rose-400" : "text-black/40"}`} />
              </motion.button>
            </motion.div>

            {/* Thumbnail strip */}
            <div className="flex gap-3 mt-4">
              {(product.images?.length ? product.images.map(img => img.url) : [productImage(product), productImage(product), productImage(product)]).slice(0, 5).map((src, i) => (
                <button key={i} onClick={() => setSelectedImg(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden bg-neutral-50 cursor-pointer border-2 transition-colors ${i === selectedImg ? "border-[#7D3150]" : "border-transparent hover:border-[#E5B6C3]"}`}>
                  <img src={src} alt="" className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                </button>
              ))}
            </div>
          </div>

          {/* INFO */}
          <div className="pt-2">
            <FadeUp>
              <p className="text-xs uppercase tracking-[0.2em] text-[#7D3150] mb-2">{product.brand}</p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extralight mb-4 leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}>{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating) ? "fill-[#E5B6C3] text-[#E5B6C3]" : "text-black/15"}`} />
                  ))}
                </div>
                <span className="text-sm text-black/50">{product.rating}  {product.reviews} reseñas</span>
              </div>

              <div className="mb-8">
                <ReactMarkdown
                  allowedElements={['p', 'ul', 'ol', 'li', 'strong', 'em', 'br']}
                  unwrapDisallowed
                  components={{
                    p: ({ children }) => (
                      <p className="text-black/55 leading-relaxed text-sm mb-2 last:mb-0">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc ml-4 mb-2 last:mb-0 text-sm text-black/55 space-y-0.5">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal ml-4 mb-2 last:mb-0 text-sm text-black/55 space-y-0.5">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-relaxed">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-black/70">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic">{children}</em>
                    ),
                  }}
                >
                  {product.description}
                </ReactMarkdown>
              </div>
            </FadeUp>

            {/* PRICE COMPARISON */}
            <FadeUp delay={0.1} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-4 h-4 text-[#7D3150]" />
                <h3 className="text-xs uppercase tracking-widest text-black/45">Comparar precios</h3>
              </div>

              <div className="space-y-3">
                {sortedPrices.map((price, i) => {
                  const avail = availabilityConfig[price.availability as keyof typeof availabilityConfig] ?? availabilityConfig['in-stock'];
                  const isSelected = activeSite === price.site;
                  const isBest = i === 0;

                  return (
                    <motion.button key={price.site} onClick={() => setSelectedSite(price.site)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${isSelected ? "border-[#7D3150] bg-[#7D3150]/5" : "border-[#E5B6C3]/25 bg-white/70 hover:border-[#E5B6C3]/50"}`}
                      whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }} transition={{ duration: 0.2 }}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "border-[#7D3150] bg-[#7D3150]" : "border-black/20"}`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{price.site}</span>
                            {isBest && <span className="text-[10px] bg-[#7D3150] text-white px-2 py-0.5 rounded-full">Mejor precio</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${avail.dot}`} />
                            <span className={`text-xs ${avail.color}`}>{avail.label}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-extralight text-[#7D3150]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                          ${Number(price.price).toLocaleString("es-MX")}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </FadeUp>

            {/* Summary */}
            <FadeUp delay={0.2} className="bg-[#FBF0F3] rounded-2xl p-5 mb-8">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm text-black/50">Precio en {activeSite || 'tienda'}</span>
                <span className="text-4xl font-extralight text-[#7D3150]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  ${Number(activePrice?.price ?? lowestPrice).toLocaleString("es-MX")} <span className="text-sm text-black/35">MXN</span>
                </span>
              </div>
              {savings > 0 && (
                <p className="text-xs text-emerald-600">Ahorras ${savings.toLocaleString("es-MX")} vs. el precio más alto</p>
              )}
            </FadeUp>

            {/* CTA */}
            <FadeUp delay={0.22} className="flex items-center gap-4 mb-4">
              <span className="text-xs uppercase tracking-widest text-black/40">Cantidad</span>
              <div className="flex items-center border border-[#E5B6C3]/40 rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-9 h-9 flex items-center justify-center text-[#7D3150] hover:bg-[#E5B6C3]/20 transition-colors">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center text-sm font-medium select-none">{qty}</span>
                <button onClick={() => setQty(q => Math.min(10, q + 1))}
                  className="w-9 h-9 flex items-center justify-center text-[#7D3150] hover:bg-[#E5B6C3]/20 transition-colors">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </FadeUp>

            <FadeUp delay={0.25} className="flex gap-3">
              <motion.button onClick={handleAddToCart}
                className={`flex-1 py-4 rounded-xl text-sm font-medium flex items-center justify-center gap-3 transition-all ${addedToCart ? "bg-emerald-500 text-white" : "bg-[#7D3150] text-white hover:bg-[#6a2943]"}`}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                {addedToCart ? <><Check className="w-4 h-4" /> Agregado al carrito</> : <><ShoppingBag className="w-4 h-4" /> Agregar al carrito</>}
              </motion.button>
              {activePrice?.url && (
                <motion.a href={activePrice.url} target="_blank" rel="noopener noreferrer"
                  className="px-5 py-4 border border-[#7D3150]/30 rounded-xl text-[#7D3150] hover:bg-[#7D3150]/5 transition-colors flex items-center gap-2 text-sm"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <ExternalLink className="w-4 h-4" /> Ver en tienda
                </motion.a>
              )}
            </FadeUp>

            {/* In-cart indicator */}
            {cartEntry && (
              <FadeUp delay={0.28} className="flex items-center justify-between px-4 py-3 bg-emerald-50 rounded-xl mt-3">
                <span className="text-sm text-emerald-700 font-medium">
                  {cartEntry.quantity} pieza{cartEntry.quantity !== 1 ? 's' : ''} en tu carrito
                </span>
                <button onClick={() => removeItem(product.id)}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-3 h-3" /> Quitar del carrito
                </button>
              </FadeUp>
            )}

            {/* Back */}
            <FadeUp delay={0.3} className="mt-8">
              <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs text-black/35 hover:text-[#7D3150] transition-colors">
                <ArrowLeft className="w-3 h-3" /> Volver
              </button>
            </FadeUp>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {related.length > 0 && (
          <section className="mt-24">
            <FadeUp className="mb-10">
              <h2 className="text-3xl sm:text-4xl font-extralight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                También te puede interesar
              </h2>
            </FadeUp>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.map((p, i) => {
                const lp = getLowest(p);
                return (
                  <FadeUp key={p.id} delay={i * 0.1}>
                    <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.35 }}>
                      <Link to={`/product/${p.id}`} className="group block">
                        <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-50 mb-4">
                          <img src={productImage(p)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs uppercase tracking-widest text-black/35">{p.brand}</div>
                          <h3 className="text-lg hover:text-[#7D3150] transition-colors" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{p.name}</h3>
                          {lp != null && <div className="text-xl font-light text-[#7D3150]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>${lp.toLocaleString("es-MX")}</div>}
                        </div>
                      </Link>
                    </motion.div>
                  </FadeUp>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
