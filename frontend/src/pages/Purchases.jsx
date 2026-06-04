import { useState, useEffect } from 'react';
import api from '../api';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  X, 
  Eye, 
  Check, 
  FileText, 
  ShoppingCart,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  
  // Create PO Form State
  const [form, setForm] = useState({
    supplier_id: '',
    notes: '',
    items: [{ product_id: '', quantity: 1, unit_price: 0, subtotal: 0 }]
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch list data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [purchasesRes, suppliersRes, productsRes] = await Promise.all([
        api.get('/api/purchases'),
        api.get('/api/suppliers'),
        api.get('/api/products')
      ]);

      setPurchases(purchasesRes.data);
      setSuppliers(suppliersRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data pembelian.');
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

  // Open Create PO Modal
  const openCreateModal = () => {
    setForm({
      supplier_id: '',
      notes: '',
      items: [{ product_id: '', quantity: 1, unit_price: 0, subtotal: 0 }]
    });
    setIsCreateOpen(true);
  };

  // Add a product item row
  const addRow = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1, unit_price: 0, subtotal: 0 }]
    }));
  };

  // Remove a product item row
  const removeRow = (index) => {
    setForm(prev => {
      const items = [...prev.items];
      items.splice(index, 1);
      return { ...prev, items };
    });
  };

  // Handle PO row input changes
  const handleItemChange = (index, field, value) => {
    setForm(prev => {
      const items = prev.items.map((item, idx) => {
        if (idx !== index) return item;
        
        const updatedItem = { ...item, [field]: value };
        
        // Auto-fill price from product when product is selected
        if (field === 'product_id') {
          const selectedProd = products.find(p => p.id === parseInt(value));
          updatedItem.unit_price = selectedProd ? parseFloat(selectedProd.price) : 0;
        }

        const qty = parseInt(updatedItem.quantity) || 0;
        const price = parseFloat(updatedItem.unit_price) || 0;
        updatedItem.subtotal = qty * price;

        return updatedItem;
      });

      return { ...prev, items };
    });
  };

  // Calculate PO Form grand total
  const formGrandTotal = form.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);

  // Submit Create PO
  const handleCreatePO = async (e) => {
    e.preventDefault();
    if (!form.supplier_id) {
      alert('Pilih supplier terlebih dahulu!');
      return;
    }

    // Validate items
    const invalidItem = form.items.find(item => !item.product_id || item.quantity <= 0);
    if (invalidItem) {
      alert('Terdapat item produk yang tidak valid atau kuantitas kurang dari 1.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/purchases', form);
      setIsCreateOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Gagal membuat purchase order.');
    } finally {
      setSubmitting(false);
    }
  };

  // Update PO Status (e.g. Receive stock)
  const handleReceiveStock = async (id, orderNumber) => {
    if (confirm(`Apakah Anda yakin ingin memproses penerimaan barang untuk PO "${orderNumber}"?\nTindakan ini akan menambahkan stok produk ke sistem.`)) {
      try {
        await api.put('/api/purchases', { id, status: 'received' });
        alert('Stok barang berhasil diperbarui!');
        fetchData();
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.error || 'Gagal memproses penerimaan barang.');
      }
    }
  };

  // View single PO detail
  const viewDetail = async (id) => {
    try {
      setLoadingDetail(true);
      const response = await api.get(`/api/purchases?id=${id}`);
      setSelectedPurchase(response.data);
    } catch (err) {
      console.error(err);
      alert('Gagal memuat detail purchase order.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const getStatusBadge = (status) => {
    const style = {
      pending: 'bg-amber-50 text-amber-700 ring-amber-600/20 border-amber-200',
      received: 'bg-green-50 text-green-700 ring-green-600/20 border-green-200',
      cancelled: 'bg-red-50 text-red-700 ring-red-600/20 border-red-200'
    }[status.toLowerCase()] || 'bg-slate-50 text-slate-700 ring-slate-600/20 border-slate-200';

    return (
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold uppercase border ${style}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Pembelian (Purchase Orders)</h1>
          <p className="text-slate-500 mt-1">Kelola pemesanan barang ke supplier dan sinkronisasi stok masuk</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 px-5 rounded-xl transition shadow-lg shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Buat PO Baru</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          <p className="text-slate-500 mt-3 text-sm">Memuat data PO...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-center border border-red-200 text-red-600 rounded-2xl">
          <p className="font-bold">{error}</p>
          <button onClick={fetchData} className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold">
            Coba Lagi
          </button>
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-500">
          <ShoppingCart className="h-14 w-14 text-slate-300 mx-auto stroke-1 mb-3" />
          <p className="font-semibold text-lg">Belum ada data purchase order</p>
          <p className="text-slate-400 text-sm mt-1">Klik tombol di atas untuk membuat PO pertama Anda.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-100">
                  <th className="p-4">No PO</th>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Total Item</th>
                  <th className="p-4 text-right">Total Biaya</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {purchases.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold font-mono text-slate-900">{po.order_number}</td>
                    <td className="p-4 text-slate-600">
                      {new Date(po.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="p-4 text-slate-800 font-medium">{po.supplier_name}</td>
                    <td className="p-4 text-slate-600">{po.item_count} item</td>
                    <td className="p-4 text-right font-bold text-slate-900">{formatPrice(po.total_amount)}</td>
                    <td className="p-4">{getStatusBadge(po.status)}</td>
                    <td className="p-4 text-center">
                      <div className="inline-flex space-x-2">
                        <button
                          onClick={() => viewDetail(po.id)}
                          className="inline-flex items-center space-x-1 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 py-1.5 px-3 rounded-lg text-xs font-bold transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Detail</span>
                        </button>
                        {po.status === 'pending' && (
                          <button
                            onClick={() => handleReceiveStock(po.id, po.order_number)}
                            className="inline-flex items-center space-x-1 bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 py-1.5 px-3 rounded-lg text-xs font-bold transition"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Terima</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE PO MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-lg">Buat Purchase Order Baru</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreatePO} className="flex-1 overflow-y-auto flex flex-col">
              <div className="p-6 space-y-6 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Supplier */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Pilih Supplier *
                    </label>
                    <select
                      required
                      value={form.supplier_id}
                      onChange={e => setForm({ ...form, supplier_id: e.target.value })}
                      className="py-2.5 px-3 w-full border border-slate-300 bg-white rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">-- Pilih Supplier --</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.contact_person || 'No Contact'})</option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Catatan Tambahan
                    </label>
                    <input
                      type="text"
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      placeholder="Contoh: Pengiriman via darat, dll."
                      className="py-2.5 px-3 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Items Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-slate-700">Daftar Produk PO</h4>
                    <button
                      type="button"
                      onClick={addRow}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Tambah Item</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {/* Table Headers */}
                    <div className="bg-slate-50 p-3 grid grid-cols-12 gap-3 text-xs font-bold text-slate-500 uppercase">
                      <div className="col-span-5">Produk</div>
                      <div className="col-span-2">Kuantitas</div>
                      <div className="col-span-3">Harga Beli</div>
                      <div className="col-span-2 text-right">Subtotal</div>
                    </div>

                    {/* Rows */}
                    {form.items.map((item, index) => (
                      <div key={index} className="p-3 grid grid-cols-12 gap-3 items-center text-sm">
                        {/* Product selection */}
                        <div className="col-span-5 flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            disabled={form.items.length === 1}
                            className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-50 disabled:hover:text-slate-400 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <select
                            required
                            value={item.product_id}
                            onChange={e => handleItemChange(index, 'product_id', e.target.value)}
                            className="py-2 px-2.5 w-full border border-slate-300 bg-white rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                          >
                            <option value="">Pilih Produk</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="py-2 px-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        {/* Price */}
                        <div className="col-span-3">
                          <input
                            type="number"
                            min="0"
                            required
                            value={item.unit_price}
                            onChange={e => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="py-2 px-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        {/* Subtotal */}
                        <div className="col-span-2 text-right font-bold text-slate-800">
                          {formatPrice(item.subtotal)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Grand Total Summary */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">Estimasi Grand Total Pembelian:</span>
                  <span className="text-xl font-black text-slate-900">{formatPrice(formGrandTotal)}</span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
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
                  <span>Buat PO</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAIL PO MODAL */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-lg">Detail Purchase Order</h3>
              </div>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Detail Body */}
            <div className="p-6 space-y-6">
              {/* Stats & Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No. Purchase Order</p>
                  <p className="font-bold font-mono text-slate-900 mt-0.5">{selectedPurchase.order_number}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status PO</p>
                  <div className="mt-0.5">{getStatusBadge(selectedPurchase.status)}</div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supplier</p>
                  <p className="font-semibold text-slate-850 mt-0.5">{selectedPurchase.supplier_name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tanggal Dibuat</p>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {new Date(selectedPurchase.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
                {selectedPurchase.notes && (
                  <div className="col-span-2 border-t border-slate-200/60 pt-2 mt-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Catatan</p>
                    <p className="text-slate-700 mt-0.5">{selectedPurchase.notes}</p>
                  </div>
                )}
              </div>

              {/* Items detail list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Detail Item Barang Masuk</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  <div className="bg-slate-50 p-3 grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 uppercase">
                    <div className="col-span-6">Nama Produk</div>
                    <div className="col-span-2 text-center">Kuantitas</div>
                    <div className="col-span-4 text-right">Harga Satuan</div>
                  </div>
                  {selectedPurchase.items?.map((item, index) => (
                    <div key={index} className="p-3 grid grid-cols-12 gap-2 text-sm items-center">
                      <div className="col-span-6">
                        <p className="font-semibold text-slate-800">{item.product_name}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{item.product_sku}</p>
                      </div>
                      <div className="col-span-2 text-center font-bold text-slate-700">{item.quantity} unit</div>
                      <div className="col-span-4 text-right font-semibold text-slate-900">{formatPrice(item.unit_price)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Area */}
              <div className="flex justify-between items-center border-t border-slate-200 pt-4">
                <div className="flex items-center text-xs font-medium text-slate-400">
                  <Calendar className="h-4 w-4 mr-1 shrink-0" />
                  <span>Dibuat oleh: {selectedPurchase.creator_name || 'Admin'}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Biaya PO</p>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">{formatPrice(selectedPurchase.total_amount)}</p>
                </div>
              </div>

              {/* Conditional Alert for pending POs */}
              {selectedPurchase.status === 'pending' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-bold">Barang Belum Diterima</p>
                    <p className="mt-0.5 text-amber-700">Untuk menambahkan stok produk ini secara otomatis, klik tombol "Terima Barang" di bawah ini.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
              {selectedPurchase.status === 'pending' && (
                <button
                  onClick={() => {
                    const po = selectedPurchase;
                    setSelectedPurchase(null);
                    handleReceiveStock(po.id, po.order_number);
                  }}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition"
                >
                  Terima Barang
                </button>
              )}
              <button
                onClick={() => setSelectedPurchase(null)}
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
