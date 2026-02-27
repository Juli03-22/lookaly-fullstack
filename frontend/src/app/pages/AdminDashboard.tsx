import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import MarkdownTextarea from '../components/MarkdownTextarea';
import { useAuth, avatarColor, avatarInitial } from '../context/AuthContext';
import {
  Shield, Users, UserCheck, UserX, Crown, LogOut, Trash2, RefreshCw,
  Package, ShoppingBag, Plus, Pencil, X, Check, ChevronDown, ImagePlus,
  ToggleLeft, ToggleRight, AlertCircle, Monitor, Download,
  CheckCircle, Zap, Lock,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string; name: string; email: string;
  is_active: boolean; is_admin: boolean; created_at: string;
  role?: string | null; totp_enabled?: boolean;
}

interface ProductImage {
  id: string; url: string; is_primary: boolean; sort_order: number;
}

interface ProductRow {
  id: string; name: string; brand: string;
  category: 'maquillaje' | 'piel' | 'cuerpo';
  subcategory?: string; description: string;
  image: string; unit_price?: number; stock: number;
  sku?: string; is_active: boolean; rating: number; reviews: number;
  images: ProductImage[];
  prices?: Array<{ id: string; site: string; price: number; url: string; availability: string }>;
}

interface BrandRow {
  id: string; name: string;
}

interface OrderItem {
  id: string; product_id?: string; product_name?: string;
  product_brand?: string; quantity: number;
  unit_price: number; subtotal: number;
}

interface OrderRow {
  id: string; user_id?: string; status: string;
  shipping_address?: string; total: number;
  order_items: OrderItem[]; created_at: string; paid_at?: string;
}

type Tab = 'resumen' | 'productos' | 'pedidos' | 'usuarios' | 'seguridad' | 'ventas';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', paid: 'Pagado', shipped: 'Enviado',
  delivered: 'Entregado', cancelled: 'Cancelado',
};
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  paid: 'bg-green-50 text-green-700',
  shipped: 'bg-blue-50 text-blue-700',
  delivered: 'bg-[#4A7C59]/10 text-[#4A7C59]',
  cancelled: 'bg-red-50 text-red-400',
};

const CATEGORY_OPTIONS = ['maquillaje', 'piel', 'cuerpo'];
const SUBCATEGORY_OPTIONS: Record<string, string[]> = {
  maquillaje: ['labios', 'ojos', 'rostro', 'base', 'corrector', 'polvo', 'rubor', 'bronceador', 'iluminador', 'contorno', 'uñas', 'cejas', 'pestañas'],
  piel:       ['hidratante', 'limpiador', 'sérum', 'mascarilla', 'protector solar', 'exfoliante', 'tónico', 'contorno de ojos', 'aceite facial'],
  cuerpo:     ['loción', 'perfume', 'jabón', 'exfoliante corporal', 'aceite corporal', 'desodorante', 'crema de manos'],
};
const EMPTY_FORM: Partial<ProductRow> = {
  name: '', brand: '', category: 'maquillaje', subcategory: '', description: '',
  image: '', unit_price: undefined, stock: 0, sku: '', is_active: true,
};

// ── Store price comparisons ───────────────────────────────────────────────────
const STORE_NAMES = ['Amazon', 'Mercado Libre', 'Liverpool', 'Palacio de Hierro', 'Tienda principal'] as const;
type StoreName = typeof STORE_NAMES[number];
interface PriceEntry { id?: string; enabled: boolean; price: string; url: string; availability: 'in-stock' | 'low-stock' | 'out-of-stock'; }
const emptyPriceEntries = (): Record<string, PriceEntry> =>
  Object.fromEntries(STORE_NAMES.map(s => [s, { enabled: false, price: '', url: '', availability: 'in-stock' as const }]));

// ── Role system ───────────────────────────────────────────────────────────────────
const ROLE_TABS: Record<string, Tab[]> = {
  gestor_inventario: ['productos'],
  it:                ['seguridad'],
  analista:          ['resumen'],
  vendedor:          ['ventas'],
  administrativo:    ['usuarios'],
};
const ROLE_LABELS: Record<string, string> = {
  gestor_inventario: 'Gestor inventario',
  it:                'IT / Seguridad',
  analista:          'Analista',
  vendedor:          'Vendedor',
  administrativo:    'Administrativo',
};
const ROLE_COLORS: Record<string, string> = {
  gestor_inventario: '#4A6FA5',
  it:                '#4A7C59',
  analista:          '#8B6914',
  vendedor:          '#9E4466',
  administrativo:    '#7D3150',
};
const TAB_LABELS: Record<Tab, string> = {
  resumen: 'Resumen', productos: 'Productos', pedidos: 'Pedidos',
  usuarios: 'Usuarios', seguridad: 'Seguridad', ventas: 'Ventas',
};

