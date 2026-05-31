import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/SettingsPage';
import FinanceProfilePage from './pages/FinanceProfilePage';
import UsersList from './components/UsersList';
import UserDetail from './components/UserDetail';
import CreateUser from './components/CreateUser';
import './App.css';

function NavBar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  const initials = user?.name
    ? user.name.trim().split(/\s+/).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '';

  return (
    <nav className="app-nav">
      <div className="nav-inner">
        <Link to={user ? (user.is_admin ? '/' : '/dashboard') : '/login'} className="nav-logo">
          <div className="nav-logo-icon">💰</div>
          <span className="nav-logo-text">FinTracker</span>
        </Link>

        <div className="nav-right">
          <button className="btn-icon theme-toggle" onClick={toggle} title="Сменить тему">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {user && (
            <Link to="/settings" className="btn btn-secondary btn-sm nav-settings-link">⚙️ Настройки</Link>
          )}
          {user && (
            <div className="nav-user-chip">
              <div className="nav-user-avatar">{initials}</div>
              <div className="nav-user-details">
                {user.is_admin && <span className="nav-badge">Администратор</span>}
                <span className="nav-user">{user.name}</span>
              </div>
            </div>
          )}
          {user && (
            <button className="btn btn-secondary btn-sm" onClick={logout}>Выйти</button>
          )}
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  const { user } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-body">
        <div className="footer-col footer-col-about">
          <p className="footer-desc">
            Отслеживайте расходы, ставьте цели и получайте советы от ИИ-советника.
          </p>
        </div>

        <div className="footer-col">
          <h6 className="footer-col-title">Навигация</h6>
          <ul className="footer-links">
            {user && !user.is_admin && (
              <li><Link to="/dashboard">Дашборд</Link></li>
            )}
            {user?.is_admin && (
              <li><Link to="/users">Пользователи</Link></li>
            )}
            {user && (
              <li><Link to="/finance-profile">Финансовый профиль</Link></li>
            )}
          </ul>
        </div>

        <div className="footer-col">
          <h6 className="footer-col-title">Аккаунт</h6>
          <ul className="footer-links">
            {user ? (
              <li><Link to="/settings">Настройки</Link></li>
            ) : (
              <>
                <li><Link to="/login">Войти</Link></li>
                <li><Link to="/register">Регистрация</Link></li>
              </>
            )}
          </ul>
        </div>

        <div className="footer-col">
          <h6 className="footer-col-title">О сервисе</h6>
          <ul className="footer-links">
            <li><span className="footer-link-static">Версия 1.0</span></li>
            <li><span className="footer-link-static">Сделано с ❤️</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} FinTracker. Все права защищены.</span>
        <span className="footer-bottom-right">Ваш личный финансовый помощник</span>
      </div>
    </footer>
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
              <Route path="/finance-profile" element={<RequireAuth><FinanceProfilePage /></RequireAuth>} />
                <Route path="/users" element={<RequireAdmin><UsersList /></RequireAdmin>} />
                <Route path="/users/:userId" element={<RequireAdmin><UserDetail /></RequireAdmin>} />
                <Route path="/create-user" element={<RequireAdmin><CreateUser /></RequireAdmin>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
