import { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Users, 
  Loader2, 
  ShoppingCart, 
  Receipt,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Admin fetches everything, Cashier fetches products & sales
      if (isAdmin) {
        const [prodRes, salesRes, empRes] = await Promise.all([
          api.get('/api/products'),
          api.get('/api/sales'),
          api.get('/api/employees')
        ]);
        setProducts(prodRes.data);
        setSales(salesRes.data);
        setEmployees(empRes.data);
      } else {
        const [prodRes, salesRes] = await Promise.all([
          api.get('/api/products'),
          api.get('/api/sales')
        ]);
        setProducts(prodRes.data);
        setSales(salesRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll for updates every 20 seconds
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // 1. Calculate today's sales
  const today = new Date().toISOString().split('T')[0];
  const todaySalesList = sales.filter(s => {
    const sDate = new Date(s.created_at).toISOString().split('T')[0];
    return sDate === today;
  });
  const totalSalesToday = todaySalesList.reduce((sum, s) => sum + parseFloat(s.total_amount), 0);

  // 2. Low stock count (stok <= 10)
  const lowStockProducts = products.filter(p => p.stock <= 10);
  
  // 3. Active employees count
  const activeEmployeesCount = employees.filter(e => e.status === 'active').length;

  // 4. Chart Data: Sales trend over last 7 days
  const chartData = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      
      const daySales = sales.filter(s => {
        const sDate = new Date(s.created_at).toISOString().split('T')[0];
        return sDate === dateStr;
      });
      const totalAmount = daySales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0);
      
      days.push({
        name: dayLabel,
        penjualan: totalAmount
      });
    }
    return days;
  })();

  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 mt-3 text-sm">Menyiapkan dashboard Anda...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Selamat Datang, {user?.name}!</h1>
          <p className="text-slate-500 mt-1">Berikut ringkasan operasional bisnis hari ini.</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-sm font-semibold text-slate-600 uppercase">Live Update Dashboard</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-750 text-sm flex items-center space-x-2">
          <span>⚠️</span>
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Penjualan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Penjualan Hari Ini</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900">{formatPrice(totalSalesToday)}</h3>
            <p className="text-xs text-slate-400 mt-1">{todaySalesList.length} transaksi penjualan</p>
          </div>
        </div>

        {/* Total Produk */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Katalog Produk</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900">{products.length} Item</h3>
            <p className="text-xs text-slate-400 mt-1">Dikelola dalam inventori</p>
          </div>
        </div>

        {/* Produk Stok Rendah */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Stok Hampir Habis</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900">{lowStockProducts.length} Produk</h3>
            <p className="text-xs text-slate-400 mt-1">Kuantitas di bawah 10 unit</p>
          </div>
        </div>

        {/* HR Karyawan Aktif atau Info Pelanggan POS */}
        {isAdmin ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Karyawan Aktif</span>
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-slate-900">{activeEmployeesCount} Orang</h3>
              <p className="text-xs text-slate-400 mt-1">Terdaftar aktif di sistem HR</p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Aksi Kasir</span>
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <ShoppingCart className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <Link
                to="/pos"
                className="inline-flex items-center space-x-1 text-sm font-bold text-blue-600 hover:text-blue-700 transition"
              >
                <span>Buka Layanan POS</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-xs text-slate-400 mt-2">Mulai buat transaksi baru</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Sections: Chart (Left), Recent Activity (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Trend Penjualan Chart (2/3 width on desktop) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Grafik Penjualan 7 Hari Terakhir</h3>
            <p className="text-xs text-slate-400">Total nominal transaksi dalam Rupiah (Rp)</p>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPenjualan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={11} />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickFormatter={tick => `Rp ${tick / 1000}k`}
                />
                <Tooltip 
                  formatter={value => [formatPrice(value), 'Penjualan']} 
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                />
                <Area type="monotone" dataKey="penjualan" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPenjualan)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity (1/3 width on desktop) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[350px]">
          <div>
            <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center">
              <Receipt className="h-5 w-5 mr-1.5 text-blue-500" />
              Transaksi Terbaru
            </h3>
            
            <div className="space-y-4 overflow-y-auto max-h-[280px] divide-y divide-slate-100 pr-1">
              {sales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="pt-3 first:pt-0 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-bold font-mono text-slate-900 text-xs">{sale.invoice_number}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {sale.customer_name} • {new Date(sale.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">{formatPrice(sale.total_amount)}</p>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 uppercase font-semibold">
                      {sale.payment_method}
                    </span>
                  </div>
                </div>
              ))}

              {sales.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-sm font-medium">Belum ada transaksi</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <Link
              to="/sales"
              className="w-full flex items-center justify-center space-x-1 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 text-xs font-bold transition"
            >
              <span>Lihat Semua Riwayat Penjualan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* Low Stock Warning Panel */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center space-x-2 text-amber-800 font-bold mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3>Peringatan Stok Rendah (Kuantitas ≤ 10)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {lowStockProducts.slice(0, 8).map(prod => (
              <div key={prod.id} className="bg-white p-4 rounded-xl border border-amber-200/60 shadow-sm flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{prod.name}</p>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{prod.sku}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block px-2.5 py-0.5 bg-red-100 text-red-700 font-black text-sm rounded-full">
                    {prod.stock}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {lowStockProducts.length > 8 && (
            <div className="mt-4 text-right">
              <Link to="/products" className="text-xs font-bold text-amber-800 hover:text-amber-900 underline">
                Lihat semua produk ({lowStockProducts.length})
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
