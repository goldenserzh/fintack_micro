import { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Transaction } from '../types';

const CATEGORIES = [
  { id: 'food',          label: 'Еда',          color: '#f59e0b', icon: '🍔' },
  { id: 'transport',     label: 'Транспорт',     color: '#60a5fa', icon: '🚗' },
  { id: 'entertainment', label: 'Развлечения',   color: '#c084fc', icon: '🎮' },
  { id: 'shopping',      label: 'Покупки',       color: '#f472b6', icon: '🛍️' },
  { id: 'health',        label: 'Здоровье',      color: '#2dd4a6', icon: '💊' },
  { id: 'income',        label: 'Доход',         color: '#7c6dfa', icon: '💰' },
  { id: 'other',         label: 'Прочее',        color: '#8888a8', icon: '📦' },
];

function getCat(id: string) {
  return CATEGORIES.find(c => c.id === id.toLowerCase()) ?? CATEGORIES[CATEGORIES.length - 1];
}

function fmt(n: number): string {
  return n.toLocaleString('ru-RU');
}

type Period = 'week' | 'month' | 'year';

function filterByPeriod(txs: Transaction[], period: Period): Transaction[] {
  const now = new Date();
  return txs.filter(tx => {
    const d = new Date(tx.created_at);
    if (period === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo;
    }
    if (period === 'month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    return d.getFullYear() === now.getFullYear();
  });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="chart-tooltip">
      <span style={{ color: item.payload.color, fontWeight: 700 }}>{item.name}</span>
      <span>{fmt(item.value)} ₽</span>
    </div>
  );
}

interface Props {
  transactions: Transaction[];
}

const PERIOD_LABELS: Record<Period, string> = {
  week: 'Неделя',
  month: 'Месяц',
  year: 'Год',
};

export default function SpendingChart({ transactions }: Props) {
  const [period, setPeriod] = useState<Period>('month');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () => filterByPeriod(transactions, period).filter(t => t.category.toLowerCase() !== 'income'),
    [transactions, period]
  );

  const data = useMemo(() => {
    const totals: Record<string, number> = {};
    filtered.forEach(tx => {
      const key = tx.category.toLowerCase();
      totals[key] = (totals[key] ?? 0) + Number(tx.amount);
    });
    return Object.entries(totals)
      .map(([id, value]) => {
        const cat = getCat(id);
        return { id, name: `${cat.icon} ${cat.label}`, value: Math.round(value), color: cat.color };
      })
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="card chart-card" style={{ marginBottom: '1.25rem' }}>
      <div className="card-header">
        <h2 className="card-title">Анализ трат</h2>
        <div className="period-tabs">
          {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
            <button
              key={p}
              className={`period-tab${period === p ? ' period-tab-active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="empty-state-sm">Нет расходов за выбранный период</div>
      ) : (
        <div className="chart-body">
          {/* Donut chart */}
          <div className="chart-donut-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={entry.id}
                      fill={entry.color}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                      style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-center-label">
              <span className="chart-center-total">{fmt(total)}</span>
              <span className="chart-center-sub">₽ расходов</span>
            </div>
          </div>

          {/* Legend / breakdown list */}
          <div className="chart-legend">
            {data.map((entry, index) => {
              const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
              return (
                <div
                  key={entry.id}
                  className={`chart-legend-item${activeIndex === index ? ' chart-legend-item-active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  <div className="chart-legend-dot" style={{ background: entry.color }} />
                  <span className="chart-legend-name">{entry.name}</span>
                  <div className="chart-legend-right">
                    <span className="chart-legend-amount">{fmt(entry.value)} ₽</span>
                    <span className="chart-legend-pct" style={{ color: entry.color }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
