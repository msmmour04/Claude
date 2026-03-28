import React, { useState } from 'react';
import { connectKraken, createPlaidLinkToken, disconnectConnector } from '../api/client.js';

const TYPE_COLORS = {
  crypto: '#3b82f6',
  bank: '#10b981',
  investment: '#8b5cf6',
};

const TYPE_ICONS = {
  crypto: '₿',
  bank: '🏦',
  investment: '📈',
};

export default function ConnectorCard({ connector, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { id, name, type, description, connected, connectedAt, comingSoon, supportsTrading } = connector;
  const color = TYPE_COLORS[type] || '#9ca3af';
  const icon = TYPE_ICONS[type] || '🔌';

  async function handleConnectKraken(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await connectKraken(apiKey, apiSecret);
      setSuccess('Kraken connected successfully!');
      setApiKey('');
      setApiSecret('');
      setExpanded(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnectPlaid() {
    setError(null);
    setLoading(true);
    try {
      const { linkToken } = await createPlaidLinkToken();
      // In production, you'd use the Plaid Link SDK here
      // For now, we show the token and instructions
      setSuccess(`Plaid Link Token created: ${linkToken.slice(0, 40)}... (Integrate Plaid Link SDK to complete)`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm(`Disconnect ${name}?`)) return;
    setLoading(true);
    try {
      await disconnectConnector(id);
      setSuccess('Disconnected');
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="card"
      style={{
        borderLeft: `3px solid ${connected ? color : '#2d3748'}`,
        opacity: comingSoon ? 0.6 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              background: connected ? `${color}20` : '#1f2937',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f9fafb' }}>
                {name}
              </h3>
              {comingSoon && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    background: 'rgba(245,158,11,0.15)',
                    color: '#f59e0b',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Soon
                </span>
              )}
              {supportsTrading && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    background: 'rgba(59,130,246,0.15)',
                    color: '#3b82f6',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                  }}
                >
                  Trading
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              {description}
            </p>
            {connected && connectedAt && (
              <p style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px' }}>
                Connected {new Date(connectedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Status & Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {connected ? (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  color: '#10b981',
                  background: 'rgba(16,185,129,0.1)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#10b981',
                  }}
                />
                Connected
              </div>
              {!comingSoon && (
                <button
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="btn btn-ghost btn-sm"
                >
                  Disconnect
                </button>
              )}
            </>
          ) : (
            !comingSoon && (
              <button
                onClick={() => {
                  if (id === 'kraken') setExpanded(!expanded);
                  else if (id.includes('plaid') || type === 'bank' || type === 'investment') handleConnectPlaid();
                }}
                disabled={loading}
                className="btn btn-primary btn-sm"
              >
                {loading ? (
                  <div className="spinner" style={{ width: 14, height: 14, borderTopColor: 'white' }} />
                ) : id.includes('plaid') || type === 'bank' || type === 'investment' ? (
                  'Connect via Plaid'
                ) : (
                  'Connect'
                )}
              </button>
            )
          )}
        </div>
      </div>

      {/* Kraken connect form */}
      {!connected && expanded && id === 'kraken' && (
        <form onSubmit={handleConnectKraken} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #1f2937' }}>
          <div className="form-group">
            <label>API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Your Kraken API key"
              required
            />
          </div>
          <div className="form-group">
            <label>API Secret</label>
            <input
              type="password"
              value={apiSecret}
              onChange={e => setApiSecret(e.target.value)}
              placeholder="Your Kraken API secret"
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              {loading ? 'Connecting...' : 'Connect Kraken'}
            </button>
            <button type="button" onClick={() => setExpanded(false)} className="btn btn-ghost btn-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Error / Success */}
      {error && (
        <div className="error-container" style={{ marginTop: '10px' }}>
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div
          style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: '6px',
            padding: '8px 12px',
            color: '#10b981',
            fontSize: '12px',
            marginTop: '10px',
          }}
        >
          ✓ {success}
        </div>
      )}
    </div>
  );
}