// ─── Main component ───────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('resumen');

  // Users
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Products
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productForm, setProductForm] = useState<Partial<ProductRow>>(EMPTY_FORM);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productSaving, setProductSaving] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [imageAdding, setImageAdding] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [productJustCreated, setProductJustCreated] = useState(false);
  const [imageUrlMode, setImageUrlMode] = useState(false); // false = subir archivo, true = URL externa
  const [priceEntries, setPriceEntries] = useState<Record<string, PriceEntry>>(emptyPriceEntries());

  // Orders
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Ventas (tab for vendedor role) — simplified product form
  const [ventasForm, setVentasForm] = useState({
    name: '', brand: '', category: 'maquillaje' as 'maquillaje' | 'piel' | 'cuerpo',
    description: '', image: '', unit_price: '' as string | number,
  });
  const [ventasSaving, setVentasSaving] = useState(false);
  const [ventasSuccess, setVentasSuccess] = useState(false);

  // Brands
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [brandAdding, setBrandAdding] = useState(false);
  const [showBrandsPanel, setShowBrandsPanel] = useState(false);

  // Global error
  const [error, setError] = useState<string | null>(null);

  // Guard
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!user.is_admin && !user.role) { navigate('/'); return; }
  }, [user, navigate]);

  // Set initial tab based on role (for role-only staff)
  useEffect(() => {
    if (user && !user.is_admin && user.role) {
      const allowed = ROLE_TABS[user.role] ?? [];
      if (allowed.length) setTab(allowed[0]);
    }
  }, [user]);

  // ── Fetch helpers ───────────────────────────────────────────────────────────

  const api = useCallback(async (path: string, opts?: RequestInit) => {
    const res = await fetch(path, {
      ...opts,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts?.headers },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail ?? `Error ${res.status}`);
    }
    return res.status === 204 ? null : res.json();
  }, [token]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true); setError(null);
    try { setUsers(await api('/api/users')); }
    catch (e) { setError((e as Error).message); }
    finally { setUsersLoading(false); }
  }, [api]);

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true); setError(null);
    try {
      const data = await api('/api/products?size=100');
      setProducts(data.items ?? []);
    }
    catch (e) { setError((e as Error).message); }
    finally { setProductsLoading(false); }
  }, [api]);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true); setError(null);
    try { const data = await api('/api/orders/admin/all?size=100'); setOrders(data.items ?? []); }
    catch (e) { setError((e as Error).message); }
    finally { setOrdersLoading(false); }
  }, [api]);

  const fetchBrands = useCallback(async () => {
    setBrandsLoading(true);
    try { setBrands(await api('/api/brands')); }
    catch { /* silencioso */ }
    finally { setBrandsLoading(false); }
  }, [api]);

  // Load data per tab
  useEffect(() => {
    if (!token) return;
    if (tab === 'usuarios' || tab === 'resumen') fetchUsers();
    if (tab === 'productos' || tab === 'resumen') fetchProducts();
    if (tab === 'pedidos'   || tab === 'resumen') fetchOrders();
    if (tab === 'productos' || tab === 'ventas') fetchBrands();
  }, [tab, token]);

  // ── Users ───────────────────────────────────────────────────────────────────

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    setDeletingUserId(userId);
    try {
      await api(`/api/users/${userId}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch { alert('Error al eliminar el usuario'); }
    finally { setDeletingUserId(null); }
  };

  const handleSetUserRole = async (userId: string, role: string | null) => {
    try {
      const updated = await api(`/api/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    } catch (e) { alert((e as Error).message); }
  };

  const handleToggleUserActive = async (userId: string, isActive: boolean) => {
    try {
      const updated = await api(`/api/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive }),
      });
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    } catch (e) { alert((e as Error).message); }
  };

  const downloadCSV = (filename: string, rows: Record<string, unknown>[]) => {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map(r =>
      keys.map(k => JSON.stringify(r[k] ?? '')).join(','),
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleVentasSubmit = async () => {
    if (!ventasForm.name || !ventasForm.brand || !ventasForm.description) {
      alert('Nombre, marca y descripci\u00f3n son obligatorios'); return;
    }
    setVentasSaving(true);
    try {
      await api('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          ...ventasForm,
          unit_price: ventasForm.unit_price !== '' ? Number(ventasForm.unit_price) : undefined,
          stock: 0, is_active: true,
        }),
      });
      setVentasSuccess(true);
      setVentasForm({ name: '', brand: '', category: 'maquillaje', description: '', image: '', unit_price: '' });
      setTimeout(() => setVentasSuccess(false), 3500);
    } catch (e) { alert((e as Error).message); }
    finally { setVentasSaving(false); }
  };

  const openNewProduct = () => {
    setEditingProduct(null);
    setProductForm(EMPTY_FORM);
    setNewImageUrl('');
    setProductJustCreated(false);
    setImageUrlMode(false);
    setPriceEntries(emptyPriceEntries());
    setShowProductModal(true);
  };

  const openEditProduct = (p: ProductRow) => {
    setEditingProduct(p);
    setProductForm({ ...p });
    setNewImageUrl('');
    setProductJustCreated(false);
    setImageUrlMode(false);
    // Init price entries from product's existing prices
    const entries = emptyPriceEntries();
    for (const pr of (p.prices ?? [])) {
      if (STORE_NAMES.includes(pr.site as StoreName)) {
        entries[pr.site] = { id: pr.id, enabled: true, price: String(pr.price), url: pr.url || '', availability: (pr.availability as 'in-stock' | 'low-stock' | 'out-of-stock') || 'in-stock' };
      }
    }
    setPriceEntries(entries);
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.brand || !productForm.description) {
      alert('Nombre, marca y descripción son obligatorios'); return;
    }
    setProductSaving(true);
    try {
      let productId: string;
      if (editingProduct) {
        const updated = await api(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(productForm),
        });
        productId = editingProduct.id;
        setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      } else {
        const created = await api('/api/products', {
          method: 'POST',
          body: JSON.stringify(productForm),
        });
        productId = created.id;
        setProducts(prev => [created, ...prev]);
        setEditingProduct({ ...created, images: created.images ?? [] });
        setProductJustCreated(true);
      }

      // Sync price comparisons
      const updatedEntries = { ...priceEntries };
      for (const store of STORE_NAMES) {
        const entry = priceEntries[store];
        const priceVal = Number(entry.price);
        if (entry.enabled && priceVal > 0) {
          const payload = {
            site: store, price: priceVal, url: entry.url || '#',
            currency: 'MXN', availability: entry.availability, product_id: productId,
          };
          if (entry.id) {
            await api(`/api/prices/${entry.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
          } else {
            const created = await api('/api/prices', { method: 'POST', body: JSON.stringify(payload) });
            updatedEntries[store] = { ...entry, id: created.id };
          }
        } else if (!entry.enabled && entry.id) {
          try { await api(`/api/prices/${entry.id}`, { method: 'DELETE' }); } catch { /* silencioso */ }
          updatedEntries[store] = { ...entry, id: undefined };
        }
      }
      setPriceEntries(updatedEntries);

      if (editingProduct) setShowProductModal(false);
    } catch (e) { alert((e as Error).message); }
    finally { setProductSaving(false); }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await api(`/api/products/${productId}`, { method: 'DELETE' });
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (e) { alert((e as Error).message); }
  };

  const handleToggleActive = async (p: ProductRow) => {
    try {
      const updated = await api(`/api/products/${p.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !p.is_active }),
      });
      setProducts(prev => prev.map(x => x.id === updated.id ? updated : x));
    } catch (e) { alert((e as Error).message); }
  };

  const handleAddImage = async () => {
    if (!editingProduct || !newImageUrl.trim()) return;
    setImageAdding(true);
    try {
      const img = await api(`/api/products/${editingProduct.id}/images`, {
        method: 'POST',
        body: JSON.stringify({ url: newImageUrl.trim(), is_primary: editingProduct.images.length === 0 }),
      });
      setEditingProduct(prev => prev ? { ...prev, images: [...prev.images, img] } : prev);
      setProductForm(prev => ({ ...prev, images: [...(prev.images ?? []), img] }));
      setNewImageUrl('');
    } catch (e) { alert((e as Error).message); }
    finally { setImageAdding(false); }
  };

  const handleUploadFile = async (file: File) => {
    if (!editingProduct) return;
    setImageUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(`/api/products/${editingProduct.id}/images/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail ?? 'Error al subir'); }
      const img = await res.json();
      setEditingProduct(prev => prev ? { ...prev, images: [...prev.images, img] } : prev);
      setProductForm(prev => ({ ...prev, images: [...(prev.images ?? []), img] }));
    } catch (e) { alert((e as Error).message); }
    finally { setImageUploading(false); }
  };

  const handleSetPrimary = async (imageId: string) => {
    if (!editingProduct) return;
    try {
      const updated = await api(`/api/products/${editingProduct.id}/images/${imageId}/set-primary`, { method: 'POST' });
      const newImages = (editingProduct.images ?? []).map(img =>
        ({ ...img, is_primary: img.id === updated.id })
      );
      setEditingProduct(prev => prev ? { ...prev, images: newImages } : prev);
    } catch (e) { alert((e as Error).message); }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!editingProduct) return;
    try {
      await api(`/api/products/${editingProduct.id}/images/${imageId}`, { method: 'DELETE' });
      const newImages = editingProduct.images.filter(img => img.id !== imageId);
      setEditingProduct(prev => prev ? { ...prev, images: newImages } : prev);
    } catch (e) { alert((e as Error).message); }
  };

  // ── Brands ─────────────────────────────────────────────────────────────────

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return;
    setBrandAdding(true);
    try {
      const brand = await api('/api/brands', { method: 'POST', body: JSON.stringify({ name: newBrandName.trim() }) });
      setBrands(prev => [...prev, brand].sort((a, b) => a.name.localeCompare(b.name)));
      setNewBrandName('');
    } catch (e) { alert((e as Error).message); }
    finally { setBrandAdding(false); }
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (!confirm('¿Eliminar esta marca?')) return;
    try {
      await api(`/api/brands/${brandId}`, { method: 'DELETE' });
      setBrands(prev => prev.filter(b => b.id !== brandId));
    } catch (e) { alert((e as Error).message); }
  };

  // ── Orders ──────────────────────────────────────────────────────────────────

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {    setUpdatingOrderId(orderId);
    try {
      const updated = await api(`/api/orders/admin/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
    } catch (e) { alert((e as Error).message); }
    finally { setUpdatingOrderId(null); }
  };

  // ── Stats ───────────────────────────────────────────────────────────────────

  const visibleTabs: Tab[] = user?.is_admin
    ? ['resumen', 'productos', 'pedidos', 'usuarios', 'seguridad', 'ventas']
    : (ROLE_TABS[user?.role ?? ''] ?? []);

  const stats = [
    { label: 'Usuarios',  value: users.length,    Icon: Users,       color: '#7D3150' },
    { label: 'Productos', value: products.length,  Icon: Package,     color: '#4A6FA5' },
    { label: 'Pedidos',   value: orders.length,    Icon: ShoppingBag, color: '#4A7C59' },
    { label: 'Activos',   value: users.filter(u => u.is_active).length, Icon: UserCheck, color: '#8B6914' },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FDF8F9]" style={{ fontFamily: "'Lexend Zetta', sans-serif" }}>

      {/* Header */}
      <header className="bg-[#E5B6C3]/70 backdrop-blur-xl border-b border-[#E5B6C3]/40 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#7D3150] flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#7D3150] font-semibold">Lookaly Admin</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Navigation tabs */}
            <nav className="hidden md:flex items-center gap-1">
              {visibleTabs.map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-full text-[10px] tracking-[0.15em] uppercase transition-all ${
                    tab === t
                      ? 'bg-[#7D3150] text-white shadow-sm'
                      : 'text-[#7D3150] hover:bg-[#7D3150]/10'
                  }`}
                >
                  {TAB_LABELS[t]}
                </button>
              ))}
            </nav>
            <span className="text-[11px] text-[#7D3150]/60 hidden lg:block">{user?.email}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] tracking-widest uppercase text-[#7D3150] hover:bg-[#7D3150]/10 transition-colors"
            >
              <LogOut size={13} />Salir
            </button>
          </div>
        </div>
        {/* Mobile tab bar */}
        <div className="md:hidden flex border-t border-[#E5B6C3]/30 overflow-x-auto">
          {visibleTabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-[9px] tracking-widest uppercase transition-colors whitespace-nowrap px-2 ${
                tab === t ? 'text-[#7D3150] border-b-2 border-[#7D3150]' : 'text-[#7D3150]/50'
              }`}
            >{TAB_LABELS[t]}</button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Global error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            <AlertCircle size={16} />{error}
            <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
          </div>
        )}

        {/* ═══ RESUMEN ════════════════════════════════════════════════════════ */}
        {tab === 'resumen' && (
          <div>
            <h1 className="text-[11px] tracking-[0.25em] uppercase text-[#7D3150]/60 mb-6">Panel general</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map(({ label, value, Icon, color }) => (
                <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5B6C3]/30 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                    <Icon size={20} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#3a1a28]">{value}</p>
                    <p className="text-[10px] tracking-widest uppercase text-[#7D3150]/60">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick access cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                { t: 'productos' as Tab, label: 'Gestionar productos', Icon: Package,     sub: `${products.length} en catálogo` },
                { t: 'pedidos'   as Tab, label: 'Ver pedidos',         Icon: ShoppingBag, sub: `${orders.filter(o => o.status === 'pending').length} pendientes` },
                { t: 'usuarios'  as Tab, label: 'Usuarios',            Icon: Users,       sub: `${users.length} registrados` },
              ]).map(({ t, label, Icon, sub }) => (
                <button key={t} onClick={() => setTab(t)}
                  className="bg-white border border-[#E5B6C3]/30 rounded-2xl p-5 text-left hover:border-[#7D3150]/30 hover:shadow-md transition-all group"
                >
                  <Icon size={22} className="text-[#7D3150] mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-semibold text-[#3a1a28]">{label}</p>
                  <p className="text-[11px] text-[#7D3150]/50 mt-1">{sub}</p>
                </button>
              ))}
            </div>
            {/* CSV export — visible for admin and analista */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => downloadCSV('productos.csv', products as unknown as Record<string, unknown>[])}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] tracking-widest uppercase border border-[#E5B6C3]/40 text-[#7D3150] hover:bg-[#E5B6C3]/20 transition-colors"
              ><Download size={13} />Exportar productos CSV</button>
              <button
                onClick={() => downloadCSV('pedidos.csv', orders as unknown as Record<string, unknown>[])}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] tracking-widest uppercase border border-[#E5B6C3]/40 text-[#7D3150] hover:bg-[#E5B6C3]/20 transition-colors"
              ><Download size={13} />Exportar pedidos CSV</button>
            </div>          </div>
        )}

        {/* ═══ PRODUCTOS ══════════════════════════════════════════════════════ */}
        {tab === 'productos' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-[11px] tracking-[0.25em] uppercase text-[#7D3150]/60">Catálogo de productos</h1>
              <div className="flex gap-2">
                <button onClick={fetchProducts}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] text-[#7D3150] hover:bg-[#E5B6C3]/30 transition-colors"
                ><RefreshCw size={12} />Actualizar</button>
                <button onClick={openNewProduct}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] tracking-widest uppercase bg-[#7D3150] text-white hover:bg-[#5C2238] transition-colors shadow-sm"
                ><Plus size={13} />Nuevo producto</button>
              </div>
            </div>

            {/* ── Brands panel ─────────────────────────────────────────── */}
            <div className="mb-6">
              <button
                onClick={() => setShowBrandsPanel(v => !v)}
                className="flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase text-[#7D3150]/70 hover:text-[#7D3150] mb-2 transition-colors"
              >
                <Package size={12} />
                Gestionar marcas
                <ChevronDown size={12} className={`transition-transform ${showBrandsPanel ? 'rotate-180' : ''}`} />
                <span className="ml-1 px-1.5 py-0.5 bg-[#E5B6C3]/40 rounded-full text-[9px]">{brands.length}</span>
              </button>

              {showBrandsPanel && (
                <div className="bg-white border border-[#E5B6C3]/30 rounded-2xl p-4">
                  {/* Add brand */}
                  <div className="flex gap-2 mb-4">
                    <input
                      value={newBrandName}
                      onChange={e => setNewBrandName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddBrand()}
                      placeholder="Nueva marca..."
                      className="flex-1 px-3 py-2 rounded-xl border border-[#E5B6C3]/40 text-[13px] text-[#3a1a28] focus:outline-none focus:ring-2 focus:ring-[#7D3150]/25 bg-[#FDF8F9]"
                    />
                    <button
                      onClick={handleAddBrand}
                      disabled={brandAdding || !newBrandName.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7D3150] text-white text-[11px] tracking-widest uppercase hover:bg-[#5C2238] disabled:opacity-50 transition-colors"
                    ><Plus size={13} />{brandAdding ? 'Agregando...' : 'Agregar'}</button>
                  </div>

                  {/* Brand list */}
                  {brandsLoading ? (
                    <p className="text-[11px] text-[#7D3150]/40 text-center py-2">Cargando...</p>
                  ) : brands.length === 0 ? (
                    <p className="text-[11px] text-[#7D3150]/40 text-center py-2">No hay marcas registradas</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {brands.map(b => (
                        <div key={b.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FDF8F9] border border-[#E5B6C3]/30 rounded-full group">
                          <span className="text-[12px] text-[#3a1a28]">{b.name}</span>
                          <button
                            onClick={() => handleDeleteBrand(b.id)}
                            className="text-[#7D3150]/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          ><X size={11} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {productsLoading ? <Spinner /> : products.length === 0 ? <Empty text="No hay productos. ¡Agrega el primero!" /> : (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5B6C3]/30 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#FDF8F9] border-b border-[#E5B6C3]/20">
                        {['Producto', 'Categoría', 'Precio', 'Stock', 'Estado', 'Acciones'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-[9px] tracking-[0.18em] uppercase text-[#7D3150]/60 font-medium whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5B6C3]/15">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-[#FDF8F9]/80 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.images?.[0]?.url ?? p.image}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover bg-neutral-100 flex-shrink-0"
                                onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                              />
                              <div>
                                <p className="font-medium text-[#3a1a28] text-[13px] leading-tight">{p.name}</p>
                                <p className="text-[11px] text-[#7D3150]/50">{p.brand}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[9px] tracking-widest uppercase bg-[#E5B6C3]/30 text-[#7D3150]">
                              {p.category}
                            </span>
                            {p.subcategory && <p className="text-[10px] text-[#7D3150]/40 mt-0.5">{p.subcategory}</p>}
                          </td>
                          <td className="px-5 py-3 text-[13px] text-[#3a1a28]">
                            {p.unit_price != null ? `$${p.unit_price.toLocaleString('es-MX')}` : <span className="text-[#7D3150]/30">—</span>}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-[12px] font-medium ${p.stock === 0 ? 'text-red-400' : p.stock < 5 ? 'text-yellow-600' : 'text-[#4A7C59]'}`}>
                              {p.stock}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <button onClick={() => handleToggleActive(p)} className="flex items-center gap-1.5">
                              {p.is_active
                                ? <><ToggleRight size={18} className="text-[#4A7C59]" /><span className="text-[10px] text-[#4A7C59]">Activo</span></>
                                : <><ToggleLeft size={18} className="text-neutral-300" /><span className="text-[10px] text-neutral-400">Inactivo</span></>
                              }
                            </button>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEditProduct(p)}
                                className="p-1.5 rounded-full text-[#7D3150]/50 hover:bg-[#E5B6C3]/30 hover:text-[#7D3150] transition-colors"
                              ><Pencil size={14} /></button>
                              <button onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 rounded-full text-red-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                              ><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ PEDIDOS ════════════════════════════════════════════════════════ */}
        {tab === 'pedidos' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-[11px] tracking-[0.25em] uppercase text-[#7D3150]/60">Gestión de pedidos</h1>
              <button onClick={fetchOrders}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] text-[#7D3150] hover:bg-[#E5B6C3]/30 transition-colors"
              ><RefreshCw size={12} />Actualizar</button>
            </div>

            {ordersLoading ? <Spinner /> : orders.length === 0 ? <Empty text="No hay pedidos aún" /> : (
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl border border-[#E5B6C3]/30 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 flex flex-wrap items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-[#7D3150]/40 tracking-widest uppercase">Pedido</p>
                        <p className="text-[13px] font-mono text-[#3a1a28] truncate">{order.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-[#7D3150]/40">Total</p>
                        <p className="text-base font-semibold text-[#3a1a28]">${Number(order.total).toLocaleString('es-MX')}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#7D3150]/40 mb-1">Status</p>
                        <select
                          value={order.status}
                          disabled={updatingOrderId === order.id}
                          onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                          className={`text-[11px] px-2.5 py-1 rounded-full border-0 font-medium cursor-pointer focus:ring-2 focus:ring-[#7D3150]/30 ${STATUS_COLORS[order.status] ?? 'bg-gray-50 text-gray-600'}`}
                        >
                          {Object.entries(STATUS_LABELS).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                      </div>
                      <div className="text-right text-[11px] text-[#7D3150]/40">
                        {new Date(order.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="p-1.5 rounded-full hover:bg-[#E5B6C3]/20 text-[#7D3150]/50 transition-colors"
                      >
                        <ChevronDown size={16} className={`transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    {expandedOrder === order.id && (
                      <div className="border-t border-[#E5B6C3]/20 px-6 py-4 bg-[#FDF8F9]">
                        {order.shipping_address && (
                          <p className="text-[11px] text-[#7D3150]/50 mb-3">📦 {order.shipping_address}</p>
                        )}
                        <div className="space-y-2">
                          {order.order_items.map(item => (
                            <div key={item.id} className="flex items-center justify-between text-[12px]">
                              <div>
                                <span className="text-[#3a1a28] font-medium">{item.product_name ?? 'Producto eliminado'}</span>
                                {item.product_brand && <span className="text-[#7D3150]/50 ml-2">{item.product_brand}</span>}
                                <span className="text-[#7D3150]/40 ml-2">×{item.quantity}</span>
                              </div>
                              <span className="text-[#3a1a28]">${Number(item.subtotal).toLocaleString('es-MX')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ USUARIOS ═══════════════════════════════════════════════════════ */}
        {tab === 'usuarios' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-[11px] tracking-[0.25em] uppercase text-[#7D3150]/60">Usuarios registrados</h1>
              <button onClick={fetchUsers}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] text-[#7D3150] hover:bg-[#E5B6C3]/30 transition-colors"
              ><RefreshCw size={12} />Actualizar</button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total',  value: users.length,                         Icon: Users,     color: '#7D3150' },
                { label: 'Activos', value: users.filter(u => u.is_active).length, Icon: UserCheck, color: '#4A7C59' },
                { label: 'Admins', value: users.filter(u => u.is_admin).length,  Icon: Crown,     color: '#8B6914' },
              ].map(({ label, value, Icon, color }) => (
                <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E5B6C3]/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#3a1a28]">{usersLoading ? '—' : value}</p>
                    <p className="text-[10px] tracking-widest uppercase text-[#7D3150]/60">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {usersLoading ? <Spinner /> : users.length === 0 ? <Empty text="No hay usuarios registrados" /> : (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5B6C3]/30 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#FDF8F9] border-b border-[#E5B6C3]/20">
                        {['Usuario', 'Email', 'Rol', 'Estado', 'Registro', 'Acción'].map(h => (
                          <th key={h} className="px-6 py-3 text-left text-[9px] tracking-[0.18em] uppercase text-[#7D3150]/60 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5B6C3]/15">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-[#FDF8F9]/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                style={{ backgroundColor: avatarColor(u.name) }}>
                                {avatarInitial(u.name)}
                              </div>
                              <span className="font-medium text-[#3a1a28] text-[13px]">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[#7D3150]/70 text-[12px]">{u.email}</td>
                          <td className="px-6 py-4">
                            {u.is_admin ? (
                              <Badge color="#8B6914" icon={<Crown size={10} />}>Super Admin</Badge>
                            ) : user?.is_admin ? (
                              <select
                                value={u.role ?? ''}
                                onChange={e => handleSetUserRole(u.id, e.target.value || null)}
                                className="text-[10px] border border-[#E5B6C3]/40 rounded-full px-2.5 py-0.5 text-[#7D3150] cursor-pointer bg-white focus:outline-none focus:ring-1 focus:ring-[#7D3150]/25"
                              >
                                <option value="">Usuario</option>
                                {Object.entries(ROLE_LABELS).map(([v, l]) => (
                                  <option key={v} value={v}>{l}</option>
                                ))}
                              </select>
                            ) : (
                              u.role
                                ? <Badge color={ROLE_COLORS[u.role] ?? '#7D3150'}>{ROLE_LABELS[u.role] ?? u.role}</Badge>
                                : <Badge color="#7D3150" icon={<Users size={10} />}>Usuario</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {u.is_active
                              ? <Badge color="#4A7C59" icon={<UserCheck size={10} />}>Activo</Badge>
                              : <Badge color="#ef4444" icon={<UserX size={10} />}>Inactivo</Badge>}
                          </td>
                          <td className="px-6 py-4 text-[#7D3150]/50 text-[12px]">
                            {new Date(u.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4">
                            {u.id !== user?.id && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleToggleUserActive(u.id, !u.is_active)}
                                  title={u.is_active ? 'Desactivar cuenta' : 'Activar cuenta'}
                                  className="p-1.5 rounded-full hover:bg-[#E5B6C3]/20 text-[#7D3150]/50 hover:text-[#7D3150] transition-colors"
                                >
                                  {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                                </button>
                                {user?.is_admin && (
                                  <button onClick={() => handleDeleteUser(u.id)} disabled={deletingUserId === u.id}
                                    className="p-1.5 rounded-full text-red-300 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                                  ><Trash2 size={14} /></button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ SEGURIDAD ═══════════════════════════════════════════════════════════════════ */}
        {tab === 'seguridad' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-[11px] tracking-[0.25em] uppercase text-[#7D3150]/60">Seguridad de cuentas</h1>
                <p className="text-[10px] text-[#7D3150]/40 mt-0.5">Vista de auditoría IT — solo lectura</p>
              </div>
              <button onClick={fetchUsers}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] text-[#7D3150] hover:bg-[#E5B6C3]/30 transition-colors"
              ><RefreshCw size={12} />Actualizar</button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: '2FA Activo', value: users.filter(u => u.totp_enabled).length,  Icon: Lock,    color: '#4A7C59' },
                { label: 'Sin 2FA',    value: users.filter(u => !u.totp_enabled).length, Icon: Monitor, color: '#8B6914' },
                { label: 'Inactivos',  value: users.filter(u => !u.is_active).length,    Icon: UserX,   color: '#ef4444' },
              ].map(({ label, value, Icon, color }) => (
                <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E5B6C3]/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[#3a1a28]">{usersLoading ? '—' : value}</p>
                    <p className="text-[10px] tracking-widest uppercase text-[#7D3150]/60">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {usersLoading ? <Spinner /> : (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5B6C3]/30 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#FDF8F9] border-b border-[#E5B6C3]/20">
                        {['Usuario', 'Email', '2FA', 'Tipo', 'Estado', 'Registro'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-[9px] tracking-[0.18em] uppercase text-[#7D3150]/60 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5B6C3]/15">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-[#FDF8F9]/80 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                                style={{ backgroundColor: avatarColor(u.name) }}>{avatarInitial(u.name)}</div>
                              <span className="text-[13px] text-[#3a1a28] font-medium">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-[12px] text-[#7D3150]/60">{u.email}</td>
                          <td className="px-5 py-3">
                            {u.totp_enabled
                              ? <Badge color="#4A7C59" icon={<Lock size={9} />}>Activo</Badge>
                              : <Badge color="#8B6914">Sin 2FA</Badge>}
                          </td>
                          <td className="px-5 py-3">
                            {u.is_admin
                              ? <Badge color="#8B6914" icon={<Crown size={9} />}>Admin</Badge>
                              : u.role
                              ? <Badge color={ROLE_COLORS[u.role] ?? '#7D3150'}>{ROLE_LABELS[u.role] ?? u.role}</Badge>
                              : <Badge color="#7D3150">Usuario</Badge>}
                          </td>
                          <td className="px-5 py-3">
                            {u.is_active
                              ? <Badge color="#4A7C59" icon={<UserCheck size={9} />}>Activo</Badge>
                              : <Badge color="#ef4444" icon={<UserX size={9} />}>Inactivo</Badge>}
                          </td>
                          <td className="px-5 py-3 text-[11px] text-[#7D3150]/40">
                            {new Date(u.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ VENTAS ═════════════════════════════════════════════════════════════════════════ */}
        {tab === 'ventas' && (
          <div className="max-w-xl mx-auto">
            <div className="mb-8 text-center">
              <div className="w-12 h-12 rounded-full bg-[#9E4466]/10 flex items-center justify-center mx-auto mb-3">
                <Zap size={22} className="text-[#9E4466]" />
              </div>
              <h1 className="text-[11px] tracking-[0.25em] uppercase text-[#7D3150]/60">Publicar producto</h1>
              <p className="text-[11px] text-[#7D3150]/40 mt-1">Formulario optimizado para vendedores</p>
            </div>

            {ventasSuccess && (
              <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                <CheckCircle size={16} />¡Producto publicado correctamente!
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-[#E5B6C3]/30 p-6 space-y-5">
              <Field label="Nombre del producto *">
                <input
                  value={ventasForm.name}
                  onChange={e => setVentasForm(f => ({ ...f, name: e.target.value }))}
                  className={inputCls} placeholder="Ej: Labial Matte Rouge Allure" autoFocus
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Marca *">
                  <select
                    value={ventasForm.brand}
                    onChange={e => setVentasForm(f => ({ ...f, brand: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">Selecciona una marca...</option>
                    {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </Field>
                <Field label="Categoría *">
                  <select
                    value={ventasForm.category}
                    onChange={e => setVentasForm(f => ({ ...f, category: e.target.value as typeof ventasForm.category }))}
                    className={inputCls}
                  >
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Descripción *">
                <MarkdownTextarea
                  value={ventasForm.description}
                  onChange={v => setVentasForm(f => ({ ...f, description: v }))}
                  rows={4}
                  placeholder="Describe el producto brevemente..."
                />
              </Field>
              <Field label="Precio base (MXN)">
                <input
                  type="number" min={0} step={0.01}
                  value={ventasForm.unit_price}
                  onChange={e => setVentasForm(f => ({ ...f, unit_price: e.target.value }))}
                  className={inputCls} placeholder="0.00"
                />
              </Field>
              <Field label="URL de imagen">
                <input
                  value={ventasForm.image}
                  onChange={e => setVentasForm(f => ({ ...f, image: e.target.value }))}
                  className={inputCls} placeholder="https://..."
                />
              </Field>
              <button
                onClick={handleVentasSubmit}
                disabled={ventasSaving}
                className="w-full py-3.5 rounded-xl bg-[#7D3150] text-white text-[11px] tracking-[0.2em] uppercase font-semibold hover:bg-[#5C2238] disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Zap size={15} />{ventasSaving ? 'Publicando...' : 'Publicar producto'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ═══ PRODUCT MODAL ══════════════════════════════════════════════════════ */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5B6C3]/20">
              <h2 className="text-[11px] tracking-[0.2em] uppercase text-[#7D3150] font-semibold">
                {editingProduct ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button onClick={() => { setShowProductModal(false); setProductJustCreated(false); }}
                className="p-1.5 rounded-full hover:bg-[#E5B6C3]/20 text-[#7D3150]/50 transition-colors"
              ><X size={16} /></button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {productJustCreated && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[12px] text-emerald-700">
                  <CheckCircle size={15} className="flex-shrink-0" />
                  <span><strong>Producto creado.</strong> Ahora puedes subir fotos desde la sección de galería abajo.</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nombre *">
                  <input value={productForm.name ?? ''} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))}
                    className={inputCls} placeholder="Ej: Flawless Filter" />
                </Field>
                <Field label="Marca *">
                  <select value={productForm.brand ?? ''} onChange={e => setProductForm(p => ({ ...p, brand: e.target.value }))}
                    className={inputCls}>
                    <option value="">Selecciona una marca...</option>
                    {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Categoría *">
                  <select value={productForm.category ?? 'maquillaje'} onChange={e => setProductForm(p => ({ ...p, category: e.target.value as ProductRow['category'] }))}
                    className={inputCls}>
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Subcategoría">
                  <select value={productForm.subcategory ?? ''} onChange={e => setProductForm(p => ({ ...p, subcategory: e.target.value }))}
                    className={inputCls}>
                    <option value="">— ninguna —</option>
                    {(SUBCATEGORY_OPTIONS[productForm.category ?? 'maquillaje'] ?? []).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Descripción *">
                <MarkdownTextarea
                  value={productForm.description ?? ''}
                  onChange={v => setProductForm(p => ({ ...p, description: v }))}
                  rows={3}
                  placeholder="Descripción del producto..."
                />
              </Field>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Precio base (MXN)">
                  <input type="number" min={0} step={0.01}
                    value={productForm.unit_price ?? ''} onChange={e => setProductForm(p => ({ ...p, unit_price: e.target.value ? Number(e.target.value) : undefined }))}
                    className={inputCls} placeholder="0.00" />
                </Field>
                <Field label="Stock">
                  <input type="number" min={0}
                    value={productForm.stock ?? 0} onChange={e => setProductForm(p => ({ ...p, stock: Number(e.target.value) }))}
                    className={inputCls} />
                </Field>
                <Field label="SKU">
                  <div className={`${inputCls} flex items-center gap-2 cursor-default select-none bg-[#F5F0F2]`}>
                    <span className="text-[#7D3150]/40 text-[11px] tracking-widest">{productForm.sku ?? <span className="italic text-[#7D3150]/30">auto</span>}</span>
                  </div>
                </Field>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setProductForm(p => ({ ...p, is_active: !p.is_active }))}>
                  {productForm.is_active
                    ? <ToggleRight size={26} className="text-[#4A7C59]" />
                    : <ToggleLeft size={26} className="text-neutral-300" />}
                </button>
                <span className="text-[12px] text-[#3a1a28]">
                  {productForm.is_active ? 'Producto activo (visible en tienda)' : 'Producto inactivo (oculto)'}
                </span>
              </div>

              {/* Comparativas de tiendas — editing only */}
              {editingProduct && (
                <div className="border-t border-[#E5B6C3]/20 pt-4">
                  <p className="text-[10px] tracking-[0.18em] uppercase text-[#7D3150]/60 mb-3">Comparativas de tiendas</p>
                  <div className="space-y-1.5">
                    {STORE_NAMES.map(store => {
                      const entry = priceEntries[store] ?? { enabled: false, price: '', url: '', availability: 'in-stock' as const };
                      return (
                        <div key={store} className={`rounded-xl border transition-colors ${
                          entry.enabled ? 'border-[#E5B6C3]/50 bg-[#FDF8F9]' : 'border-[#E5B6C3]/20 bg-white/40'
                        }`}>
                          <div className="flex items-center gap-2.5 px-3 py-2">
                            {/* Switch */}
                            <button type="button"
                              onClick={() => setPriceEntries(prev => ({ ...prev, [store]: { ...prev[store], enabled: !prev[store].enabled } }))}
                              className={`relative w-8 h-[18px] rounded-full transition-colors flex-shrink-0 ${
                                entry.enabled ? 'bg-[#7D3150]' : 'bg-[#E5B6C3]/50'
                              }`}>
                              <span className={`absolute top-[2px] left-[2px] w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${
                                entry.enabled ? 'translate-x-[14px]' : 'translate-x-0'
                              }`} />
                            </button>
                            <span className="text-[12px] text-[#3a1a28] w-[130px] flex-shrink-0 font-medium">{store}</span>
                            {entry.enabled && (
                              <>
                                <div className="flex items-center">
                                  <span className="text-[11px] text-[#7D3150]/50 mr-1">$</span>
                                  <input type="number" min={0} step={0.01}
                                    value={entry.price}
                                    onChange={e => setPriceEntries(prev => ({ ...prev, [store]: { ...prev[store], price: e.target.value } }))}
                                    className="w-24 px-2 py-1 rounded-lg border border-[#E5B6C3]/40 text-[12px] text-[#3a1a28] focus:outline-none focus:ring-1 focus:ring-[#7D3150]/25 bg-white"
                                    placeholder="Precio" />
                                </div>
                                <input value={entry.url}
                                  onChange={e => setPriceEntries(prev => ({ ...prev, [store]: { ...prev[store], url: e.target.value } }))}
                                  className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-[#E5B6C3]/40 text-[11px] text-[#3a1a28] focus:outline-none focus:ring-1 focus:ring-[#7D3150]/25 bg-white"
                                  placeholder="https://..." />
                                <select value={entry.availability}
                                  onChange={e => setPriceEntries(prev => ({ ...prev, [store]: { ...prev[store], availability: e.target.value as 'in-stock' | 'low-stock' | 'out-of-stock' } }))}
                                  className="px-2 py-1 rounded-lg border border-[#E5B6C3]/40 text-[10px] text-[#3a1a28] focus:outline-none bg-white flex-shrink-0">
                                  <option value="in-stock">En stock</option>
                                  <option value="low-stock">Pocas</option>
                                  <option value="out-of-stock">Agotado</option>
                                </select>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-[#7D3150]/30 mt-1.5 tracking-widest uppercase">Guarda para aplicar. Las tiendas inactivas no aparecen en el comparador.</p>
                </div>
              )}

              {/* Image gallery — editing only */}
              {editingProduct && (
                <div className="border-t border-[#E5B6C3]/20 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] tracking-[0.18em] uppercase text-[#7D3150]/60">Galería de imágenes</p>
                    {/* Switch: Archivo ↔ URL externa */}
                    <div className="flex items-center gap-2 text-[10px] text-[#7D3150]/60">
                      <span className={!imageUrlMode ? 'text-[#7D3150] font-semibold' : ''}>Archivo</span>
                      <button
                        type="button"
                        onClick={() => setImageUrlMode(v => !v)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${
                          imageUrlMode ? 'bg-[#7D3150]' : 'bg-[#E5B6C3]/60'
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          imageUrlMode ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                      <span className={imageUrlMode ? 'text-[#7D3150] font-semibold' : ''}>URL externa</span>
                    </div>
                  </div>

                  {!imageUrlMode ? (
                    /* ── Modo subir archivo ── */
                    <label className={`flex flex-col items-center justify-center gap-2 w-full py-6 mb-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                      imageUploading
                        ? 'border-[#7D3150]/20 bg-[#7D3150]/5 cursor-wait'
                        : 'border-[#E5B6C3]/60 hover:border-[#7D3150]/40 hover:bg-[#FDF8F9]'
                    }`}>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        disabled={imageUploading}
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadFile(f);
                          e.target.value = '';
                        }}
                      />
                      {imageUploading
                        ? <><div className="w-5 h-5 border-2 border-[#7D3150]/40 border-t-[#7D3150] rounded-full animate-spin" /><span className="text-[11px] text-[#7D3150]/60">Procesando y subiendo...</span></>
                        : <><ImagePlus size={20} className="text-[#7D3150]/40" /><span className="text-[11px] text-[#7D3150]/60">Haz clic o arrastra una foto</span><span className="text-[9px] text-[#7D3150]/30 tracking-widest uppercase">JPEG · PNG · WEBP · máx 20 MB · recorte automático 1:1 · 800×800</span></>
                      }
                    </label>
                  ) : (
                    /* ── Modo URL externa ── */
                    <div className="flex gap-2 mb-3">
                      <input value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddImage()}
                        className={`${inputCls} flex-1`}
                        placeholder="https://example.com/imagen.jpg" />
                      <button onClick={handleAddImage} disabled={imageAdding || !newImageUrl.trim()}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#7D3150]/10 text-[#7D3150] hover:bg-[#7D3150]/20 disabled:opacity-40 transition-colors text-[11px] whitespace-nowrap"
                      ><ImagePlus size={14} />Agregar</button>
                    </div>
                  )}
                  {editingProduct.images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {editingProduct.images.map(img => (
                        <div key={img.id} className="relative group">
                          <img src={img.url} alt="" className="w-full aspect-square object-cover rounded-lg bg-neutral-100"
                            onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                          {img.is_primary && (
                            <span className="absolute top-1 left-1 bg-[#7D3150] text-white text-[8px] px-1.5 py-0.5 rounded-full tracking-widest uppercase">Principal</span>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                            {!img.is_primary && (
                              <button onClick={() => handleSetPrimary(img.id)}
                                className="p-1 bg-white/90 rounded-full text-[#7D3150]"><Check size={12} /></button>
                            )}
                            <button onClick={() => handleDeleteImage(img.id)}
                              className="p-1 bg-white/90 rounded-full text-red-500"><X size={12} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#E5B6C3]/20">
              <button onClick={() => { setShowProductModal(false); setProductJustCreated(false); }}
                className="px-4 py-2 rounded-full text-[11px] tracking-widest uppercase text-[#7D3150] hover:bg-[#E5B6C3]/20 transition-colors"
              >{productJustCreated ? 'Cerrar' : 'Cancelar'}</button>
              <button onClick={handleSaveProduct} disabled={productSaving}
                className="px-5 py-2 rounded-full text-[11px] tracking-widest uppercase bg-[#7D3150] text-white hover:bg-[#5C2238] disabled:opacity-50 transition-colors shadow-sm"
              >{productSaving ? 'Guardando...' : editingProduct ? 'Guardar cambios' : 'Crear producto'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small reusable components ────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2 rounded-xl border border-[#E5B6C3]/40 text-[13px] text-[#3a1a28] focus:outline-none focus:ring-2 focus:ring-[#7D3150]/25 bg-[#FDF8F9]';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.15em] uppercase text-[#7D3150]/60 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Badge({ children, color, icon }: { children: React.ReactNode; color: string; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] tracking-widest uppercase font-medium"
      style={{ backgroundColor: `${color}18`, color }}>
      {icon}{children}
    </span>
  );
}

function Spinner() {
  return <div className="py-16 text-center text-[11px] tracking-widest uppercase text-[#7D3150]/40">Cargando...</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="py-16 text-center text-[13px] text-[#7D3150]/40">{text}</div>;
}

