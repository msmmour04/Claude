import React, { useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

function formatPrice(value) {
  if (value === null || value === undefined) return '-';
  if (value >= 1000) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(6)}`;
}

function formatMarketCap(value) {
  if (!value) return '-';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(0)}`;
}

function Sparkline({ data, positive }) {
  if (!data || data.length === 0) {
    return <div style={{ width: 80, height: 32 }} />;
  }

  const chartData = data.slice(-20).map((v, i) => ({ v, i }));

  return (
    <div style={{ width: 80, height: 32 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={positive ? '#10b981' : '#ef4444'}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const SORT_KEYS = {
  rank: 'rank',
  price: 'price',
  change24h: 'change24h',
  marketCap: 'marketCap',
  volume24h: 'volume24h',
};

export default function MarketTable({ data, loading, type, onSelectAsset, selectedAsset }) {
  const [sortKey, setSortKey] = useState('rank');
  const [sortDir, setSortDir] = useState('asc');

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'rank' ? 'asc' : 'desc');
    }
  }

  const sorted = [...(data || [])].sort((a, b) => {
    let av = a[sortKey] ?? 0;
    let bv = b[sortKey] ?? 0;
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  function SortHeader({ label, sortK, style = {} }) {
    const active = sortKey === sortK;
    return (
      <th
        onClick={() => handleSort(sortK)}
        style={{
          color: active ? '#f9fafb' : '#6b7280',
          ...style,
        }}
      >
        {label}{' '}
        {active && (
          <span style={{ fontSize: '10px' }}>
            {sortDir === 'asc' ? '▲' : '▼'}
          </span>
        )}
      </th>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <div className="loading-container" style={{ padding: '3rem' }}>
          <div className="spinner" />
          <span>Loading market data...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div style={{ fontSize: '32px', opacity: 0.3 }}>📊</div>
          <h3>No market data</h3>
          <p>Market data is unavailable at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <SortHeader label="#" sortK="rank" style={{ width: '50px', textAlign: 'center' }} />
              <th>Asset</th>
              <SortHeader label="Price" sortK="price" style={{ textAlign: 'right' }} />
              <SortHeader label="24h %" sortK="change24h" style={{ textAlign: 'right' }} />
              <SortHeader label="Market Cap" sortK="marketCap" style={{ textAlign: 'right' }} />
              <th style={{ textAlign: 'center' }}>7d Chart</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((asset) => {
              const isSelected = selectedAsset?.symbol === asset.symbol;
              const change = asset.change24h ?? 0;
              const isPositive = change >= 0;

              return (
                <tr
                  key={asset.symbol}
                  onClick={() => onSelectAsset && onSelectAsset(asset)}
                  style={{
                    background: isSelected ? 'rgba(59,130,246,0.08)' : undefined,
                    borderLeft: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
                  }}
                >
                  <td style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                    {asset.rank}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {asset.image ? (
                        <img
                          src={asset.image}
                          alt={asset.symbol}
                          style={{ width: 28, height: 28, borderRadius: '50%' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: '#1f2937',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: '700',
                            color: '#9ca3af',
                          }}
                        >
                          {asset.symbol?.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <p style={{ fontWeight: '600', color: '#f9fafb', fontSize: '13px' }}>
                          {asset.symbol}
                        </p>
                        <p style={{ color: '#6b7280', fontSize: '11px' }}>
                          {asset.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '600', fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
                    {formatPrice(asset.price)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        color: isPositive ? '#10b981' : '#ef4444',
                        fontWeight: '600',
                        fontSize: '13px',
                        background: isPositive ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {isPositive ? '+' : ''}{change?.toFixed(2)}%
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', color: '#9ca3af', fontSize: '13px' }}>
                    {formatMarketCap(asset.marketCap)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Sparkline
                        data={asset.sparkline}
                        positive={isPositive}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
