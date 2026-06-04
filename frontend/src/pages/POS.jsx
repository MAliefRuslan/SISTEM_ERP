import { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle,
  Loader2,
  Receipt,
  User,
  CreditCard,
  QrCode,
  DollarSign
} from 'lucide-react';

export default function POS() {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null); // stores invoice data on success

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/products');
      setProducts(response.data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat produk. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Filter products by search query
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  // Add product to cart
  const addToCart = (product) => {
    if (product.stock <= 0) return;

    setCart(prevCart => {
      const existing = prevCart.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Stok produk "${product.name}" terbatas (${product.stock} pcs).`);
          return prevCart;
        }
        return prevCart.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price }
            : item
        );
      } else {
        return [...prevCart, {
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          unit_price: parseFloat(product.price),
          quantity: 1,
          subtotal: parseFloat(product.price),
          stock: product.stock
        }];
      }
    });
  };

  // Update quantity of product in cart
  const updateQuantity = (productId, change) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product_id === productId) {
          const newQty = item.quantity + change;
          if (newQty <= 0) return null;
          if (newQty > item.stock) {
            alert(`Stok produk "${item.name}" terbatas (${item.stock} pcs).`);
            return item;
          }
          return {
            ...item,
            quantity: newQty,
            subtotal: newQty * item.unit_price
          };
        }
        return item;
      }).filter(Boolean);
    });
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product_id !== productId));
  };

  // Calculate total
  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  // Submit sale / POS checkout
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong!');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      const payload = {
        customer_name: customerName,
        payment_method: paymentMethod,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      };

      const response = await api.post('/api/sales', payload);
      setSuccessData(response.data);
      setCart([]);
      setCustomerName('Walk-in Customer');
      setPaymentMethod('cash');
      
      // Refresh products to show updated stock
      fetchProducts();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Terjadi kesalahan saat memproses transaksi.';
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Kasir (Point of Sale)</h1>
          <p className="text-slate-500 mt-1">Kelola transaksi penjualan dengan mudah dan cepat</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-sm font-medium text-slate-600 uppercase">Perusahaan ID: {user?.companyId}</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center space-x-2">
          <span>⚠️</span>
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Main Grid: Left Grid, Right Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Search & Product Selection (7/12 width) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari produk berdasarkan nama atau SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-3 w-full bg-white border border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
            />
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              <p className="text-slate-500 mt-3 text-sm">Memuat daftar produk...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500">
              <p className="font-medium text-lg">Produk tidak ditemukan</p>
              <p className="text-sm text-slate-400 mt-1">Coba kata kunci lain atau tambahkan produk baru.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map(product => {
                const isOutOfStock = product.stock <= 0;
                const inCartItem = cart.find(item => item.product_id === product.id);
                const quantityInCart = inCartItem ? inCartItem.quantity : 0;
                const remainingStock = product.stock - quantityInCart;

                return (
                  <button
                    key={product.id}
                    disabled={isOutOfStock || remainingStock <= 0}
                    onClick={() => addToCart(product)}
                    className={`text-left flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isOutOfStock || remainingStock <= 0
                        ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed select-none'
                        : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-100 rounded-md text-slate-600 tracking-wider">
                          {product.sku}
                        </span>
                        {quantityInCart > 0 && (
                          <span className="text-xs font-bold px-2 py-0.5 bg-blue-600 text-white rounded-full">
                            {quantityInCart}x
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-800 text-base line-clamp-2 min-h-[3rem]">{product.name}</h3>
                    </div>

                    <div className="mt-4 flex items-end justify-between w-full">
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Harga</p>
                        <p className="text-base font-bold text-slate-900">{formatPrice(product.price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Stok</p>
                        <p className={`text-xs font-bold ${
                          product.stock <= 5 ? 'text-red-500' : 'text-slate-600'
                        }`}>
                          {isOutOfStock ? 'Habis' : `${product.stock} unit`}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Cart & Checkout (5/12 width) */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm sticky top-24 overflow-hidden">
            
            {/* Cart Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-blue-400" />
                <h2 className="font-bold text-lg">Keranjang Belanja</h2>
              </div>
              <span className="bg-blue-600 text-white font-bold text-xs px-2.5 py-1 rounded-full">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} Item
              </span>
            </div>

            {/* Cart List */}
            <div className="p-5 max-h-[350px] overflow-y-auto divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <ShoppingCart className="h-12 w-12 mx-auto stroke-1 text-slate-300 mb-3" />
                  <p className="text-sm font-medium">Belum ada produk di keranjang</p>
                  <p className="text-xs mt-1">Klik produk di samping untuk menambahkan</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product_id} className="py-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{formatPrice(item.unit_price)} / unit</p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.product_id, -1)}
                        className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-sm font-bold text-slate-800 w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, 1)}
                        className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="text-right w-24">
                      <p className="text-sm font-bold text-slate-800">{formatPrice(item.subtotal)}</p>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Total Area */}
            <div className="bg-slate-50 p-5 border-t border-slate-100 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Grand Total</span>
                <span className="text-2xl font-black text-slate-900">{formatPrice(cartTotal)}</span>
              </div>
            </div>

            {/* Checkout Form */}
            <form onSubmit={handleCheckout} className="p-5 border-t border-slate-100 space-y-4">
              {/* Customer Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Nama Pelanggan
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="pl-9 pr-3 py-2 w-full border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Method Pills */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: 'Tunai', icon: DollarSign },
                    { id: 'transfer', label: 'Transfer', icon: CreditCard },
                    { id: 'qris', label: 'QRIS', icon: QrCode }
                  ].map(method => {
                    const Icon = method.icon;
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex flex-col items-center justify-center py-2.5 px-3 border rounded-xl font-semibold text-xs transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        <span>{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bayar Button */}
              <button
                type="submit"
                disabled={cart.length === 0 || isSubmitting}
                className="w-full flex items-center justify-center space-x-2 py-3.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-bold text-base rounded-xl transition-all shadow-lg hover:shadow-green-600/20 focus:outline-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Memproses Transaksi...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    <span>Bayar Sekarang ({formatPrice(cartTotal)})</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Invoice Success Modal */}
      {successData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden transform transition-all border border-slate-100">
            <div className="bg-green-500 text-white p-6 text-center space-y-2">
              <CheckCircle className="h-12 w-12 mx-auto text-white" />
              <h3 className="text-xl font-bold">Transaksi Berhasil!</h3>
              <p className="text-xs text-green-100">Pembayaran telah terverifikasi sistem</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center font-mono py-1 px-3 bg-slate-50 border border-slate-100 rounded text-slate-600 text-sm">
                Invoice: <span className="font-bold text-slate-900">{successData.invoice_number}</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pelanggan</span>
                  <span className="font-semibold text-slate-800">{successData.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode Bayar</span>
                  <span className="font-semibold uppercase text-slate-800">{successData.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(successData.created_at).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Total Bayar</span>
                  <span className="text-lg font-bold text-green-600">{formatPrice(successData.total_amount)}</span>
                </div>
              </div>

              {/* Items detail list in receipt */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                  <Receipt className="h-3.5 w-3.5 mr-1" />
                  Detail Belanja
                </p>
                {successData.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-slate-600 truncate max-w-[200px]">
                      {item.product_name} <span className="text-slate-400">({item.quantity}x)</span>
                    </span>
                    <span className="font-semibold text-slate-800">{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2 px-4 border border-slate-300 rounded-xl font-bold text-sm text-slate-700 bg-white hover:bg-slate-50 transition"
              >
                Cetak Struk
              </button>
              <button
                onClick={() => setSuccessData(null)}
                className="flex-1 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition"
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
