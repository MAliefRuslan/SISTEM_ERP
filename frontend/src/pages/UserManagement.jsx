import { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  Settings, 
  X, 
  User, 
  Mail, 
  Shield, 
  Key,
  ShieldCheck,
  Calendar
} from 'lucide-react';

export default function UserManagement() {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'kasir'
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch users list
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/users/manage');
      setUsers(response.data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat daftar pengguna.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Open modal
  const openModal = () => {
    setForm({
      name: '',
      email: '',
      password: '',
      role: 'kasir'
    });
    setIsModalOpen(true);
  };

  // Form submit (create user)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      alert('Semua field wajib diisi!');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/users/manage', form);
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Gagal membuat akun pengguna.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete user
  const handleDelete = async (id, name) => {
    if (parseInt(id) === currentUser?.userId) {
      alert('Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus akun pengguna "${name}"?`)) {
      try {
        await api.delete(`/api/users/manage?id=${id}`);
        fetchUsers();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.error || 'Gagal menghapus pengguna.');
      }
    }
  };

  const getRoleBadge = (role) => {
    const isAdmin = role === 'admin';
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border uppercase ${
        isAdmin 
          ? 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/20' 
          : 'bg-green-50 text-green-700 border-green-200 ring-green-600/20'
      }`}>
        {role}
      </span>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Kelola Akun Pengguna</h1>
          <p className="text-slate-500 mt-1">Daftarkan akun admin baru atau akun kasir untuk transaksi POS</p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 px-5 rounded-xl transition shadow-lg shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          <p className="text-slate-500 mt-3 text-sm">Memuat daftar pengguna...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-center border border-red-200 text-red-600 rounded-2xl">
          <p className="font-bold">{error}</p>
          <button onClick={fetchUsers} className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold">
            Coba Lagi
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-500">
          <Settings className="h-14 w-14 text-slate-300 mx-auto stroke-1 mb-3" />
          <p className="font-semibold text-lg">Belum ada akun pengguna terdaftar</p>
          <p className="text-slate-400 text-sm mt-1">Klik tombol di atas untuk mendaftarkan akun baru.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-100">
                  <th className="p-4">Nama Pengguna</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Hak Akses / Role</th>
                  <th className="p-4">Tanggal Dibuat</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map((u) => {
                  const isSelf = parseInt(u.id) === currentUser?.userId;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{u.name}</span>
                          {isSelf && (
                            <span className="inline-flex items-center bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[10px] font-extrabold px-1.5 py-0.2 rounded-md">
                              Saya
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-slate-700 font-medium">
                        <span className="flex items-center space-x-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span>{u.email}</span>
                        </span>
                      </td>
                      <td className="p-4">{getRoleBadge(u.role)}</td>
                      <td className="p-4 text-slate-600">
                        <span className="flex items-center space-x-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {new Date(u.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                          </span>
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          disabled={isSelf}
                          onClick={() => handleDelete(u.id, u.name)}
                          className="p-2 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-650 border border-slate-200 hover:border-red-200 disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-600 rounded-lg transition"
                          title={isSelf ? 'Anda tidak bisa menghapus diri sendiri' : 'Hapus Akun'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE ACCOUNT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-lg">Daftarkan Akun Pengguna Baru</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {/* Full name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Nama Lengkap *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Contoh: Muhammad Alief"
                      className="pl-9 pr-3 py-2.5 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Email address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Alamat Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="Contoh: user@mail.com"
                      className="pl-9 pr-3 py-2.5 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Kata Sandi (Password) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="password"
                      required
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="Minimal 6 karakter"
                      className="pl-9 pr-3 py-2.5 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Role select */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Hak Akses / Role *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-4 w-4 text-slate-400" />
                    </div>
                    <select
                      required
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                      className="pl-9 pr-3 py-2.5 w-full border border-slate-300 bg-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none font-semibold text-slate-700"
                    >
                      <option value="kasir">Kasir (Akses Penjualan Sahaja)</option>
                      <option value="admin">Administrator (Semua Akses)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition flex items-center space-x-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Daftarkan Akun</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
