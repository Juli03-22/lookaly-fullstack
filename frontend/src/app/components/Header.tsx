import { Link, useNavigate } from 'react-router';
import { Search, ShoppingBag, User, Menu, X, LogOut, Shield } from 'lucide-react';
import { useState } from 'react';
import { useAuth, avatarColor, avatarInitial } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const navLinkClass =
  'text-[11px] tracking-[0.18em] uppercase hover:text-black/50 transition-colors font-normal';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const { count } = useCart();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMobileMenuOpen(false);
    } else {
      navigate('/search');
    }
  };

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-8">
      <div
        className="max-w-6xl mx-auto rounded-[38px] bg-[#E5B6C3]/65 backdrop-blur-xl border border-[#E5B6C3]/30 shadow-[0_4px_24px_0_rgba(180,100,130,0.12)]"
        style={{ fontFamily: "'Lexend Zetta', sans-serif" }}
      >
        <div className="flex items-center justify-between h-16 px-6 sm:px-8 relative">

          {/* Left Navigation — Desktop */}
          <nav className="hidden md:flex items-center gap-8 min-w-[200px]">
            <Link to="/products/maquillaje" className={navLinkClass}>Maquillaje</Link>
            <Link to="/products/cuerpo"     className={navLinkClass}>Cuerpo</Link>
            <Link to="/products/piel"       className={navLinkClass}>Piel</Link>
          </nav>

          {/* Mobile: hamburger */}
          <button
            className="md:hidden p-2 rounded-full hover:bg-black/5 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          {/* Center Logo */}
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 flex items-center"
          >
            <img src="/lookaly_one_line.png" alt="Lookaly.mx" className="h-8 sm:h-9 object-contain" />
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-[260px] justify-end">

            {/* Search — Desktop inline */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 bg-white/50 rounded-full px-4 py-2 border border-white/60 hover:border-white/80 transition-colors focus-within:border-white/80 focus-within:bg-white/60">
              <button type="submit" className="shrink-0">
                <Search className="w-3.5 h-3.5 text-black/35 hover:text-black/60 transition-colors" />
              </button>
              <input
                type="text"
                placeholder="¿Que belleza buscas?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-[10px] tracking-[0.08em] w-44 placeholder:text-black/35"
                style={{ fontFamily: "'Lexend Zetta', sans-serif" }}
              />
            </form>

            {/* Search icon — Mobile */}
            <button
              className="md:hidden p-2 rounded-full hover:bg-black/5 transition-colors"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search className="w-4 h-4 text-black/60" />
            </button>

            {/* Cart & User */}
            <Link
              to="/cart"
              className="relative p-2 rounded-full hover:bg-black/5 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#7D3150] text-white text-[9px] rounded-full flex items-center justify-center font-medium">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>

            {/* Avatar / Login */}
            {user ? (
              <div className="relative" onMouseEnter={() => setUserMenuOpen(true)} onMouseLeave={() => setUserMenuOpen(false)}>
                {/* Burbuja con inicial */}
                <button
                  onClick={() => navigate('/profile')}
                  className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-105 focus:outline-none"
                  style={{ backgroundColor: avatarColor(user.name) }}
                >
                  <span className="text-white text-sm font-light select-none"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {avatarInitial(user.name)}
                  </span>
                </button>

                {/* Dropdown al hover */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-xl border border-[#E5B6C3]/30 rounded-2xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-[#E5B6C3]/20">
                      <p className="text-xs font-medium text-black/70 truncate">{user.name}</p>
                      <p className="text-[10px] text-black/35 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-[11px] tracking-[0.1em] uppercase text-black/55 hover:text-black/80 hover:bg-black/5 transition-colors"
                      style={{ fontFamily: "'Lexend Zetta', sans-serif" }}
                    >
                      Mi perfil
                    </Link>
                    {user.is_admin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-[11px] tracking-[0.1em] uppercase text-[#8B6914]/80 hover:text-[#8B6914] hover:bg-[#8B6914]/5 transition-colors"
                        style={{ fontFamily: "'Lexend Zetta', sans-serif" }}
                      >
                        <Shield className="w-3 h-3" />
                        Panel Admin
                      </Link>
                    )}
                    <button
                      onClick={() => { setUserMenuOpen(false); logout(); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-[11px] tracking-[0.1em] uppercase text-[#7D3150]/70 hover:text-[#7D3150] hover:bg-[#7D3150]/5 transition-colors"
                      style={{ fontFamily: "'Lexend Zetta', sans-serif" }}
                    >
                      <LogOut className="w-3 h-3" />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="p-2 rounded-full hover:bg-black/5 transition-colors">
                <User className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        {searchOpen && (
          <div className="md:hidden px-6 pb-4">
            <form onSubmit={handleSearch} className="flex items-center gap-2 bg-white/50 rounded-full px-4 py-2.5 border border-white/60">
              <button type="submit" className="shrink-0">
                <Search className="w-3.5 h-3.5 text-black/35" />
              </button>
              <input
                type="text"
                placeholder="¿Que belleza buscas?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="bg-transparent border-none outline-none text-[11px] tracking-[0.12em] w-full placeholder:text-black/35"
                style={{ fontFamily: "'Lexend Zetta', sans-serif" }}
              />
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav
            className="md:hidden px-6 pb-5 pt-1 flex flex-col gap-4 border-t border-black/5"
            style={{ fontFamily: "'Lexend Zetta', sans-serif" }}
          >
            <Link to="/products/maquillaje" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>Maquillaje</Link>
            <Link to="/products/cuerpo"     className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>Cuerpo</Link>
            <Link to="/products/piel"       className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>Piel</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
