import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUser, getTransactions, createTransaction, deleteTransaction, updateProfile } from '../api';
import { User, Transaction, CreateTransactionRequest, UpdateProfileRequest } from '../types';

const CATEGORIES = [
  { id: 'food',          label: 'Еда',           color: '#f59e0b', bg: 'rgba(245,158,11,0.14)',   icon: '🍔' },
  { id: 'transport',     label: 'Транспорт',      color: '#60a5fa', bg: 'rgba(96,165,250,0.14)',   icon: '🚗' },
  { id: 'entertainment', label: 'Развлечения',    color: '#c084fc', bg: 'rgba(192,132,252,0.14)',  icon: '🎮' },
  { id: 'shopping',      label: 'Покупки',        color: '#f472b6', bg: 'rgba(244,114,182,0.14)',  icon: '🛍️' },
  { id: 'health',        label: 'Здоровье',       color: '#2dd4a6', bg: 'rgba(45,212,166,0.14)',   icon: '💊' },
  { id: 'income',        label: 'Доход',          color: '#2dd4a6', bg: 'rgba(45,212,166,0.14)',   icon: '💰' },
  { id: 'other',         label: 'Прочее',         color: '#8888a8', bg: 'rgba(136,136,168,0.14)', icon: '📦' },
];

function getCat(id: string) {
  return CATEGORIES.find(c => c.id === id.toLowerCase()) ?? CATEGORIES[CATEGORIES.length - 1];
}

function fmt(n: number | string): string {
  return Number(n).toLocaleString('ru-RU');
}

