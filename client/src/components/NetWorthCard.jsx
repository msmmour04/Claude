import React from 'react';

function formatCurrency(value, decimals = 2) {
  if (value === null || value === undefined) return '$0.00';
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export default function NetWorthCard({ portfolio, loading, error }) {
  if (loading) {
    return (
      <div className="card" style={{ padding: '2rem' }}>
        <div className="loading-container">
          <div className="spinner" style={{ width: 28, height: 28 }} />
          <span>Loading portfolio...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '2rem' }}>
        <div className="error-container">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const totalNetWorth = portfolio?.totalNetWorth || 0;
  const platforms = portfolio?.platforms || [];
  const breakdown = portfolio?.breakdown || {};

  // Calculate a mock 24h change for display (in real app would compare with historical data)
  const change24h = 0;
  const changePercent = 0;
  const isPositive = change24h >= 0;

  return (
    <div
      className="card"
      style={{
        background: 'linear-gradient(135deg, #111827 0%, #0d1117 100%)',
        border: '1px solid #1f2937',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Total Net Worth
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', flexWrap: 'wrap' }}>
            <h1
              style={{
                fontSize: '3rem',
                fontWeight: '800',
                color: '#f9fafb',
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}
            >
              {formatCurrency(totalNetWorth)}
            </h1>
            {changePercent !== 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: isPositive ? '#10b981' : '#ef4444',
                  background: isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                }}
              >
                <span>{isPositive ? '▲' : '▼'}</span>
                <span>{Math.abs(changePercent).toFixed(2)}%</span>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>24h</span>
              </div>
            )}
          </div>
          {change24h !== 0 && (
            <p style={{ color: isPositive ? '#10b981' : '#ef4444', fontSize: '14px', marginTop: '4px' }}>
              {isPositive ? '+' : ''}{formatCurrency(change24h)} today
            </p>
          )}
        </div>

        {/* Platform breakdown */}
        {platforms.length > 0 && (
          <div>
            <div
              style={{
                height: '1px',
                background: '#1f2937',
                marginBottom: '1rem',
              }}
            />
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {platforms.map((platform) => {
                const pct = totalNetWorth > 0 ? (platform.totalValue / totalNetWorth * 100) : 0;
                return (
                  <div key={platform.id} style={{ minWidth: '120px' }}>
                    <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                      {platform.name}
                    </p>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: '#f9fafb' }}>
                      {formatCurrency(platform.totalValue)}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <div
                        style={{
                          height: '3px',
                          width: '60px',
                          background: '#1f2937',
                          borderRadius: '2px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: platform.type === 'crypto' ? '#3b82f6' : platform.type === 'bank' ? '#10b981' : '#8b5cf6',
                            borderRadius: '2px',
                            transition: 'width 0.5s ease',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {platforms.length === 0 && !loading && (
          <div style={{ color: '#6b7280', fontSize: '14px' }}>
            No platforms connected yet. Go to{' '}
            <a href="/settings" style={{ color: '#3b82f6' }}>Settings</a>{' '}
            to connect your accounts.
          </div>
        )}

        <p style={{ color: '#4b5563', fontSize: '11px', marginTop: '1rem' }}>
          Last updated: {portfolio?.lastUpdated ? new Date(portfolio.lastUpdated).toLocaleTimeString() : 'Never'}
        </p>
      </div>
    </div>
  );
}
