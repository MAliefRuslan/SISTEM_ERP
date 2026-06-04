import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

// Components
import Sidebar from './components/Sidebar';

// Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Login from './pages/Login';
import Register from './pages/Register';
import POS from './pages/POS';
import Sales from './pages/Sales';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import UserManagement from './pages/UserManagement';

function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') {
    // Redirect non-admins to dashboard
    return <Navigate to="/" />;
  }
  return children;
}

function App() {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-slate-55 text-slate-900 font-sans flex flex-col lg:flex-row">
      {user && <Sidebar />}

      <div className={`flex-grow flex flex-col min-h-screen bg-slate-50/50 ${user ? 'lg:pl-64' : ''}`}>
        <main className="flex-grow p-4 md:p-6 lg:p-8">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Authenticated Routes (Both Admin and Kasir) */}
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
            <Route path="/pos" element={<PrivateRoute><POS /></PrivateRoute>} />
            <Route path="/sales" element={<PrivateRoute><Sales /></PrivateRoute>} />

            {/* Admin Only Routes */}
            <Route path="/suppliers" element={<AdminRoute><Suppliers /></AdminRoute>} />
            <Route path="/purchases" element={<AdminRoute><Purchases /></AdminRoute>} />
            <Route path="/employees" element={<AdminRoute><Employees /></AdminRoute>} />
            <Route path="/attendance" element={<AdminRoute><Attendance /></AdminRoute>} />
            <Route path="/users" element={<AdminRoute><UserManagement /></AdminRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
