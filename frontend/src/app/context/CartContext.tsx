import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CartItem {
  productId: string;
  quantity: number;
  selectedSite: string;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (productId: string, site: string, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

// Clave en localStorage: separada por usuario para que cada uno tenga su carrito
function cartKey(userId: string | null) {
  return userId ? `lookaly_cart_${userId}` : 'lookaly_cart_guest';
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);

  // Cargar carrito del usuario actual desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(cartKey(user?.id ?? null));
      setItems(saved ? JSON.parse(saved) : []);
    } catch {
      setItems([]);
    }
  }, [user?.id]); // se re-ejecuta al cambiar de usuario (login/logout)

  // Persistir carrito en localStorage en cada cambio
  useEffect(() => {
    localStorage.setItem(cartKey(user?.id ?? null), JSON.stringify(items));
  }, [items, user?.id]);

  const addItem = useCallback((productId: string, site: string, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === productId && i.selectedSite === site);
      if (existing) {
        return prev.map(i =>
          i.productId === productId && i.selectedSite === site
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [...prev, { productId, quantity: qty, selectedSite: site }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setItems(prev =>
      prev.map(i =>
        i.productId === productId
          ? { ...i, quantity: Math.max(1, i.quantity + delta) }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
