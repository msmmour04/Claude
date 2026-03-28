import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getAssetChart } from '../api/client.js';

function formatPrice(value) {
  if (!value) return '$0';
  if (value >= 1000) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(6)}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  return (
    <div
      style={{
        background: '#1a2235',
        border: '1px solid #2d3748',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '12px',
      }}
    >
      <p style={{ color: '#6b7280', marginBottom: '4px' }}>
        {point.date ? new Date(point.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : label}
      </p>
      <p style={{ color: '#f9fafb', fontWeight: '600', fontSize: '14px' }}>
        {formatPrice(point.price)}
      </p>
    </div>
  );
}

export default function PriceChart({ asset, type = 'crypto' }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!asset) return;
    setLoading(true);
    setError(null);

    getAssetChart(asset.symbol, type, asset.id)
      .then(data => {
        setChartData(data || []);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [asset?.symbol, type]);

  if (!asset) return null;

  const priceChange = chartData.length >= 2
    ? chartData[chartData.length - 1].price - chartData[0].price
    : 0;
  const isPositive = priceChange >= 0;
  const pct = chartData.length >= 2 && chartData[0].price > 0
    ? (priceChange / chartData[0].price) * 100
    : 0;

  const gradientId = `gradient-${asset.symbol}`;
  const chartColor = isPositive ? '#10b981' : '#ef4444';

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {asset.image && (
            <img src={asset.image} alt={asset.symbol} style={{ width: 36, height: 36, borderRadius: '50%' }} />
          )}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#f9fafb' }}>
              {asset.name || asset.symbol}
            </h3>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>
              {asset.symbol} · 7-Day Chart
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '22px', fontWeight: '800', color: '#f9fafb', letterSpacing: '-0.03em' }}>
            {formatPrice(asset.price)}
          </p>
          {pct !== 0 && (
            <p
              style={{
                fontSize: '13px',
                fontWeight: '600',
                color: isPositive ? '#10b981' : '#ef4444',
              }}
            >
              {isPositive ? '▲ +' : '▼ '}{pct.toFixed(2)}% (7d)
            </p>
          )}
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="loading-container" style={{ height: '200px' }}>
          <div className="spinner" />
          <span>Loading chart...</span>
        </div>
      ) : error ? (
        <div className="error-container">
          <span>⚠</span>
          <span>Failed to load chart: {error}</span>
        </div>
      ) : chartData.length > 0 ? (
        <div style={{ height: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => {
                  const date = new Date(d);
                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={Math.floor(chartData.length / 5)}
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={formatPrice}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 5, fill: chartColor, stroke: '#0a0e1a', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-state" style={{ height: '200px' }}>
          <p>No chart data available</p>
        </div>
      )}
    </div>
  );
}
