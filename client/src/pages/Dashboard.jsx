import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NetWorthCard from '../components/NetWorthCard.jsx';
import AllocationChart from '../components/AllocationChart.jsx';
import PlatformCard from '../components/PlatformCard.jsx';
import { getPortfolio } from '../api/client.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchPortfolio = useCallback(async () => {
    try {
      setError(null);
      const data = await getPortfolio();
      setPortfolio(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchPortfolio, 60000);
    return () => clearInterval(interval);
  }, [fetchPortfolio]);

  const platforms = portfolio?.platforms || [];
  const hasConnectedPlatforms = platforms.length > 0;

  return (
    <div className="page fade-in">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {lastRefresh
              ? `Last updated at ${lastRefresh.toLocaleTimeString()}`
              : 'Loading your portfolio...'}
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchPortfolio(); }}
          disabled={loading}
          className="btn btn-ghost"
        >
          {loading ? (
            <div className="spinner" style={{ width: 14, height: 14 }} />
          ) : (
            '↻'
          )}
          Refresh
        </button>
      </div>

      {/* Net Worth Card - full width */}
      <div style={{ marginBottom: '1.5rem' }}>
        <NetWorthCard portfolio={portfolio} loading={loading} error={error} />
      </div>

      {/* Allocation + quick stats row */}
      {hasConnectedPlatforms && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 1fr) minmax(280px, 2fr)',
            gap: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <AllocationChart portfolio={portfolio} loading={loading} />

          {/* Quick stats */}
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
              Portfolio Overview
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
              }}
            >
              {[
                { label: 'Total Platforms', value: platforms.length, unit: '' },
                {
                  label: 'Total Assets',
                  value: platforms.reduce((sum, p) => sum + (p.assets?.length || 0), 0),
                  unit: '',
                },
                {
                  label: 'Largest Position',
                  value: platforms.length > 0
                    ? `$${Math.max(...platforms.map(p => p.totalValue)).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                    : '$0',
                  unit: '',
                },
                {
                  label: 'Platforms Active',
                  value: platforms.filter(p => p.totalValue > 0).length,
                  unit: `/ ${platforms.length}`,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: '#0d1117',
                    borderRadius: '10px',
                    padding: '1rem',
                  }}
                >
                  <p
                    style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '6px',
                    }}
                  >
                    {stat.label}
                  </p>
                  <p
                    style={{
                      fontSize: '22px',
                      fontWeight: '800',
                      color: '#f9fafb',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {stat.value}
                    {stat.unit && (
                      <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '400' }}>
                        {' '}{stat.unit}
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>

            {/* Error platforms */}
            {platforms.filter(p => p.error).length > 0 && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '10px 12px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '8px',
                }}
              >
                <p style={{ color: '#ef4444', fontSize: '12px', fontWeight: '600' }}>
                  ⚠ {platforms.filter(p => p.error).length} platform(s) have errors
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Platform Cards */}
      {hasConnectedPlatforms ? (
        <div>
          <h2
            className="section-title"
          >
            Connected Platforms ({platforms.length})
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {platforms.map((platform) => (
              <PlatformCard key={platform.id} platform={platform} />
            ))}
          </div>
        </div>
      ) : !loading ? (
        /* CTA when no platforms connected */
        <div
          className="card"
          style={{
            padding: '3rem',
            textAlign: 'center',
            border: '1px dashed #2d3748',
            background: 'transparent',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🔌</div>
          <h2 style={{ color: '#f9fafb', marginBottom: '8px' }}>No accounts connected</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
            Connect your Kraken exchange, Bank of America, or Public.com account to start tracking your net worth.
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="btn btn-primary btn-lg"
          >
            ⚙ Go to Settings
          </button>
        </div>
      ) : null}
    </div>
  );
}
