import { useState, useMemo } from 'react';
import {
  PieChart, Pie, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
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

type Period = 'day' | 'week' | 'month' | 'year';

function filterByPeriod(txs: Transaction[], period: Period): Transaction[] {
  const now = new Date();
  return txs.filter(tx => {
    const d = new Date(tx.created_at);
    if (period === 'day') {
      return d.getFullYear() === now.getFullYear() &&
             d.getMonth() === now.getMonth() &&
             d.getDate() === now.getDate();
    }
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
  day: 'День',
  week: 'Неделя',
  month: 'Месяц',
  year: 'Год',
};

function buildBarData(filtered: Transaction[], period: Period) {
  const now = new Date();

  if (period === 'day') {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      label: `${i}:00`,
      value: 0,
    }));
    filtered.forEach(tx => {
      const h = new Date(tx.created_at).getHours();
      hours[h].value += Number(tx.amount);
    });
    return hours.map(h => ({ ...h, value: Math.round(h.value) }));
  }

  if (period === 'week') {
    const days: { label: string; value: number; date: Date }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push({
        label: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
        value: 0,
        date: d,
      });
    }
    filtered.forEach(tx => {
      const txDate = new Date(tx.created_at);
      const entry = days.find(d =>
        d.date.getFullYear() === txDate.getFullYear() &&
        d.date.getMonth() === txDate.getMonth() &&
        d.date.getDate() === txDate.getDate()
      );
      if (entry) entry.value += Number(tx.amount);
    });
    return days.map(d => ({ label: d.label, value: Math.round(d.value) }));
  }

  if (period === 'month') {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => ({
      label: String(i + 1),
      value: 0,
    }));
    filtered.forEach(tx => {
      const day = new Date(tx.created_at).getDate() - 1;
      if (days[day]) days[day].value += Number(tx.amount);
    });
    return days.map(d => ({ ...d, value: Math.round(d.value) }));
  }

  // year — по месяцам
  const months = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(now.getFullYear(), i, 1).toLocaleDateString('ru-RU', { month: 'short' }),
    value: 0,
  }));
  filtered.forEach(tx => {
    const m = new Date(tx.created_at).getMonth();
    months[m].value += Number(tx.amount);
  });
  return months.map(m => ({ ...m, value: Math.round(m.value) }));
}

interface BarTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function BarTooltip({ active, payload, label }: BarTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <span>{fmt(payload[0].value)} ₽</span>
    </div>
  );
}

export default function SpendingChart({ transactions }: Props) {
  const [period, setPeriod] = useState<Period>('month');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);

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

  const barData = useMemo(() => buildBarData(filtered, period), [filtered, period]);

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
        <>
          {/* Slider nav */}
          <div className="chart-slider-nav">
            <button
              className="chart-slide-arrow"
              onClick={() => setSlide(s => (s + 1) % 2)}
              title={slide === 0 ? 'Показать гистограмму' : 'Показать диаграмму'}
            >
              {slide === 0 ? '▶' : '◀'}
            </button>
            <div className="chart-slide-dots">
              <span className={`chart-slide-dot${slide === 0 ? ' chart-slide-dot-active' : ''}`} onClick={() => setSlide(0)} />
              <span className={`chart-slide-dot${slide === 1 ? ' chart-slide-dot-active' : ''}`} onClick={() => setSlide(1)} />
            </div>
            <span className="chart-slide-label">{slide === 0 ? 'По категориям' : 'По времени'}</span>
          </div>

          {slide === 0 ? (
            <div className="chart-body">
              {/* Donut chart */}
              <div className="chart-donut-wrap">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.map((entry, index) => ({
                        ...entry,
                        fill: entry.color,
                        fillOpacity: activeIndex === null || activeIndex === index ? 1 : 0.45,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={2}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                      stroke="none"
                    />
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-center-label">
                  <span className="chart-center-total">{fmt(total)}</span>
                  <span className="chart-center-sub">₽ расходов</span>
                </div>
              </div>

              {/* Legend */}
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
          ) : (
            <div className="chart-bar-wrap">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    interval={period === 'month' ? 4 : period === 'day' ? 2 : 0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)}
                  />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: 'var(--hover-bg)' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.value > 0 ? 'var(--primary)' : 'var(--border)'}
                        fillOpacity={entry.value > 0 ? 0.85 : 0.3}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
