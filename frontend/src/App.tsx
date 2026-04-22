import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/SettingsPage';
import UsersList from './components/UsersList';
import UserDetail from './components/UserDetail';
import CreateUser from './components/CreateUser';
import './App.css';

function NavBar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <nav className="app-nav">
      <Link to={user ? (user.is_admin ? '/' : '/dashboard') : '/login'} className="nav-logo">
        <div className="nav-logo-icon">💰</div>
        FinTracker
      </Link>
      <div className="nav-right">
        {user?.is_admin && <span className="nav-badge">Администратор</span>}
        {user && <span className="nav-user">{user.name}</span>}
        <button className="btn-icon theme-toggle" onClick={toggle} title="Сменить тему">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        {user && (
          <button className="btn btn-secondary btn-sm" onClick={logout}>Выйти</button>
        )}
      </div>
    </nav>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_admin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.is_admin) return <UsersList />;
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app">
            <NavBar />
            <main className="app-main">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/" element={<RequireAuth><RootRedirect /></RequireAuth>} />
                <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
                <Route path="/users" element={<RequireAdmin><UsersList /></RequireAdmin>} />
                <Route path="/users/:userId" element={<RequireAdmin><UserDetail /></RequireAdmin>} />
                <Route path="/create-user" element={<RequireAdmin><CreateUser /></RequireAdmin>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
