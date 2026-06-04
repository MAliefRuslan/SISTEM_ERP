import { useState, useEffect } from 'react';
import api from '../api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', price: '', description: '' });
  const [transaction, setTransaction] = useState({ product_id: '', type: 'in', quantity: '' });

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/products', newProduct);
      setNewProduct({ name: '', sku: '', price: '', description: '' });
      fetchProducts();
    } catch (error) {
      console.error("Error creating product", error);
      alert("Failed to create product");
    }
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/inventory-transactions', transaction);
      setTransaction({ product_id: '', type: 'in', quantity: '' });
      fetchProducts();
      alert("Transaction successful!");
    } catch (error) {
      console.error("Error creating transaction", error);
      alert("Failed to create transaction");
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-medium mb-4">Add New Product</h2>
        <form onSubmit={handleCreateProduct} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input type="text" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">SKU</label>
            <input type="text" required value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Price</label>
            <input type="number" step="0.01" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Create Product
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-medium mb-4">Record Inventory Transaction</h2>
        <form onSubmit={handleTransaction} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Product</label>
            <select required value={transaction.product_id} onChange={e => setTransaction({...transaction, product_id: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border">
              <option value="">Select a product</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Type</label>
            <select required value={transaction.type} onChange={e => setTransaction({...transaction, type: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border">
              <option value="in">Stock In (+)</option>
              <option value="out">Stock Out (-)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Quantity</label>
            <input type="number" min="1" required value={transaction.quantity} onChange={e => setTransaction({...transaction, quantity: e.target.value})} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" />
          </div>
          <div className="sm:col-span-3">
            <button type="submit" className="inline-flex justify-center rounded-md border border-transparent bg-emerald-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
              Submit Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
