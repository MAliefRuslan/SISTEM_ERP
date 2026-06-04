import { useState, useEffect } from 'react';
import axios from 'axios';
import echo from '../echo';

export default function Dashboard() {
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();

    // Listen for real-time stock updates
    echo.channel('inventory')
      .listen('StockUpdated', (e) => {
        console.log('Stock updated event received:', e);
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.id === e.product.id ? e.product : p
          )
        );
      });

    return () => {
      echo.leaveChannel('inventory');
    };
  }, []);

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Real-Time Inventory Dashboard</h1>
        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
          <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          Live
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map(product => (
          <div key={product.id} className="bg-white overflow-hidden shadow-sm rounded-xl border border-slate-200 transition-all hover:shadow-md">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-slate-900">{product.name}</h3>
                <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{product.sku}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500 line-clamp-2">{product.description || 'No description'}</p>
              
              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Current Stock</p>
                  <p className={`text-3xl font-bold mt-1 ${product.stock < 10 ? 'text-red-600' : 'text-slate-900'}`}>
                    {product.stock}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-500">Price</p>
                  <p className="text-lg font-semibold text-slate-700">${product.price}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
            No products found. Start by adding some products.
          </div>
        )}
      </div>
    </div>
  );
}