const AVATAR_COLORS = ['#7c6dfa', '#2dd4a6', '#f06b6b', '#f59e0b', '#60a5fa', '#c084fc', '#fb923c', '#f472b6'];
function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const UserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newTx, setNewTx] = useState<CreateTransactionRequest>({ name: '', amount: 0, category: 'other' });
  const [txSubmitting, setTxSubmitting] = useState(false);

  const [editProfile, setEditProfile] = useState<UpdateProfileRequest>({});
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const id = parseInt(userId);
    Promise.all([
      getUser(id).then(setUser),
      getTransactions(id).then(setTransactions),
    ])
      .catch(() => setError('Не удалось загрузить данные'))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setTxSubmitting(true);
    try {
      const tx = await createTransaction(parseInt(userId), newTx);
      setTransactions(prev => [tx, ...prev]);
      setNewTx({ name: '', amount: 0, category: 'other' });
    } catch {
      setError('Не удалось добавить транзакцию');
    } finally {
      setTxSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (txId: number) => {
    if (!userId) return;
    try {
      await deleteTransaction(parseInt(userId), txId);
      setTransactions(prev => prev.filter(t => t.transaction_id !== txId));
    } catch {
      setError('Не удалось удалить транзакцию');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setProfileSubmitting(true);
    try {
      const updated = await updateProfile(parseInt(userId), editProfile);
      setUser(prev => prev ? { ...prev, profile: updated } : prev);
      setEditProfile({});
      setShowProfileEdit(false);
    } catch {
      setError('Не удалось обновить профиль');
    } finally {
      setProfileSubmitting(false);
    }
  };

  if (loading) return (
    <div className="page-loading">
      <div className="spinner" />
      <span>Загрузка...</span>
    </div>
  );

  if (!user) return (
    <div className="alert alert-error">
      Пользователь не найден.{' '}
      <Link to="/" className="btn btn-secondary btn-sm" style={{ marginLeft: '0.5rem' }}>Назад</Link>
    </div>
  );

  const profile = user.profile;
  const spent = transactions
    .filter(t => t.category.toLowerCase() !== 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const limitPct = profile?.limit ? Math.min((spent / Number(profile.limit)) * 100, 100) : 0;
  const balance = profile ? Number(profile.income) - spent : 0;

  return (
    <div>
      <Link to="/users" className="back-link">← Все пользователи</Link>

      {/* Header */}
      <div className="user-header">
        <div className="user-header-avatar" style={{ background: avatarColor(user.name) }}>
          {initials(user.name)}
        </div>
        <div>
          <h1 className="page-title">{user.name}</h1>
          <p className="page-subtitle">
            {user.email} · С {new Date(user.created_at).toLocaleDateString('ru-RU')}
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stats */}
      {profile && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Доход</span>
            <span className="stat-value text-green">+{fmt(profile.income)} ₽</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Потрачено</span>
            <span className="stat-value text-red">{fmt(spent)} ₽</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Лимит</span>
            <span className="stat-value">{fmt(profile.limit)} ₽</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Остаток</span>
            <span className={`stat-value ${balance >= 0 ? 'text-green' : 'text-red'}`}>
              {fmt(balance)} ₽
            </span>
          </div>
        </div>
      )}

      {/* Limit progress */}
      {profile?.limit && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="progress-header">
            <span>Расходы vs Лимит</span>
            <span className={limitPct >= 90 ? 'text-red' : limitPct >= 70 ? 'text-yellow' : 'text-green'}>
              {fmt(spent)} / {fmt(profile.limit)} ₽ ({Math.round(limitPct)}%)
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${limitPct}%`,
                background: limitPct >= 90 ? '#f06b6b' : limitPct >= 70 ? '#f59e0b' : '#2dd4a6',
              }}
            />
          </div>
          {profile.goal && (
            <div className="goal-badge">🎯 Цель: {profile.goal}</div>
          )}
        </div>
      )}

      {/* Profile */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <h2 className="card-title">Финансовый профиль</h2>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => { setShowProfileEdit(v => !v); setEditProfile({}); }}
          >
            {showProfileEdit ? 'Отмена' : '✏️ Изменить'}
          </button>
        </div>

        {!profile ? (
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Профиль не настроен</p>
        ) : !showProfileEdit ? (
          <div className="profile-info">
            <div className="profile-item">
              <span className="profile-item-label">Доход</span>
              <span className="profile-item-value">{fmt(profile.income)} ₽/мес</span>
            </div>
            <div className="profile-item">
              <span className="profile-item-label">Лимит расходов</span>
              <span className="profile-item-value">{fmt(profile.limit)} ₽/мес</span>
            </div>
            <div className="profile-item">
              <span className="profile-item-label">Финансовая цель</span>
              <span className="profile-item-value">{profile.goal || '—'}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile} className="form-inline">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Доход (₽/мес)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                placeholder={String(profile.income)}
                value={editProfile.income ?? ''}
                onChange={e => setEditProfile({ ...editProfile, income: parseFloat(e.target.value) || undefined })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Лимит (₽/мес)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                placeholder={String(profile.limit)}
                value={editProfile.limit ?? ''}
                onChange={e => setEditProfile({ ...editProfile, limit: parseFloat(e.target.value) || undefined })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Финансовая цель</label>
              <input
                className="form-input"
                type="text"
                placeholder={profile.goal || 'Например: накопить на авто'}
                value={editProfile.goal ?? ''}
                onChange={e => setEditProfile({ ...editProfile, goal: e.target.value || undefined })}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={profileSubmitting}>
              {profileSubmitting ? '...' : 'Сохранить'}
            </button>
          </form>
        )}
      </div>

      {/* Transactions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Транзакции</h2>
          <span className="badge">{transactions.length}</span>
        </div>

        {/* Add form */}
        <form onSubmit={handleCreateTransaction} className="add-tx-form">
          <input
            className="form-input"
            type="text"
            placeholder="Название"
            value={newTx.name}
            onChange={e => setNewTx({ ...newTx, name: e.target.value })}
            required
          />
          <input
            className="form-input"
            type="number"
            placeholder="Сумма"
            min="0"
            step="0.01"
            value={newTx.amount || ''}
            onChange={e => setNewTx({ ...newTx, amount: parseFloat(e.target.value) || 0 })}
            required
          />
          <select
            className="form-select"
            value={newTx.category}
            onChange={e => setNewTx({ ...newTx, category: e.target.value })}
          >
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary" disabled={txSubmitting}>
            {txSubmitting ? '...' : '+ Добавить'}
          </button>
        </form>

        {/* List */}
        {transactions.length === 0 ? (
          <div className="empty-state-sm">Транзакций пока нет</div>
        ) : (
          <div className="tx-list">
            {transactions.map(tx => {
              const cat = getCat(tx.category);
              const isIncome = tx.category.toLowerCase() === 'income';
              return (
                <div key={tx.transaction_id} className="tx-item">
                  <div className="tx-icon" style={{ background: cat.bg, color: cat.color }}>
                    {cat.icon}
                  </div>
                  <div className="tx-info">
                    <span className="tx-name">{tx.name}</span>
                    <span className="tx-meta">
                      <span className="tx-category" style={{ color: cat.color }}>{cat.label}</span>
                      <span className="tx-date">
                        {new Date(tx.created_at).toLocaleDateString('ru-RU')}
                      </span>
                    </span>
                  </div>
                  <div className="tx-amount">
                    <span style={{ color: isIncome ? '#2dd4a6' : '#f06b6b' }}>
                      {isIncome ? '+' : '−'}{fmt(tx.amount)} ₽
                    </span>
                    <button
                      className="btn-icon"
                      onClick={() => handleDeleteTransaction(tx.transaction_id)}
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetail;
