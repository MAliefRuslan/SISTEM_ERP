import { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { 
  Loader2, 
  Plus, 
  Search, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Tags,
  AlertTriangle,
  FolderPlus
} from 'lucide-react';

export default function Products() {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form States
  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    sku: '', 
    price: '', 
    description: '',
    category_id: '' 
  });
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [transaction, setTransaction] = useState({ product_id: '', type: 'in', quantity: '' });
  
  const [search, setSearch] = useState('');
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [submittingCategory, setSubmittingCategory] = useState(false);
  const [submittingTx, setSubmittingTx] = useState(false);

  const isAdmin = user?.role === 'admin';

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/api/products'),
        api.get('/api/categories')
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data produk & kategori.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Create Product (Admin Only)
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Hanya admin yang dapat menambah produk!');
      return;
    }
    
    try {
      setSubmittingProduct(true);
      await api.post('/api/products', {
        ...newProduct,
        price: parseFloat(newProduct.price)
      });
      setNewProduct({ name: '', sku: '', price: '', description: '', category_id: '' });
      fetchData();
      alert('Produk berhasil ditambahkan!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Gagal menambahkan produk.');
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Create Category (Admin Only)
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Hanya admin yang dapat menambah kategori!');
      return;
    }

    try {
      setSubmittingCategory(true);
      await api.post('/api/categories', newCategory);
      setNewCategory({ name: '', description: '' });
      const categoriesRes = await api.get('/api/categories');
      setCategories(categoriesRes.data);
      alert('Kategori berhasil ditambahkan!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Gagal menambahkan kategori.');
    } finally {
      setSubmittingCategory(false);
    }
  };

  // Record Manual Inventory Transaction (In/Out adjustments)
  const handleTransaction = async (e) => {
    e.preventDefault();
    try {
      setSubmittingTx(true);
      await api.post('/api/inventory-transactions', {
        ...transaction,
        quantity: parseInt(transaction.quantity)
      });
      setTransaction({ product_id: '', type: 'in', quantity: '' });
      fetchData();
      alert('Transaksi stok berhasil disimpan!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Gagal memproses transaksi stok.');
    } finally {
      setSubmittingTx(false);
    }
  };

  // Filtered list
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 max-w-7xl space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Katalog Produk & Stok</h1>
        <p className="text-slate-500 mt-1">Daftar inventori barang dagang, manajemen kategori, dan penyesuaian stok</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Grid: Forms Side (Admin Only) & Products Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Admin Forms & Adjustments (4/12 width) */}
        {isAdmin && (
          <div className="lg:col-span-4 space-y-6">
            
            {/* Create Product Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center">
                <Plus className="h-5 w-5 mr-1.5 text-blue-500" />
                Tambah Produk Baru
              </h3>
              <form onSubmit={handleCreateProduct} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nama Produk *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kopi Bubuk Arabika"
                    value={newProduct.name}
                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="py-2 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">SKU / Kode *</label>
                    <input
                      type="text"
                      required
                      placeholder="KOP-ARB-001"
                      value={newProduct.sku}
                      onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })}
                      className="py-2 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Harga Jual *</label>
                    <input
                      type="number"
                      required
                      placeholder="Harga Jual Rp"
                      value={newProduct.price}
                      onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="py-2 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Kategori Produk</label>
                  <select
                    value={newProduct.category_id}
                    onChange={e => setNewProduct({ ...newProduct, category_id: e.target.value })}
                    className="py-2 px-3 w-full border border-slate-300 bg-white rounded-xl text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Tanpa Kategori</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Deskripsi</label>
                  <textarea
                    rows="2"
                    placeholder="Penjelasan produk singkat..."
                    value={newProduct.description}
                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="py-2 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center space-x-2"
                >
                  {submittingProduct && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Simpan Produk</span>
                </button>
              </form>
            </div>

            {/* Quick Add Category Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center">
                <FolderPlus className="h-5 w-5 mr-1.5 text-blue-500" />
                Tambah Kategori
              </h3>
              <form onSubmit={handleCreateCategory} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nama Kategori *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Makanan / Minuman"
                    value={newCategory.name}
                    onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="py-2 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl transition flex items-center justify-center space-x-2"
                >
                  {submittingCategory && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Tambah Kategori</span>
                </button>
              </form>
            </div>

            {/* Manual Inventory Adjustment Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center">
                <Tags className="h-5 w-5 mr-1.5 text-emerald-600" />
                Penyesuaian Stok Manual
              </h3>
              <form onSubmit={handleTransaction} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pilih Produk *</label>
                  <select
                    required
                    value={transaction.product_id}
                    onChange={e => setTransaction({ ...transaction, product_id: e.target.value })}
                    className="py-2 px-3 w-full border border-slate-300 bg-white rounded-xl text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Pilih Produk</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Jenis Penyesuaian</label>
                    <select
                      required
                      value={transaction.type}
                      onChange={e => setTransaction({ ...transaction, type: e.target.value })}
                      className="py-2 px-3 w-full border border-slate-300 bg-white rounded-xl text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="in">Stok Masuk (+)</option>
                      <option value="out">Stok Keluar (-)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Kuantitas *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Qty"
                      value={transaction.quantity}
                      onChange={e => setTransaction({ ...transaction, quantity: e.target.value })}
                      className="py-2 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingTx}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center space-x-2"
                >
                  {submittingTx && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Sesuaikan Stok</span>
                </button>
              </form>
            </div>

          </div>
        )}

        {/* RIGHT COLUMN: Product Catalog list (takes 8/12 width or full if not admin) */}
        <div className={isAdmin ? 'lg:col-span-8 flex flex-col space-y-4' : 'lg:col-span-12 flex flex-col space-y-4'}>
          {/* Search bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari produk berdasarkan nama atau SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full bg-white border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>

          {/* Table container */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              <p className="text-slate-500 mt-3 text-sm">Memuat katalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-500">
              <Package className="h-14 w-14 text-slate-300 mx-auto stroke-1 mb-3" />
              <p className="font-semibold text-lg">Katalog Kosong</p>
              <p className="text-slate-400 text-sm mt-1">Belum ada produk terdaftar yang sesuai filter pencarian.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-100">
                      <th className="p-4">SKU / Nama Produk</th>
                      <th className="p-4">Kategori</th>
                      <th className="p-4">Harga Jual</th>
                      <th className="p-4 text-center">Stok</th>
                      <th className="p-4">Deskripsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredProducts.map(p => {
                      const isLowStock = p.stock <= 10;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4">
                            <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                              {p.sku}
                            </span>
                            <div className="font-bold text-slate-900 mt-1.5">{p.name}</div>
                          </td>
                          <td className="p-4">
                            {p.category?.name ? (
                              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                {p.category.name}
                              </span>
                            ) : (
                              <span className="text-slate-450 italic text-xs">Tanpa Kategori</span>
                            )}
                          </td>
                          <td className="p-4 font-bold text-slate-900">{formatPrice(p.price)}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              {isLowStock && (
                                <AlertTriangle className="h-4 w-4 text-amber-500" title="Stok menipis!" />
                              )}
                              <span className={`font-black text-base px-2.5 py-0.5 rounded-full ${
                                p.stock <= 0
                                  ? 'bg-red-100 text-red-700 font-extrabold'
                                  : isLowStock
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'text-slate-800'
                              }`}>
                                {p.stock}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-500 max-w-[200px] truncate" title={p.description}>
                            {p.description || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
