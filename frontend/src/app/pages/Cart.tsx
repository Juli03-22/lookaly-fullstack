import { Link } from "react-router";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import { useRef } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";
import { useProducts } from "../hooks/useProducts";
import { useCart } from "../context/CartContext";

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

export default function Cart() {
  const { items: cartItems, updateQuantity, removeItem } = useCart();
  const { products } = useProducts();

  const total = cartItems.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return sum;
    const price = Number(product.prices?.find(p => p.site === item.selectedSite)?.price ?? product.unit_price ?? 0);
    return sum + price * item.quantity;
  }, 0);

  const shippingThreshold = 2500;
  const shipping = total >= shippingThreshold ? 0 : 150;
  const remaining = Math.max(0, shippingThreshold - total);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#FDF8F9]">
        <motion.div className="text-center max-w-md"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-24 h-24 mx-auto mb-8 rounded-full bg-[#E5B6C3]/20 flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-[#7D3150]/40" />
          </motion.div>
          <h2 className="text-4xl sm:text-5xl font-extralight mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Carrito vacío</h2>
          <p className="text-black/45 text-sm mb-10 leading-relaxed">Descubre productos premium y comienza a ahorrar comparando precios.</p>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link to="/products" className="inline-flex items-center gap-3 bg-[#7D3150] text-white px-10 py-4 rounded-full text-sm font-medium hover:bg-[#6a2943] transition-colors">
              Explorar productos <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F9] pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <FadeUp className="mb-12">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extralight tracking-tight mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>Mi Carrito</h1>
          <p className="text-black/40 text-sm">{cartItems.reduce((s, i) => s + i.quantity, 0)} artículos</p>
        </FadeUp>

        <div className="grid lg:grid-cols-3 gap-10">

          {/* Items list */}
          <div className="lg:col-span-2 space-y-4">
            {/* Shipping progress */}
            {remaining > 0 ? (
              <FadeUp className="p-5 bg-[#E5B6C3]/15 rounded-2xl border border-[#E5B6C3]/30 mb-6">
                <p className="text-sm text-[#7D3150] mb-3">
                  Te faltan <strong>${remaining.toLocaleString("es-MX")}</strong> para envío gratis
                </p>
                <div className="h-1.5 bg-[#E5B6C3]/30 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-[#7D3150] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (total / shippingThreshold) * 100)}%` }}
                    transition={{ duration: 1, ease: EASE }} />
                </div>
              </FadeUp>
            ) : (
              <FadeUp className="p-5 bg-[#7D3150]/5 rounded-2xl border border-[#7D3150]/15 mb-6">
                <p className="text-sm text-[#7D3150]"> ¡Tienes envío gratis!</p>
              </FadeUp>
            )}

            <AnimatePresence>
              {cartItems.map((item, idx) => {
                const product = products.find(p => p.id === item.productId);
                if (!product) return null;
                const price = Number(product.prices?.find(p => p.site === item.selectedSite)?.price ?? product.unit_price ?? 0);
                const subtotal = price * item.quantity;
                const lowestPrice = product.prices?.length ? Math.min(...product.prices.map(p => Number(p.price))) : price;

                return (
                  <motion.div key={item.productId}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.5, ease: EASE, delay: idx * 0.07 }}
                    layout
                    className="flex gap-5 p-5 bg-white/80 rounded-2xl border border-[#E5B6C3]/20 hover:border-[#E5B6C3]/40 transition-colors">

                    {/* Image */}
                    <Link to={`/product/${product.id}`} className="shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-neutral-50">
                      <img src={product.primary_image ?? product.images?.[0]?.url ?? product.image} alt={product.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-black/35 mb-0.5">{product.brand}</p>
                          <Link to={`/product/${product.id}`}>
                            <h3 className="text-lg leading-tight hover:text-[#7D3150] transition-colors"
                              style={{ fontFamily: "'Cormorant Garamond', serif" }}>{product.name}</h3>
                          </Link>
                        </div>
                        <button onClick={() => removeItem(item.productId)}
                          className="text-black/20 hover:text-rose-500 transition-colors p-1 shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-xs text-black/40 mb-3">
                        Tienda: <span className="text-[#7D3150]">{item.selectedSite}</span>
                        {price > lowestPrice && (
                          <span className="ml-2 text-black/30">(precio más bajo: ${lowestPrice.toLocaleString("es-MX")})</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        {/* Quantity */}
                        <div className="flex items-center gap-3 bg-[#FBF0F3] rounded-full px-3 py-1.5">
                          <button onClick={() => updateQuantity(item.productId, -1)}
                            className="w-5 h-5 flex items-center justify-center hover:text-[#7D3150] transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm w-5 text-center font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, 1)}
                            className="w-5 h-5 flex items-center justify-center hover:text-[#7D3150] transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-xl font-light text-[#7D3150]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                            ${subtotal.toLocaleString("es-MX")}
                          </span>
                          {item.quantity > 1 && (
                            <p className="text-xs text-black/30">${price.toLocaleString("es-MX")} c/u</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <FadeUp delay={0.15} className="sticky top-28">
              <div className="bg-white/80 rounded-3xl border border-[#E5B6C3]/25 p-8 shadow-[0_8px_40px_rgba(180,100,130,0.08)]">
                <h2 className="text-2xl font-extralight mb-8" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Resumen</h2>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-black/50">Subtotal</span>
                    <span>${total.toLocaleString("es-MX")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-black/50">Envío</span>
                    {shipping === 0
                      ? <span className="text-[#7D3150]">Gratis</span>
                      : <span>${shipping}</span>}
                  </div>
                  <div className="h-px bg-[#E5B6C3]/20" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-medium">Total</span>
                    <span className="text-3xl font-extralight text-[#7D3150]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      ${(total + shipping).toLocaleString("es-MX")}
                    </span>
                  </div>
                </div>

                {/* Promo code */}
                <div className="flex gap-2 mb-6">
                  <input type="text" placeholder="Código de descuento"
                    className="flex-1 px-4 py-3 border border-[#E5B6C3]/35 rounded-xl text-xs bg-white/70 placeholder:text-black/30 focus:outline-none focus:border-[#7D3150]/40 transition-colors" />
                  <button className="px-4 py-3 bg-[#FBF0F3] text-[#7D3150] rounded-xl text-xs hover:bg-[#E5B6C3]/30 transition-colors font-medium">
                    Aplicar
                  </button>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link to="/checkout"
                    className="block w-full py-4 bg-[#7D3150] text-white rounded-xl text-sm font-medium text-center hover:bg-[#6a2943] transition-colors mb-3">
                    Continuar al pago
                  </Link>
                </motion.div>
                <Link to="/products" className="block w-full py-3 text-center text-xs text-black/40 hover:text-[#7D3150] transition-colors">
                  Seguir comprando
                </Link>

                {/* Trust badges */}
                <div className="mt-8 pt-6 border-t border-[#E5B6C3]/20 grid grid-cols-2 gap-3">
                  {[["", "Pago seguro"], ["", "Envío rápido"], ["", "Devoluciones"], ["", "Mejor precio"]].map(([icon, label]) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-sm">{icon}</span>
                      <span className="text-xs text-black/35">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </div>
    </div>
  );
}
