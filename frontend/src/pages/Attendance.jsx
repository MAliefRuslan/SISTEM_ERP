import { useState, useEffect } from 'react';
import api from '../api';
import { 
  Loader2, 
  Plus, 
  X, 
  Calendar, 
  UserCheck, 
  UserX, 
  Clock, 
  FileText,
  Filter
} from 'lucide-react';

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [monthFilter, setMonthFilter] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [employeeFilter, setEmployeeFilter] = useState('');

  // Log attendance modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    employee_id: '',
    date: new Date().toISOString().split('T')[0],
    check_in: '',
    check_out: '',
    status: 'present',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      let attUrl = `/api/attendance?month=${monthFilter}`;
      if (employeeFilter) {
        attUrl += `&employee_id=${employeeFilter}`;
      }

      const [attendanceRes, employeesRes] = await Promise.all([
        api.get(attUrl),
        api.get('/api/employees')
      ]);

      setAttendance(attendanceRes.data);
      setEmployees(employeesRes.data.filter(e => e.status === 'active'));
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data absensi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [monthFilter, employeeFilter]);

  // Open Log Modal
  const openModal = () => {
    setForm({
      employee_id: '',
      date: new Date().toISOString().split('T')[0],
      check_in: '08:00',
      check_out: '17:00',
      status: 'present',
      notes: ''
    });
    setIsModalOpen(true);
  };

  // Submit attendance log
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employee_id) {
      alert('Pilih karyawan terlebih dahulu!');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/attendance', form);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Gagal menyimpan absensi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate stats for selected period
  const stats = (() => {
    const present = attendance.filter(a => a.status === 'present').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const leave = attendance.filter(a => a.status === 'leave').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    return { present, late, leave, absent };
  })();

  const getStatusBadge = (status) => {
    const config = {
      present: { text: 'Hadir', class: 'bg-green-50 text-green-700 border-green-200 ring-green-600/20' },
      absent: { text: 'Alpa', class: 'bg-red-50 text-red-700 border-red-200 ring-red-600/20' },
      late: { text: 'Terlambat', class: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20' },
      leave: { text: 'Cuti/Izin', class: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/20' }
    }[status.toLowerCase()] || { text: status, class: 'bg-slate-50 text-slate-700 border-slate-200 ring-slate-600/20' };

    return (
      <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-bold border uppercase ${config.class}`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Absensi Karyawan</h1>
          <p className="text-slate-500 mt-1">Rekap data kehadiran harian dan keterlambatan pegawai</p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 px-5 rounded-xl transition shadow-lg shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Catat Absensi</span>
        </button>
      </div>

      {/* Attendance Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Hadir */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hadir</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.present} Kali</h3>
          </div>
        </div>

        {/* Terlambat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Terlambat</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.late} Kali</h3>
          </div>
        </div>

        {/* Cuti */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cuti/Izin</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.leave} Kali</h3>
          </div>
        </div>

        {/* Alpa */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <UserX className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tidak Hadir</p>
            <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stats.absent} Kali</h3>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        {/* Month Filter */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center">
            <Filter className="h-3 w-3 mr-1" /> Bulan Absensi
          </label>
          <input
            type="month"
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
            className="py-2.5 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Employee Filter */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center">
            <Filter className="h-3 w-3 mr-1" /> Filter Pegawai
          </label>
          <select
            value={employeeFilter}
            onChange={e => setEmployeeFilter(e.target.value)}
            className="py-2.5 px-3 w-full border border-slate-300 bg-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Semua Karyawan</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.department})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendance Data Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          <p className="text-slate-500 mt-3 text-sm">Memuat data absensi...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-center border border-red-200 text-red-600 rounded-2xl">
          <p className="font-bold">{error}</p>
          <button onClick={fetchData} className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold">
            Coba Lagi
          </button>
        </div>
      ) : attendance.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-500">
          <Clock className="h-14 w-14 text-slate-300 mx-auto stroke-1 mb-3" />
          <p className="font-semibold text-lg">Belum ada rekaman absensi periode ini</p>
          <p className="text-slate-400 text-sm mt-1">Klik tombol di atas untuk mulai mencatat kehadiran pegawai.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-100">
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Nama Pegawai</th>
                  <th className="p-4">Departemen</th>
                  <th className="p-4 text-center">Jam Masuk</th>
                  <th className="p-4 text-center">Jam Keluar</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Catatan/Izin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {attendance.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-semibold text-slate-700">
                      {new Date(att.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 font-bold text-slate-900">{att.employee_name}</td>
                    <td className="p-4 text-slate-600">{att.department}</td>
                    <td className="p-4 text-center font-mono font-medium text-slate-800">{att.check_in ? att.check_in.substring(0, 5) : '-'}</td>
                    <td className="p-4 text-center font-mono font-medium text-slate-800">{att.check_out ? att.check_out.substring(0, 5) : '-'}</td>
                    <td className="p-4">{getStatusBadge(att.status)}</td>
                    <td className="p-4 text-slate-500 italic max-w-[200px] truncate" title={att.notes}>
                      {att.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD ATTENDANCE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-lg">Catat Absensi Pegawai</h3>
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
                {/* Employee select */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Nama Pegawai *
                  </label>
                  <select
                    required
                    value={form.employee_id}
                    onChange={e => setForm({ ...form, employee_id: e.target.value })}
                    className="py-2.5 px-3 w-full border border-slate-300 bg-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Pilih Pegawai --</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.position} - {e.department})</option>
                    ))}
                  </select>
                </div>

                {/* Date & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Tanggal Absen *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                      className="py-2.5 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none font-semibold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Status Kehadiran *
                    </label>
                    <select
                      required
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value })}
                      className="py-2.5 px-3 w-full border border-slate-300 bg-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none font-semibold text-slate-700"
                    >
                      <option value="present">Hadir</option>
                      <option value="late">Terlambat</option>
                      <option value="leave">Cuti / Izin</option>
                      <option value="absent">Tidak Hadir (Alpa)</option>
                    </select>
                  </div>
                </div>

                {/* Clock-in & Clock-out */}
                {['present', 'late'].includes(form.status) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Jam Masuk (Check-in)
                      </label>
                      <input
                        type="time"
                        value={form.check_in}
                        onChange={e => setForm({ ...form, check_in: e.target.value })}
                        className="py-2.5 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Jam Keluar (Check-out)
                      </label>
                      <input
                        type="time"
                        value={form.check_out}
                        onChange={e => setForm({ ...form, check_out: e.target.value })}
                        className="py-2.5 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Catatan / Alasan Cuti / Keterangan
                  </label>
                  <textarea
                    rows="2"
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Contoh: Datang terlambat karena ban bocor, izin cuti tahunan, dll."
                    className="py-2.5 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  />
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
                  <span>Simpan Absensi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
