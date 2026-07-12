import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, PERMISSIONS } from './lib/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ChangePassword from './pages/ChangePassword/ChangePassword';
import Dashboard from './pages/Dashboard/Dashboard';
import Fleet from './pages/Fleet/Fleet';
import Drivers from './pages/Drivers/Drivers';
import Trips from './pages/Trips/Trips';
import Maintenance from './pages/Maintenance/Maintenance';
import FuelExpenses from './pages/FuelExpenses/FuelExpenses';
import Analytics from './pages/Analytics/Analytics';
import Settings from './pages/Settings/Settings';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.mustChangePassword) return <Navigate to="/change-password" replace />;
  return <>{children}</>;
}

function RoleRoute({ resource, children }: { resource: string; children: React.ReactNode }) {
  const { can, user } = useAuth();
  if (!can(resource)) {
    const allowed = PERMISSIONS[user?.role ?? ''] ?? [];
    const first = allowed[0] ? `/${allowed[0]}` : '/dashboard';
    return <Navigate to={first} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"     element={<RoleRoute resource="dashboard">    <Dashboard />    </RoleRoute>} />
            <Route path="fleet"         element={<RoleRoute resource="fleet">        <Fleet />        </RoleRoute>} />
            <Route path="drivers"       element={<RoleRoute resource="drivers">      <Drivers />      </RoleRoute>} />
            <Route path="trips"         element={<RoleRoute resource="trips">        <Trips />        </RoleRoute>} />
            <Route path="maintenance"   element={<RoleRoute resource="maintenance">  <Maintenance />  </RoleRoute>} />
            <Route path="fuel-expenses" element={<RoleRoute resource="fuel-expenses"><FuelExpenses /> </RoleRoute>} />
            <Route path="analytics"     element={<RoleRoute resource="analytics">    <Analytics />    </RoleRoute>} />
            <Route path="settings"      element={<RoleRoute resource="settings">     <Settings />     </RoleRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
