import { useState, useEffect } from 'react';
import api from '../api';
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  UserCheck, 
  UserX,
  X,
  Phone,
  Mail,
  Briefcase,
  DollarSign,
  Calendar
} from 'lucide-react';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null); // null if adding
  const [form, setForm] = useState({
    name: '',
    position: '',
    department: '',
    phone: '',
    email: '',
    hire_date: '',
    salary: '',
    status: 'active'
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch employees list
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/employees');
      setEmployees(response.data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data karyawan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Open Modal for Add
  const openAddModal = () => {
    setEditingEmployee(null);
    setForm({
      name: '',
      position: '',
      department: '',
      phone: '',
      email: '',
      hire_date: new Date().toISOString().split('T')[0],
      salary: '',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const openEditModal = (employee) => {
    setEditingEmployee(employee);
    // Format date YYYY-MM-DD
    const hireDate = employee.hire_date 
      ? new Date(employee.hire_date).toISOString().split('T')[0] 
      : '';
    setForm({
      name: employee.name,
      position: employee.position || '',
      department: employee.department || '',
      phone: employee.phone || '',
      email: employee.email || '',
      hire_date: hireDate,
      salary: employee.salary || '',
      status: employee.status || 'active'
    });
    setIsModalOpen(true);
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Nama karyawan harus diisi!');
      return;
    }

    try {
      setSubmitting(true);
      if (editingEmployee) {
        // Edit Employee
        await api.put('/api/employees', {
          id: editingEmployee.id,
          ...form
        });
      } else {
        // Add Employee
        await api.post('/api/employees', form);
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Gagal menyimpan data karyawan.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id, name) => {
    if (confirm(`Apakah Anda yakin ingin menghapus karyawan "${name}"?`)) {
      try {
        await api.delete(`/api/employees?id=${id}`);
        fetchEmployees();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.error || 'Gagal menghapus data karyawan.');
      }
    }
  };

  // Calculate stats
  const stats = (() => {
    const total = employees.length;
    const active = employees.filter(e => e.status === 'active').length;
    const inactive = total - active;
    return { total, active, inactive };
  })();

  const getStatusBadge = (status) => {
    const isActive = status === 'active';
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${
        isActive 
          ? 'bg-green-50 text-green-700 border-green-200 ring-green-600/20' 
          : 'bg-red-50 text-red-700 border-red-200 ring-red-600/20'
      }`}>
        {isActive ? 'Aktif' : 'Nonaktif'}
      </span>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Data Karyawan</h1>
          <p className="text-slate-500 mt-1">Kelola data kepegawaian, jabatan, dan struktur gaji karyawan</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 px-5 rounded-xl transition shadow-lg shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Karyawan</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Karyawan</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.total} Orang</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Karyawan Aktif</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.active} Orang</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-red-50 text-red-600 rounded-xl">
            <UserX className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Karyawan Nonaktif</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.inactive} Orang</h3>
          </div>
        </div>
      </div>

      {/* Table Data */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          <p className="text-slate-500 mt-3 text-sm">Memuat data karyawan...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-center border border-red-200 text-red-600 rounded-2xl">
          <p className="font-bold">{error}</p>
          <button onClick={fetchEmployees} className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold">
            Coba Lagi
          </button>
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-500">
          <Users className="h-14 w-14 text-slate-300 mx-auto stroke-1 mb-3" />
          <p className="font-semibold text-lg">Belum ada data karyawan</p>
          <p className="text-slate-400 text-sm mt-1">Klik tombol di atas untuk mendaftarkan karyawan pertama.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-100">
                  <th className="p-4">Nama</th>
                  <th className="p-4">Jabatan</th>
                  <th className="p-4">Departemen</th>
                  <th className="p-4">Kontak</th>
                  <th className="p-4 text-right">Gaji Pokok</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{employee.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Masuk: {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                      </div>
                    </td>
                    <td className="p-4 text-slate-700 font-medium">
                      <span className="flex items-center space-x-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                        <span>{employee.position || '-'}</span>
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{employee.department || '-'}</td>
                    <td className="p-4 text-slate-600">
                      <div className="flex flex-col space-y-0.5">
                        {employee.phone && (
                          <span className="flex items-center text-xs font-mono">
                            <Phone className="h-3 w-3 text-slate-450 mr-1 shrink-0" />
                            {employee.phone}
                          </span>
                        )}
                        {employee.email && (
                          <span className="flex items-center text-xs">
                            <Mail className="h-3 w-3 text-slate-450 mr-1 shrink-0" />
                            {employee.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-900">{formatPrice(employee.salary)}</td>
                    <td className="p-4">{getStatusBadge(employee.status)}</td>
                    <td className="p-4 text-center">
                      <div className="inline-flex space-x-2">
                        <button
                          onClick={() => openEditModal(employee)}
                          className="p-2 bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-600 border border-slate-200 rounded-lg transition"
                          title="Ubah Data Karyawan"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id, employee.name)}
                          className="p-2 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 rounded-lg transition"
                          title="Hapus Karyawan"
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

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-lg">
                  {editingEmployee ? 'Ubah Data Karyawan' : 'Daftarkan Karyawan Baru'}
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
                {/* Employee Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Nama Karyawan *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Contoh: Budi Santoso"
                    className="py-2.5 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Position & Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      value={form.position}
                      onChange={e => setForm({ ...form, position: e.target.value })}
                      placeholder="Contoh: Staff Keuangan"
                      className="py-2.5 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Departemen
                    </label>
                    <input
                      type="text"
                      value={form.department}
                      onChange={e => setForm({ ...form, department: e.target.value })}
                      placeholder="Contoh: HRD / Finance"
                      className="py-2.5 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
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
                      placeholder="Contoh: 0812345678"
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
                      placeholder="Contoh: employee@mail.com"
                      className="py-2.5 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Salary & Hire Date Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Gaji Pokok (IDR)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                        Rp
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={form.salary}
                        onChange={e => setForm({ ...form, salary: e.target.value })}
                        placeholder="Contoh: 4500000"
                        className="pl-8 pr-3 py-2.5 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none font-semibold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Tanggal Mulai Bekerja
                    </label>
                    <input
                      type="date"
                      value={form.hire_date}
                      onChange={e => setForm({ ...form, hire_date: e.target.value })}
                      className="py-2.5 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Status selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Status Keaktifan
                  </label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="py-2.5 px-3 w-full border border-slate-300 bg-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none font-semibold text-slate-700"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
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
                  <span>{editingEmployee ? 'Simpan Perubahan' : 'Daftarkan Karyawan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
