import { useState } from 'react';
import { Link } from 'react-router-dom';
import { updateProfile } from '../api';
import { useAuth } from '../context/AuthContext';
import { UpdateProfileRequest } from '../types';

export default function FinanceProfilePage() {
  const { user, setUser } = useAuth();

  const [data, setData] = useState<UpdateProfileRequest>({
    income: user?.profile?.income ?? undefined,
    limit: user?.profile?.limit ?? undefined,
    goal: user?.profile?.goal ?? undefined,
    goal_amount: user?.profile?.goal_amount ?? undefined,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const updated = await updateProfile(user.user_id, data);
      setUser({ ...user, profile: updated });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Не удалось сохранить профиль');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="finance-profile-page">
      <Link to="/dashboard" className="back-link">← На главную</Link>
      <h1 className="page-title" style={{ marginBottom: '0.4rem' }}>Финансовый профиль</h1>
      <p className="page-subtitle" style={{ marginBottom: '1.75rem' }}>
        Настройте доход, лимит расходов и финансовую цель
      </p>

      <div className="fp-layout">
        {/* Доход и лимит */}
        <form onSubmit={handleSave} className="fp-form-area">
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="card-header">
              <h2 className="card-title">💵 Доходы и лимиты</h2>
            </div>
            <div className="fp-grid">
              <div className="form-group">
                <label className="form-label">Ежемесячный доход (₽)</label>
                <p className="form-hint">Фиксированная зарплата — система суммирует её автоматически</p>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={data.income ?? ''}
                  onChange={e => setData({ ...data, income: parseFloat(e.target.value) || undefined })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Лимит расходов в месяц (₽)</label>
                <p className="form-hint">Система предупредит при приближении к лимиту</p>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={data.limit ?? ''}
                  onChange={e => setData({ ...data, limit: parseFloat(e.target.value) || undefined })}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="card-header">
              <h2 className="card-title">🎯 Финансовая цель</h2>
            </div>
            <div className="fp-grid">
              <div className="form-group">
                <label className="form-label">Название цели</label>
                <p className="form-hint">Например: накопить на машину, отпуск в Японии</p>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Опишите вашу цель"
                  value={data.goal ?? ''}
                  onChange={e => setData({ ...data, goal: e.target.value || undefined })}
                  maxLength={50}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Целевая сумма (₽)</label>
                <p className="form-hint">Прогресс накоплений будет показан на главной странице</p>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={data.goal_amount ?? ''}
                  onChange={e => setData({ ...data, goal_amount: parseFloat(e.target.value) || null })}
                />
              </div>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">Финансовый профиль обновлён</div>}

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 160 }}>
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </form>

        {/* Текущий профиль — инфо-панель */}
        <div className="fp-info-panel">
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>Текущий профиль</h3>
            <div className="fp-info-row">
              <span className="fp-info-label">Доход / мес</span>
              <span className="fp-info-value text-green">
                {user.profile?.income ? `+${Number(user.profile.income).toLocaleString('ru-RU')} ₽` : '—'}
              </span>
            </div>
            <div className="fp-info-row">
              <span className="fp-info-label">Лимит расходов</span>
              <span className="fp-info-value">
                {user.profile?.limit ? `${Number(user.profile.limit).toLocaleString('ru-RU')} ₽` : '—'}
              </span>
            </div>
            <div className="fp-info-row">
              <span className="fp-info-label">Цель</span>
              <span className="fp-info-value">{user.profile?.goal ?? '—'}</span>
            </div>
            <div className="fp-info-row">
              <span className="fp-info-label">Сумма цели</span>
              <span className="fp-info-value">
                {user.profile?.goal_amount ? `${Number(user.profile.goal_amount).toLocaleString('ru-RU')} ₽` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
