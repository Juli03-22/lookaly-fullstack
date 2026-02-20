import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth, avatarColor, avatarInitial } from '../context/AuthContext';
import { Shield, Users, UserCheck, UserX, Crown, LogOut, Trash2, RefreshCw } from 'lucide-react';

interface UserRow {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Redirigir si no es admin
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!user.is_admin) { navigate('/'); return; }
  }, [user, navigate]);

  const fetchUsers = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('No se pudo cargar la lista');
      setUsers(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [token]);

  const handleDelete = async (userId: string) => {
    if (!token || !confirm('¿Eliminar este usuario?')) return;
    setDeletingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('No se pudo eliminar');
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch {
      alert('Error al eliminar el usuario');
    } finally {
      setDeletingId(null);
    }
  };

  const totalUsers   = users.length;
  const activeUsers  = users.filter(u => u.is_active).length;
  const adminUsers   = users.filter(u => u.is_admin).length;

  return (
    <div className="min-h-screen bg-[#FDF8F9]" style={{ fontFamily: "'Lexend Zetta', sans-serif" }}>

      {/* Header */}
      <header className="bg-[#E5B6C3]/70 backdrop-blur-xl border-b border-[#E5B6C3]/40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#7D3150] flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-[#7D3150]/70">Panel de administración</p>
              <p className="text-sm font-semibold text-[#3a1a28]">Lookaly Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#7D3150]/70 hidden sm:block">{user?.email}</span>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-full text-[11px] tracking-widest uppercase text-[#7D3150] hover:bg-[#7D3150]/10 transition-colors"
            >
              <LogOut size={14} />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Total usuarios', value: totalUsers,  Icon: Users,     color: '#7D3150' },
            { label: 'Activos',        value: activeUsers, Icon: UserCheck,  color: '#4A7C59' },
            { label: 'Administradores',value: adminUsers,  Icon: Crown,      color: '#8B6914' },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5B6C3]/30 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon size={22} style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#3a1a28]">{isLoading ? '—' : value}</p>
                <p className="text-[11px] tracking-widest uppercase text-[#7D3150]/60">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E5B6C3]/30 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5B6C3]/20">
            <h2 className="text-[12px] tracking-[0.2em] uppercase text-[#7D3150] font-semibold">Usuarios registrados</h2>
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] text-[#7D3150] hover:bg-[#E5B6C3]/30 transition-colors"
            >
              <RefreshCw size={13} />
              Actualizar
            </button>
          </div>

          {isLoading ? (
            <div className="py-20 text-center text-sm text-[#7D3150]/50 tracking-widest uppercase">Cargando...</div>
          ) : error ? (
            <div className="py-20 text-center text-sm text-red-400">{error}</div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center text-sm text-[#7D3150]/50">No hay usuarios registrados</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FDF8F9] border-b border-[#E5B6C3]/20">
                    {['Usuario', 'Email', 'Rol', 'Estado', 'Registro', 'Acción'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-[10px] tracking-[0.18em] uppercase text-[#7D3150]/60 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5B6C3]/15">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-[#FDF8F9]/80 transition-colors">
                      {/* Avatar + nombre */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: avatarColor(u.name) }}
                          >
                            {avatarInitial(u.name)}
                          </div>
                          <span className="font-medium text-[#3a1a28] text-[13px]">{u.name}</span>
                        </div>
                      </td>
                      {/* Email */}
                      <td className="px-6 py-4 text-[#7D3150]/70 text-[12px]">{u.email}</td>
                      {/* Rol */}
                      <td className="px-6 py-4">
                        {u.is_admin
                          ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] tracking-widest uppercase bg-[#8B6914]/10 text-[#8B6914] font-medium"><Crown size={10} />Admin</span>
                          : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] tracking-widest uppercase bg-[#E5B6C3]/30 text-[#7D3150] font-medium"><Users size={10} />Usuario</span>
                        }
                      </td>
                      {/* Estado */}
                      <td className="px-6 py-4">
                        {u.is_active
                          ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] tracking-widest uppercase bg-[#4A7C59]/10 text-[#4A7C59] font-medium"><UserCheck size={10} />Activo</span>
                          : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] tracking-widest uppercase bg-red-50 text-red-400 font-medium"><UserX size={10} />Inactivo</span>
                        }
                      </td>
                      {/* Fecha */}
                      <td className="px-6 py-4 text-[#7D3150]/50 text-[12px]">
                        {new Date(u.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      {/* Acción */}
                      <td className="px-6 py-4">
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            disabled={deletingId === u.id}
                            className="p-2 rounded-full text-red-300 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                            title="Eliminar usuario"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
