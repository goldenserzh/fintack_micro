import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUser, getTransactions, createTransaction, deleteTransaction } from '../api';
import { Transaction, CreateTransactionRequest, Profile } from '../types';
import { useAuth } from '../context/AuthContext';
import SpendingChart from '../components/SpendingChart';

const CATEGORIES = [
  { id: 'food',          label: 'Еда',          color: '#f59e0b', bg: 'rgba(245,158,11,0.14)',  icon: '🍔' },
  { id: 'transport',     label: 'Транспорт',     color: '#60a5fa', bg: 'rgba(96,165,250,0.14)',  icon: '🚗' },
  { id: 'entertainment', label: 'Развлечения',   color: '#c084fc', bg: 'rgba(192,132,252,0.14)', icon: '🎮' },
  { id: 'shopping',      label: 'Покупки',       color: '#f472b6', bg: 'rgba(244,114,182,0.14)', icon: '🛍️' },
  { id: 'health',        label: 'Здоровье',      color: '#2dd4a6', bg: 'rgba(45,212,166,0.14)',  icon: '💊' },
  { id: 'other',         label: 'Прочее',        color: '#8888a8', bg: 'rgba(136,136,168,0.14)', icon: '📦' },
];

function getCat(id: string) {
  return CATEGORIES.find(c => c.id === id.toLowerCase()) ?? CATEGORIES[CATEGORIES.length - 1];
}

function fmt(n: number | string | null | undefined): string {
  return Number(n ?? 0).toLocaleString('ru-RU');
}

