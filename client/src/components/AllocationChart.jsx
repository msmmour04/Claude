import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const COLORS = {
  Kraken: '#3b82f6',
  Plaid: '#10b981',
  'Bank of America': '#10b981',
  'Public.com': '#8b5cf6',
  default: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'],
};

function formatCurrency(value) {
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const { name, value, percentage } = payload[0].payload;
  return (
    <div
      style={{
        background: '#1a2235',
        border: '1px solid #2d3748',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '13px',
      }}
    >
      <p style={{ color: '#f9fafb', fontWeight: '600', marginBottom: '4px' }}>{name}</p>
      <p style={{ color: '#9ca3af' }}>{formatCurrency(value)}</p>
      <p style={{ color: '#6b7280' }}>{percentage?.toFixed(1)}%</p>
    </div>
  );
}

function CustomLegend({ payload }) {
  if (!payload) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '16px' }}>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '3px',
              background: entry.color,
              flexShrink: 0,
            }}
          />
          <div>
            <p style={{ fontSize: '13px', color: '#f9fafb', fontWeight: '500' }}>{entry.value}</p>
            <p style={{ fontSize: '11px', color: '#6b7280' }}>
              {entry.payload?.percentage?.toFixed(1)}%
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AllocationChart({ portfolio, loading }) {
  const [activeIndex, setActiveIndex] = useState(null);

  if (loading) {
    return (
      <div className="card" style={{ padding: '1.5rem', height: '300px' }}>
        <div className="loading-container" style={{ height: '100%' }}>
          <div className="spinner" />
          <span>Loading allocation...</span>
        </div>
      </div>
    );
  }

  const platforms = portfolio?.platforms || [];
  const totalNetWorth = portfolio?.totalNetWorth || 0;

  if (platforms.length === 0 || totalNetWorth === 0) {
    return (
      <div className="card" style={{ padding: '1.5rem', height: '300px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#9ca3af', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Allocation
        </h3>
        <div className="empty-state" style={{ height: 'calc(100% - 40px)' }}>
          <div style={{ fontSize: '32px', opacity: 0.3 }}>◉</div>
          <p style={{ fontSize: '13px' }}>No allocation data yet</p>
        </div>
      </div>
    );
  }

  const data = platforms
    .filter(p => p.totalValue > 0)
    .map((p, i) => ({
      name: p.name,
      value: p.totalValue,
      percentage: totalNetWorth > 0 ? (p.totalValue / totalNetWorth) * 100 : 0,
      color: COLORS[p.name] || COLORS.default[i % COLORS.default.length],
    }));

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h3
        style={{
          fontSize: '13px',
          fontWeight: '600',
          color: '#9ca3af',
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        Portfolio Allocation
      </h3>

      <div style={{ height: '240px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="40%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              content={<CustomLegend />}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Center label */}
      <div
        style={{
          textAlign: 'center',
          marginTop: '-240px',
          paddingBottom: '240px',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '240px',
          width: '80%',
        }}
      >
        {/* The PieChart handles its own center - this is intentionally empty */}
      </div>
    </div>
  );
}
