import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUser } from '../api';
import { CreateUserRequest } from '../types';

const CreateUser = () => {
  const [form, setForm] = useState<CreateUserRequest>({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createUser(form);
      navigate('/');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Не удалось создать пользователя');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <Link to="/users" className="back-link">← Все пользователи</Link>

      <div className="form-card">
        <div className="form-card-header">
          <div className="form-card-icon">👤</div>
          <h1 className="form-card-title">Новый пользователь</h1>
          <p className="form-card-subtitle">Заполните данные для регистрации</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Имя</label>
            <input
              className="form-input"
              type="text"
              placeholder="Иван Иванов"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              maxLength={30}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="ivan@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              maxLength={50}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input
              className="form-input"
              type="password"
              placeholder="Минимум 8 символов"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Создание...' : 'Создать пользователя'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
