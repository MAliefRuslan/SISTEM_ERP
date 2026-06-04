import { useState, useEffect } from 'react';
import api from '../api';
import { 
  Loader2, 
  Search, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  X, 
  Receipt,
  FileText
} from 'lucide-react';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedSale, setSelectedSale] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch sales list
  const fetchSales = async () => {
    try {
      setLoading(true);
      setError('');
      let url = '/api/sales';
      if (dateFilter) {
        url += `?date=${dateFilter}`;
      }
      const response = await api.get(url);
      setSales(response.data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat riwayat penjualan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [dateFilter]);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Filter sales on client side by invoice/customer name/cashier name
  const filteredSales = sales.filter(sale => {
    const term = searchQuery.toLowerCase();
    return (
      sale.invoice_number.toLowerCase().includes(term) ||
      (sale.customer_name && sale.customer_name.toLowerCase().includes(term)) ||
      (sale.cashier_name && sale.cashier_name.toLowerCase().includes(term))
    );
  });

  // Fetch single sale detail for modal
  const viewDetail = async (id) => {
    try {
      setLoadingDetail(true);
      const response = await api.get(`/api/sales?id=${id}`);
      setSelectedSale(response.data);
    } catch (err) {
      console.error(err);
      alert('Gagal memuat detail transaksi.');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Calculate statistics for the current filtered list (usually representing "Hari ini" or selected date filter)
  const stats = (() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => {
      const sDate = new Date(s.created_at).toISOString().split('T')[0];
      return sDate === today;
    });

    const todayTotal = todaySales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
    const todayCount = todaySales.length;

    return {
      todayTotal,
      todayCount
    };
  })();

  const getPaymentBadge = (method) => {
    const style = {
      cash: 'bg-green-50 text-green-700 ring-green-600/20 border-green-200',
      transfer: 'bg-blue-50 text-blue-700 ring-blue-600/20 border-blue-200',
      qris: 'bg-purple-50 text-purple-700 ring-purple-600/20 border-purple-200'
    }[method.toLowerCase()] || 'bg-slate-50 text-slate-700 ring-slate-600/20 border-slate-200';

    return (
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold uppercase border ${style}`}>
        {method}
      </span>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Riwayat Penjualan</h1>
        <p className="text-slate-500 mt-1">Lacak dan lihat semua riwayat transaksi Point of Sale</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Penjualan Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Penjualan Hari Ini</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{formatPrice(stats.todayTotal)}</h3>
          </div>
        </div>

        {/* Jumlah Transaksi Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Jumlah Transaksi Hari Ini</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.todayCount} Transaksi</h3>
          </div>
        </div>
      </div>

      {/* Filters Area */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari No Invoice, Kasir, atau Pelanggan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-2.5 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        {/* Date Filter */}
        <div className="relative w-full sm:w-60">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="pl-9 pr-3 py-2.5 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        {/* Reset Filter Button */}
        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition"
          >
            Reset Tanggal
          </button>
        )}
      </div>

      {/* Sales Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          <p className="text-slate-500 mt-3 text-sm">Memuat data transaksi...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-center border border-red-200 text-red-600 rounded-2xl">
          <p className="font-bold">{error}</p>
          <button onClick={fetchSales} className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold">
            Coba Lagi
          </button>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-500">
          <Receipt className="h-14 w-14 text-slate-300 mx-auto stroke-1 mb-3" />
          <p className="font-semibold text-lg">Belum ada data transaksi</p>
          <p className="text-slate-400 text-sm mt-1">Lakukan transaksi baru pada modul Point of Sale.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-100">
                  <th className="p-4">No Invoice</th>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Pelanggan</th>
                  <th className="p-4">Kasir</th>
                  <th className="p-4">Metode Bayar</th>
                  <th className="p-4 text-right">Total Transaksi</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold font-mono text-slate-900">{sale.invoice_number}</td>
                    <td className="p-4 text-slate-600">
                      {new Date(sale.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="p-4 text-slate-800 font-medium">{sale.customer_name}</td>
                    <td className="p-4 text-slate-600">{sale.cashier_name || 'System / Admin'}</td>
                    <td className="p-4">{getPaymentBadge(sale.payment_method)}</td>
                    <td className="p-4 text-right font-bold text-slate-900">{formatPrice(sale.total_amount)}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => viewDetail(sale.id)}
                        className="inline-flex items-center space-x-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/50 hover:border-blue-200 py-1.5 px-3 rounded-lg text-xs font-bold transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-lg">Detail Transaksi Penjualan</h3>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Receipt Header details */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice</p>
                  <p className="font-bold font-mono text-slate-900 mt-0.5">{selectedSale.invoice_number}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Waktu Transaksi</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {new Date(selectedSale.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pelanggan</p>
                  <p className="font-semibold text-slate-850 mt-0.5">{selectedSale.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kasir</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedSale.cashier_name || 'System / Admin'}</p>
                </div>
              </div>

              {/* Items detail list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daftar Item Belanja</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  <div className="bg-slate-50 p-3 grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 uppercase">
                    <div className="col-span-6">Nama Produk</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-4 text-right">Subtotal</div>
                  </div>
                  {selectedSale.items?.map((item, index) => (
                    <div key={index} className="p-3 grid grid-cols-12 gap-2 text-sm items-center">
                      <div className="col-span-6">
                        <p className="font-semibold text-slate-800">{item.product_name}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{item.product_sku}</p>
                      </div>
                      <div className="col-span-2 text-center font-bold text-slate-700">{item.quantity}x</div>
                      <div className="col-span-4 text-right font-semibold text-slate-900">{formatPrice(item.subtotal)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grand Total summary info */}
              <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metode Pembayaran</p>
                  <div className="mt-1">{getPaymentBadge(selectedSale.payment_method)}</div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pembayaran</p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">{formatPrice(selectedSale.total_amount)}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedSale(null)}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
