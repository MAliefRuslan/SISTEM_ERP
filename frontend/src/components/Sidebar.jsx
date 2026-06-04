import { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Receipt,
  Users,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Store
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  // Navigation menu grouped by sections
  const menuGroups = [
    {
      title: 'Utama',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'kasir'] },
        { name: 'Point of Sale', path: '/pos', icon: ShoppingCart, roles: ['admin', 'kasir'] },
      ],
    },
    {
      title: 'Inventory',
      items: [
        { name: 'Produk', path: '/products', icon: Package, roles: ['admin', 'kasir'] },
        { name: 'Supplier', path: '/suppliers', icon: Truck, roles: ['admin'] },
      ],
    },
    {
      title: 'Transaksi',
      items: [
        { name: 'Penjualan', path: '/sales', icon: Receipt, roles: ['admin', 'kasir'] },
        { name: 'Pembelian PO', path: '/purchases', icon: ShoppingCart, roles: ['admin'] },
      ],
    },
    {
      title: 'HR & Karyawan',
      items: [
        { name: 'Karyawan', path: '/employees', icon: Users, roles: ['admin'] },
        { name: 'Absensi', path: '/attendance', icon: UserCheck, roles: ['admin'] },
      ],
    },
    {
      title: 'Pengaturan',
      items: [
        { name: 'Kelola Akun', path: '/users', icon: Settings, roles: ['admin'] },
      ],
    },
  ];

  const filteredGroups = menuGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => item.roles.includes(user.role)),
    }))
    .filter(group => group.items.length > 0);

  return (
    <>
      {/* Mobile Header / Toggle Bar */}
      <div className="lg:hidden flex items-center justify-between bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="flex items-center space-x-2">
          <Store className="h-6 w-6 text-blue-500" />
          <span className="font-bold text-lg tracking-wider">SaaS ERP</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 focus:outline-none transition-colors"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 transform lg:transform-none transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo Section */}
        <div className="hidden lg:flex items-center space-x-3 p-6 border-b border-slate-800">
          <Store className="h-8 w-8 text-blue-500" />
          <span className="font-extrabold text-xl tracking-wider text-white">SaaS ERP</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredGroups.map((group, index) => (
            <div key={index} className="space-y-2">
              <h4 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={itemIdx}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                          : 'hover:bg-slate-800 hover:text-slate-100 text-slate-400'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User profile & Logout footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <span className={`inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                isAdmin ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
              }`}>
                {user.role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-red-600/20 hover:text-red-400 border border-slate-700 hover:border-red-600/30 rounded-lg text-sm font-medium transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
