import React, { useState, useCallback, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { connectKraken, createPlaidLinkToken, exchangePlaidToken, disconnectConnector } from '../api/client.js';

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

// Wrapper that uses the Plaid Link hook — must receive a valid linkToken
function PlaidLinkButton({ linkToken, institutionId, institutionName, onSuccess, onError, disabled }) {
  const onPlaidSuccess = useCallback(
    async (public_token, metadata) => {
      try {
        const instId = metadata?.institution?.institution_id || institutionId;
        const instName = metadata?.institution?.name || institutionName;
        await exchangePlaidToken(public_token, instId, instName);
        onSuccess(`${instName} connected successfully!`);
      } catch (err) {
        onError(err.message);
      }
    },
    [institutionId, institutionName, onSuccess, onError]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: (err) => {
      if (err) onError(err.error_message || 'Connection cancelled.');
    },
  });

  return (
    <button
      onClick={() => open()}
      disabled={disabled || !ready}
      className="btn btn-primary btn-sm"
    >
      Connect via Plaid
    </button>
  );
}

export default function ConnectorCard({ connector, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [linkToken, setLinkToken] = useState(null);
  const [fetchingToken, setFetchingToken] = useState(false);

  const { id, name, type, description, connected, connectedAt, comingSoon, supportsTrading } = connector;
  const color = TYPE_COLORS[type] || '#9ca3af';
  const icon = TYPE_ICONS[type] || '🔌';
  const isPlaid = id.startsWith('plaid') || type === 'bank' || type === 'investment';

  // Pre-fetch link token when card mounts (for Plaid cards only)
  useEffect(() => {
    if (!isPlaid || connected || comingSoon) return;
    setFetchingToken(true);
    createPlaidLinkToken()
      .then(({ linkToken }) => setLinkToken(linkToken))
      .catch((err) => setError('Could not reach Plaid: ' + err.message))
      .finally(() => setFetchingToken(false));
  }, [isPlaid, connected, comingSoon]);

  async function handleConnectKraken(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await connectKraken(apiKey, apiSecret);
      setSuccess('Kraken connected! Reload the page to see your balances.');
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

  function handlePlaidSuccess(msg) {
    setSuccess(msg);
    if (onUpdate) onUpdate();
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
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f9fafb' }}>{name}</h3>
              {comingSoon && (
                <span style={{ fontSize: '10px', fontWeight: '600', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                  Soon
                </span>
              )}
              {supportsTrading && (
                <span style={{ fontSize: '10px', fontWeight: '600', background: 'rgba(59,130,246,0.15)', color: '#3b82f6', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                  Trading
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{description}</p>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                Connected
              </div>
              {!comingSoon && (
                <button onClick={handleDisconnect} disabled={loading} className="btn btn-ghost btn-sm">
                  Disconnect
                </button>
              )}
            </>
          ) : !comingSoon ? (
            isPlaid ? (
              fetchingToken ? (
                <button disabled className="btn btn-primary btn-sm">Loading...</button>
              ) : linkToken ? (
                <PlaidLinkButton
                  linkToken={linkToken}
                  institutionId={id}
                  institutionName={name}
                  onSuccess={handlePlaidSuccess}
                  onError={setError}
                  disabled={loading}
                />
              ) : (
                <button disabled className="btn btn-ghost btn-sm" title={error || 'Plaid unavailable'}>
                  Plaid unavailable
                </button>
              )
            ) : (
              <button
                onClick={() => setExpanded(!expanded)}
                disabled={loading}
                className="btn btn-primary btn-sm"
              >
                Connect
              </button>
            )
          ) : null}
        </div>
      </div>

      {/* Kraken connect form */}
      {!connected && expanded && id === 'kraken' && (
        <form onSubmit={handleConnectKraken} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #1f2937' }}>
          <div className="form-group">
            <label>API Key</label>
            <input type="text" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Your Kraken API key" required />
          </div>
          <div className="form-group">
            <label>API Secret</label>
            <input type="password" value={apiSecret} onChange={e => setApiSecret(e.target.value)} placeholder="Your Kraken API secret" required />
          </div>
          <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '1rem' }}>
            Permissions needed: <strong>Query Funds</strong>, <strong>Query Open Orders &amp; Trades</strong>, <strong>Create &amp; Modify Orders</strong>
          </p>
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

      {/* Plaid sandbox note */}
      {isPlaid && !connected && !comingSoon && linkToken && (
        <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '6px', fontSize: '12px', color: '#9ca3af' }}>
          <strong style={{ color: '#3b82f6' }}>Sandbox mode:</strong> Plaid will open with test banks. For your real BofA / Public account, you need Production access from the Plaid dashboard → "Get production access".
        </div>
      )}

      {error && (
        <div className="error-container" style={{ marginTop: '10px' }}>
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', padding: '8px 12px', color: '#10b981', fontSize: '12px', marginTop: '10px' }}>
          ✓ {success}
        </div>
      )}
    </div>
  );
}
