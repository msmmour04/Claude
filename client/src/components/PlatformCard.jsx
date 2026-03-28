import React, { useState } from 'react';

function formatCurrency(value) {
  if (value === null || value === undefined) return '$0.00';
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatNumber(value, decimals = 6) {
  if (!value) return '0';
  if (value >= 1000) return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return parseFloat(value.toFixed(decimals)).toString();
}

const TYPE_COLORS = {
  crypto: '#3b82f6',
  bank: '#10b981',
  investment: '#8b5cf6',
  default: '#9ca3af',
};

const TYPE_ICONS = {
  crypto: '₿',
  bank: '🏦',
  investment: '📈',
  default: '💼',
};

export default function PlatformCard({ platform }) {
  const [expanded, setExpanded] = useState(false);
  const { name, type, totalValue, assets = [], error } = platform;
  const color = TYPE_COLORS[type] || TYPE_COLORS.default;
  const icon = TYPE_ICONS[type] || TYPE_ICONS.default;
  const topAssets = expanded ? assets : assets.slice(0, 5);

  return (
    <div
      className="card"
      style={{
        borderLeft: `3px solid ${color}`,
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: `${color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            {icon}
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f9fafb', marginBottom: '2px' }}>
              {name}
            </h3>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                color,
                letterSpacing: '0.06em',
              }}
            >
              {type}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '18px', fontWeight: '700', color: '#f9fafb' }}>
            {formatCurrency(totalValue)}
          </p>
          {assets.length > 0 && (
            <p style={{ fontSize: '11px', color: '#6b7280' }}>
              {assets.length} asset{assets.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '6px',
            padding: '8px 12px',
            color: '#ef4444',
            fontSize: '12px',
            marginBottom: '8px',
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Assets list */}
      {topAssets.length > 0 && (
        <div>
          <div
            style={{
              height: '1px',
              background: '#1f2937',
              marginBottom: '12px',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topAssets.map((asset, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  background: '#0d1117',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: `${color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: '700',
                      color,
                    }}
                  >
                    {(asset.asset || asset.symbol || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#f9fafb' }}>
                      {asset.asset || asset.symbol || 'Unknown'}
                    </p>
                    {asset.type && (
                      <p style={{ fontSize: '11px', color: '#6b7280' }}>
                        {asset.subtype || asset.type}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {asset.usdValue > 0 && (
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#f9fafb' }}>
                      {formatCurrency(asset.usdValue)}
                    </p>
                  )}
                  {asset.balance !== undefined && type === 'crypto' && (
                    <p style={{ fontSize: '11px', color: '#6b7280' }}>
                      {formatNumber(asset.balance)} {asset.asset}
                    </p>
                  )}
                  {asset.balance !== undefined && type !== 'crypto' && (
                    <p style={{ fontSize: '11px', color: '#6b7280' }}>
                      {formatCurrency(asset.balance)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {assets.length > 5 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                fontSize: '12px',
                cursor: 'pointer',
                marginTop: '10px',
                padding: '4px 8px',
                borderRadius: '4px',
                display: 'block',
                width: '100%',
                textAlign: 'center',
              }}
            >
              {expanded ? '▲ Show less' : `▼ Show ${assets.length - 5} more`}
            </button>
          )}
        </div>
      )}

      {assets.length === 0 && !error && (
        <p style={{ color: '#4b5563', fontSize: '13px', textAlign: 'center', padding: '8px 0' }}>
          No assets to display
        </p>
      )}
    </div>
  );
}
