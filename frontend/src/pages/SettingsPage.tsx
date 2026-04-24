import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { updateUser, deleteUser } from '../api';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userSaving, setUserSaving] = useState(false);
  const [userSuccess, setUserSuccess] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!user) return null;

  const handleUserSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);
    setUserSuccess(false);

    if (password && password !== confirmPassword) {
      setUserError('Пароли не совпадают');
      return;
    }
    if (password && password.length < 8) {
      setUserError('Пароль должен содержать минимум 8 символов');
      return;
    }

    setUserSaving(true);
    try {
      const payload: { name?: string; email?: string; password?: string } = {};
      if (name !== user.name) payload.name = name;
      if (email !== user.email) payload.email = email;
      if (password) payload.password = password;

      if (Object.keys(payload).length === 0) {
        setUserError('Нет изменений для сохранения');
        return;
      }

      const updated = await updateUser(user.user_id, payload);
      setUser({ ...user, ...updated });
      setPassword('');
      setConfirmPassword('');
      setUserSuccess(true);
      setTimeout(() => setUserSuccess(false), 3000);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      setUserError(typeof detail === 'string' ? detail : 'Не удалось сохранить данные');
    } finally {
      setUserSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteUser(user.user_id);
      logout();
      navigate('/login');
    } catch {
      setDeleteError('Не удалось удалить аккаунт. Попробуйте ещё раз.');
      setDeleteLoading(false);
      setDeleteConfirm(false);
    }
  };

  return (
    <div className="settings-page-full">
      <Link to="/dashboard" className="back-link">← Назад</Link>
      <h1 className="page-title" style={{ marginBottom: '1.75rem' }}>Настройки аккаунта</h1>

      <div className="settings-full-layout">
        {/* Личные данные */}
        <div className="card settings-main-card">
          <div className="card-header">
            <h2 className="card-title">👤 Личные данные</h2>
          </div>
          <form onSubmit={handleUserSave}>
            <div className="settings-grid-wide">
              <div className="form-group">
                <label className="form-label">Имя</label>
                <input
                  className="form-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  maxLength={30}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  maxLength={50}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Новый пароль</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Оставьте пустым, чтобы не менять"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={8}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Повторите пароль</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Повторите новый пароль"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            {userError && <div className="alert alert-error">{userError}</div>}
            {userSuccess && <div className="alert alert-success">Данные успешно сохранены</div>}
            <button type="submit" className="btn btn-primary" disabled={userSaving}>
              {userSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </form>

          {/* Удаление аккаунта — прямо внутри той же карточки, через разделитель */}
          <div className="delete-account-section">
            <div className="delete-account-header">
              <div>
                <span className="delete-account-title">Удалить аккаунт</span>
                <span className="delete-account-warning">
                  Все ваши данные, транзакции и настройки будут удалены навсегда без возможности восстановления.
                </span>
              </div>
              {!deleteConfirm ? (
                <button className="btn btn-danger" onClick={() => setDeleteConfirm(true)}>
                  Удалить аккаунт
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-danger" onClick={handleDeleteAccount} disabled={deleteLoading}>
                    {deleteLoading ? 'Удаление...' : 'Да, удалить'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setDeleteConfirm(false)} disabled={deleteLoading}>
                    Отмена
                  </button>
                </div>
              )}
            </div>
            {deleteError && <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>{deleteError}</div>}
          </div>
        </div>

        {/* Боковая панель — информация об аккаунте */}
        <div className="settings-side-panel">
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>Информация</h3>
            <div className="fp-info-row">
              <span className="fp-info-label">Имя</span>
              <span className="fp-info-value">{user.name}</span>
            </div>
            <div className="fp-info-row">
              <span className="fp-info-label">Email</span>
              <span className="fp-info-value" style={{ wordBreak: 'break-all' }}>{user.email}</span>
            </div>
            <div className="fp-info-row">
              <span className="fp-info-label">Роль</span>
              <span className="fp-info-value">{user.is_admin ? 'Администратор' : 'Пользователь'}</span>
            </div>
            <div className="fp-info-row">
              <span className="fp-info-label">Аккаунт создан</span>
              <span className="fp-info-value">
                {new Date(user.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