function avatarBg(name: string): string {
  const colors = ['#7c6dfa', '#2dd4a6', '#f06b6b', '#f59e0b', '#60a5fa', '#c084fc', '#fb923c'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

interface TxModalProps {
  tx: Transaction;
  onClose: () => void;
  onDelete: (id: number) => void;
}

function TxModal({ tx, onClose, onDelete }: TxModalProps) {
  const cat = getCat(tx.category);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="tx-icon" style={{ background: cat.bg, color: cat.color, width: 48, height: 48, fontSize: '1.3rem' }}>
            {cat.icon}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <h2 className="modal-title">{tx.name}</h2>
        <div className="modal-amount" style={{ color: '#f06b6b' }}>
          −{fmt(tx.amount)} ₽
        </div>
        <div className="modal-rows">
          <div className="modal-row">
            <span className="modal-row-label">Категория</span>
            <span style={{ color: cat.color, fontWeight: 600 }}>{cat.icon} {cat.label}</span>
          </div>
          <div className="modal-row">
            <span className="modal-row-label">Дата</span>
            <span>{new Date(tx.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
        <button
          className="btn btn-full"
          style={{ background: 'var(--red-dim)', color: 'var(--red)', marginTop: '1rem' }}
          onClick={() => { onDelete(tx.transaction_id); onClose(); }}
        >
          Удалить транзакцию
        </button>
      </div>
    </div>
  );
}

const Dashboard = () => {
  const { user: authUser, setUser: setAuthUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTx, setNewTx] = useState<CreateTransactionRequest>({ name: '', amount: 0, category: 'other' });
  const [txSubmitting, setTxSubmitting] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!authUser) return;
    Promise.all([
      getUser(authUser.user_id),
      getTransactions(authUser.user_id),
    ]).then(([u, txs]) => {
      setProfile(u.profile ?? null);
      const sorted = txs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(sorted);
      setAuthUser({ ...authUser, profile: u.profile, transactions: txs });
    }).catch(() => setError('Не удалось загрузить данные'))
      .finally(() => setLoading(false));
  }, [authUser?.user_id]);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    setTxSubmitting(true);
    try {
      const tx = await createTransaction(authUser.user_id, newTx);
      setTransactions(prev => [tx, ...prev]);
      setNewTx({ name: '', amount: 0, category: 'other' });
    } catch {
      setError('Не удалось добавить транзакцию');
    } finally {
      setTxSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (txId: number) => {
    if (!authUser) return;
    try {
      await deleteTransaction(authUser.user_id, txId);
      setTransactions(prev => prev.filter(t => t.transaction_id !== txId));
    } catch {
      setError('Не удалось удалить транзакцию');
    }
  };

  if (loading) return (
    <div className="page-loading"><div className="spinner" /><span>Загрузка...</span></div>
  );

  if (!authUser) return null;

  // ─── Расчёты ──────────────────────────────────────
  const now = new Date();
  const isThisMonth = (d: string) => {
    const dt = new Date(d);
    return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
  };

  // Только расходы (без income-транзакций)
  const expenseTxs = transactions.filter(t => t.category.toLowerCase() !== 'income');

  const spentThisMonth = expenseTxs
    .filter(t => isThisMonth(t.created_at))
    .reduce((s, t) => s + Number(t.amount), 0);

  const remainingBudget = profile ? Number(profile.limit) - spentThisMonth : 0;

  const monthsActive = Math.max(1,
    (now.getFullYear() - new Date(authUser.created_at).getFullYear()) * 12
    + (now.getMonth() - new Date(authUser.created_at).getMonth()) + 1
  );
  const totalExpenses = expenseTxs.reduce((s, t) => s + Number(t.amount), 0);
  const totalAccumulated = profile
    ? Math.max(0, Number(profile.income) * monthsActive - totalExpenses)
    : 0;

  const limitPct = profile?.limit
    ? Math.min((spentThisMonth / Number(profile.limit)) * 100, 100)
    : 0;

  const goalTarget = profile?.goal_amount ? Number(profile.goal_amount) : null;
  const goalPct = goalTarget ? Math.min((totalAccumulated / goalTarget) * 100, 100) : null;

  return (
    <div>
      {/* Header */}
      <div className="dash-header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="user-header-avatar" style={{ background: avatarBg(authUser.name) }}>
            {initials(authUser.name)}
          </div>
          <div>
            <h1 className="page-title">Привет, {authUser.name.split(' ')[0]}!</h1>
            <p className="page-subtitle">{authUser.email}</p>
          </div>
        </div>
        <Link to="/finance-profile" className="btn btn-secondary">
          💰 Финансовый профиль
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dash-layout">
        {/* ─── Левый основной контент ─── */}
        <div className="dash-main">

          {/* Goal */}
          {profile && profile.goal && (
            <div className="card goal-card" style={{ marginBottom: '1.25rem' }}>
              <div className="goal-header">
                <span className="goal-icon">🎯</span>
                <div>
                  <div className="goal-label">Цель: {profile.goal}</div>
                  {goalTarget && <div className="goal-target">Нужно накопить: {fmt(goalTarget)} ₽</div>}
                </div>
                <div className="goal-saved">
                  <span className="goal-saved-amount text-green">{fmt(totalAccumulated)} ₽</span>
                  <span className="goal-saved-label">накоплено</span>
                </div>
              </div>
              {goalPct !== null && (
                <>
                  <div className="progress-bar" style={{ marginTop: '1rem' }}>
                    <div className="progress-fill" style={{
                      width: `${goalPct}%`,
                      background: goalPct >= 100 ? '#2dd4a6' : 'var(--primary)',
                    }} />
                  </div>
                  <div className="progress-header" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                    <span className="text-muted">Прогресс</span>
                    <span style={{ color: goalPct >= 100 ? '#2dd4a6' : 'var(--primary)', fontWeight: 700 }}>
                      {Math.round(goalPct)}% {goalPct >= 100 && '🎉'}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Stats */}
          {profile && (
            <div className="stats-grid" style={{ marginBottom: '1.25rem' }}>
              <div className="stat-card">
                <span className="stat-label">Доход / мес</span>
                <span className="stat-value text-green">+{fmt(profile.income)} ₽</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Потрачено в месяце</span>
                <span className="stat-value text-red">{fmt(spentThisMonth)} ₽</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Остаток бюджета</span>
                <span className={`stat-value ${remainingBudget >= 0 ? 'text-green' : 'text-red'}`}>
                  {fmt(remainingBudget)} ₽
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Накоплено всего</span>
                <span className="stat-value text-green">{fmt(totalAccumulated)} ₽</span>
              </div>
            </div>
          )}

          {/* Limit progress */}
          {profile && Number(profile.limit) > 0 && (
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <div className="progress-header">
                <span>Расходы за месяц vs Лимит</span>
                <span className={limitPct >= 90 ? 'text-red' : limitPct >= 70 ? 'text-yellow' : 'text-green'}>
                  {fmt(spentThisMonth)} / {fmt(profile.limit)} ₽ ({Math.round(limitPct)}%)
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width: `${limitPct}%`,
                  background: limitPct >= 90 ? '#f06b6b' : limitPct >= 70 ? '#f59e0b' : '#2dd4a6',
                }} />
              </div>
              {remainingBudget < 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#f06b6b' }}>
                  ⚠️ Превышение лимита на {fmt(Math.abs(remainingBudget))} ₽ — накопления этого месяца снижены
                </div>
              )}
            </div>
          )}

          {/* Transactions */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Транзакции</h2>
              <span className="badge">{expenseTxs.length}</span>
            </div>

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
                min="0" step="0.01"
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

            {expenseTxs.length === 0 ? (
              <div className="empty-state-sm">Транзакций пока нет</div>
            ) : (
              <div className="tx-list">
                {expenseTxs.map(tx => {
                  const cat = getCat(tx.category);
                  return (
                    <div key={tx.transaction_id} className="tx-item tx-item-clickable" onClick={() => setSelectedTx(tx)}>
                      <div className="tx-icon" style={{ background: cat.bg, color: cat.color }}>{cat.icon}</div>
                      <div className="tx-info">
                        <span className="tx-name">{tx.name}</span>
                        <span className="tx-meta">
                          <span className="tx-category" style={{ color: cat.color }}>{cat.label}</span>
                          <span className="tx-date">{new Date(tx.created_at).toLocaleDateString('ru-RU')}</span>
                        </span>
                      </div>
                      <div className="tx-amount">
                        <span style={{ color: '#f06b6b' }}>−{fmt(tx.amount)} ₽</span>
                        <span className="tx-arrow">›</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── Правый сайдбар с диаграммой ─── */}
        <div className="dash-sidebar">
          <SpendingChart transactions={transactions} />
        </div>
      </div>

      {selectedTx && (
        <TxModal tx={selectedTx} onClose={() => setSelectedTx(null)} onDelete={handleDeleteTransaction} />
      )}
    </div>
  );
};

export default Dashboard;
