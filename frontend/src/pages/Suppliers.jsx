import { useState, useEffect } from 'react';
import api from '../api';
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Truck, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  User
} from 'lucide-react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null); // null if adding
  const [form, setForm] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch suppliers list
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/suppliers');
      setSuppliers(response.data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data supplier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Open modal for add
  const openAddModal = () => {
    setEditingSupplier(null);
    setForm({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: ''
    });
    setIsModalOpen(true);
  };

  // Open modal for edit
  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || ''
    });
    setIsModalOpen(true);
  };

  // Handle Form Submit (POST & PUT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Nama supplier harus diisi!');
      return;
    }

    try {
      setSubmitting(true);
      if (editingSupplier) {
        // Edit Supplier
        await api.put('/api/suppliers', {
          id: editingSupplier.id,
          ...form
        });
      } else {
        // Add Supplier
        await api.post('/api/suppliers', form);
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Gagal menyimpan data supplier.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id, name) => {
    if (confirm(`Apakah Anda yakin ingin menghapus supplier "${name}"?`)) {
      try {
        await api.delete(`/api/suppliers?id=${id}`);
        fetchSuppliers();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.error || 'Gagal menghapus supplier.');
      }
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Kelola Supplier</h1>
          <p className="text-slate-500 mt-1">Daftar dan kelola rekanan penyuplai produk perusahaan</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 px-5 rounded-xl transition shadow-lg shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Supplier</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          <p className="text-slate-500 mt-3 text-sm">Memuat data supplier...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-center border border-red-200 text-red-600 rounded-2xl">
          <p className="font-bold">{error}</p>
          <button onClick={fetchSuppliers} className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold">
            Coba Lagi
          </button>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-500">
          <Truck className="h-14 w-14 text-slate-300 mx-auto stroke-1 mb-3" />
          <p className="font-semibold text-lg">Belum ada data supplier</p>
          <p className="text-slate-400 text-sm mt-1">Klik tombol di atas untuk mendaftarkan supplier baru.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-100">
                  <th className="p-4">Nama Supplier</th>
                  <th className="p-4">Kontak Person</th>
                  <th className="p-4">Telepon</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Alamat</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold text-slate-900">{supplier.name}</td>
                    <td className="p-4 text-slate-700 font-medium">
                      <span className="flex items-center space-x-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>{supplier.contact_person || '-'}</span>
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-mono">
                      {supplier.phone ? (
                        <span className="flex items-center space-x-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{supplier.phone}</span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4 text-slate-600">
                      {supplier.email ? (
                        <span className="flex items-center space-x-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span>{supplier.email}</span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4 text-slate-550 max-w-[250px] truncate">
                      {supplier.address ? (
                        <span className="flex items-center space-x-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{supplier.address}</span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex space-x-2">
                        <button
                          onClick={() => openEditModal(supplier)}
                          className="p-2 bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-600 border border-slate-200 rounded-lg transition"
                          title="Edit Supplier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id, supplier.name)}
                          className="p-2 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 rounded-lg transition"
                          title="Hapus Supplier"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal (Add / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Truck className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-lg">
                  {editingSupplier ? 'Ubah Data Supplier' : 'Daftarkan Supplier Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {/* Supplier Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Nama Supplier *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Contoh: PT. Sumber Makmur"
                    className="py-2.5 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Contact Person */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Nama Kontak Person
                  </label>
                  <input
                    type="text"
                    value={form.contact_person}
                    onChange={e => setForm({ ...form, contact_person: e.target.value })}
                    placeholder="Contoh: John Doe"
                    className="py-2.5 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Phone & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      No. Telepon
                    </label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="Contoh: 08123456789"
                      className="py-2.5 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="Contoh: supplier@mail.com"
                      className="py-2.5 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Alamat
                  </label>
                  <textarea
                    rows="3"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="Alamat kantor atau gudang supplier..."
                    className="py-2.5 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
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
                  <span>{editingSupplier ? 'Simpan Perubahan' : 'Daftarkan Supplier'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
