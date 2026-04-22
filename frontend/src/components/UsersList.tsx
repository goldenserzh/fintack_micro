import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUsers, deleteUser } from '../api';
import { User } from '../types';

const AVATAR_COLORS = ['#7c6dfa', '#2dd4a6', '#f06b6b', '#f59e0b', '#60a5fa', '#c084fc', '#fb923c', '#f472b6'];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function pluralUsers(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 19) return `${n} пользователей`;
  const r = n % 10;
  if (r === 1) return `${n} пользователь`;
  if (r >= 2 && r <= 4) return `${n} пользователя`;
  return `${n} пользователей`;
}

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch {
      setError('Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Удалить пользователя и все его данные?')) return;
    try {
      await deleteUser(userId);
      setUsers(prev => prev.filter(u => u.user_id !== userId));
    } catch {
      setError('Не удалось удалить пользователя');
    }
  };

  if (loading) return (
    <div className="page-loading">
      <div className="spinner" />
      <span>Загрузка...</span>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Пользователи</h1>
          <p className="page-subtitle">{pluralUsers(users.length)} в системе</p>
        </div>
        <Link to="/create-user" className="btn btn-primary">+ Добавить</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👤</div>
          <p className="text-muted">Пользователей пока нет</p>
          <Link to="/create-user" className="btn btn-primary">Создать первого</Link>
        </div>
      ) : (
        <div className="users-grid">
          {users.map(user => (
            <Link to={`/users/${user.user_id}`} key={user.user_id} className="user-card">
              <div
                className="user-card-avatar"
                style={{ background: avatarColor(user.name) }}
              >
                {initials(user.name)}
              </div>
              <div className="user-card-info">
                <span className="user-card-name">{user.name}</span>
                <span className="user-card-email">{user.email}</span>
                <span className="user-card-date">
                  С {new Date(user.created_at).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="user-card-meta">
                <span className="user-card-tx">{user.transactions?.length ?? 0} тр.</span>
                <button
                  className="btn-icon"
                  onClick={(e) => handleDelete(user.user_id, e)}
                  title="Удалить пользователя"
                >
                  ✕
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersList;
