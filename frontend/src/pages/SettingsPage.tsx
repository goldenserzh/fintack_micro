import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { updateUser, updateProfile } from '../api';
import { useAuth } from '../context/AuthContext';
import { UpdateProfileRequest } from '../types';

export default function SettingsPage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  // Данные пользователя
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userSaving, setUserSaving] = useState(false);
  const [userSuccess, setUserSuccess] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  // Финансовый профиль
  const [profileData, setProfileData] = useState<UpdateProfileRequest>({
    income: user?.profile?.income ?? undefined,
    limit: user?.profile?.limit ?? undefined,
    goal: user?.profile?.goal ?? undefined,
    goal_amount: user?.profile?.goal_amount ?? undefined,
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

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

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileSaving(true);
    try {
      const updated = await updateProfile(user.user_id, profileData);
      setUser({ ...user, profile: updated });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      setProfileError(typeof detail === 'string' ? detail : 'Не удалось сохранить профиль');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="settings-page">
      <Link to="/dashboard" className="back-link">← Назад</Link>
      <h1 className="page-title" style={{ marginBottom: '1.75rem' }}>Настройки</h1>

      {/* Личные данные */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <h2 className="card-title">👤 Личные данные</h2>
        </div>
        <form onSubmit={handleUserSave}>
          <div className="settings-grid">
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
      </div>

      {/* Финансовый профиль */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <h2 className="card-title">💰 Финансовый профиль</h2>
        </div>
        <form onSubmit={handleProfileSave}>
          <div className="settings-grid">
            <div className="form-group">
              <label className="form-label">Доход в месяц (₽)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                placeholder="0"
                value={profileData.income ?? ''}
                onChange={e => setProfileData({ ...profileData, income: parseFloat(e.target.value) || undefined })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Лимит расходов (₽/мес)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                placeholder="0"
                value={profileData.limit ?? ''}
                onChange={e => setProfileData({ ...profileData, limit: parseFloat(e.target.value) || undefined })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Финансовая цель</label>
              <input
                className="form-input"
                type="text"
                placeholder="Например: накопить на машину"
                value={profileData.goal ?? ''}
                onChange={e => setProfileData({ ...profileData, goal: e.target.value || undefined })}
                maxLength={50}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Сумма цели (₽)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                placeholder="0"
                value={profileData.goal_amount ?? ''}
                onChange={e => setProfileData({ ...profileData, goal_amount: parseFloat(e.target.value) || null })}
              />
            </div>
          </div>
          {profileError && <div className="alert alert-error">{profileError}</div>}
          {profileSuccess && <div className="alert alert-success">Профиль успешно обновлён</div>}
          <button type="submit" className="btn btn-primary" disabled={profileSaving}>
            {profileSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      </div>

      {/* Выход */}
      <div className="card settings-danger-zone">
        <h2 className="card-title" style={{ marginBottom: '1rem' }}>⚠️ Зона опасности</h2>
        <button className="btn btn-danger" onClick={handleLogout}>
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
