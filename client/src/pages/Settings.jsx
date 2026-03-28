import React, { useState, useEffect, useCallback } from 'react';
import ConnectorCard from '../components/ConnectorCard.jsx';
import { getConnectors, connectKraken } from '../api/client.js';

const CONNECTOR_TYPES = [
  { value: 'kraken', label: 'Kraken (Crypto Exchange)' },
  { value: 'plaid-bank', label: 'Bank Account (via Plaid)' },
  { value: 'plaid-investment', label: 'Investment Account (via Plaid)' },
];

export default function Settings() {
  const [connectors, setConnectors] = useState({ connected: [], available: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newConnectorType, setNewConnectorType] = useState('kraken');
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiSecret, setNewApiSecret] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState(null);
  const [addSuccess, setAddSuccess] = useState(null);

  const fetchConnectors = useCallback(async () => {
    try {
      setError(null);
      const data = await getConnectors();
      setConnectors(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnectors();
  }, [fetchConnectors]);

  // All known connectors (connected + available)
  const allConnectors = [
    // Known static connectors
    {
      id: 'kraken',
      name: 'Kraken',
      type: 'crypto',
      description: 'Kraken cryptocurrency exchange - trade BTC, ETH, and 100+ crypto pairs',
      supportsTrading: true,
      connected: connectors.connected.some(c => c.id === 'kraken'),
      connectedAt: connectors.connected.find(c => c.id === 'kraken')?.connectedAt,
    },
    {
      id: 'plaid-bofa',
      name: 'Bank of America',
      type: 'bank',
      description: 'Connect your BofA checking and savings accounts via Plaid',
      supportsTrading: false,
      connected: connectors.connected.some(c => c.id === 'plaid'),
      connectedAt: connectors.connected.find(c => c.id === 'plaid')?.connectedAt,
    },
    {
      id: 'plaid-public',
      name: 'Public.com',
      type: 'investment',
      description: 'Connect your Public.com stock and ETF portfolio via Plaid',
      supportsTrading: false,
      connected: connectors.connected.some(c => c.id === 'plaid'),
      connectedAt: connectors.connected.find(c => c.id === 'plaid')?.connectedAt,
    },
    {
      id: 'shopify',
      name: 'Shopify Balance',
      type: 'bank',
      description: 'Shopify Balance business account',
      supportsTrading: false,
      connected: false,
      comingSoon: true,
    },
  ];

  async function handleAddConnector(e) {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);
    setAddLoading(true);

    try {
      if (newConnectorType === 'kraken') {
        await connectKraken(newApiKey, newApiSecret);
        setAddSuccess('Kraken connector added successfully!');
        setNewApiKey('');
        setNewApiSecret('');
        await fetchConnectors();
      } else {
        setAddSuccess('Plaid connectors can be set up via the connector cards above.');
      }
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  }

  return (
    <div className="page fade-in">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">
          Manage your connected accounts and platform integrations
        </p>
      </div>

      {error && (
        <div className="error-container" style={{ marginBottom: '1.5rem' }}>
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Connected Accounts Section */}
      <div className="section">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            Connected Accounts
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                fontSize: '12px',
                color: connectors.connected.length > 0 ? '#10b981' : '#6b7280',
              }}
            >
              {loading ? 'Loading...' : `${connectors.connected.length} active`}
            </div>
            <button
              onClick={fetchConnectors}
              disabled={loading}
              className="btn btn-ghost btn-sm"
            >
              {loading ? '...' : '↻'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container" style={{ padding: '2rem' }}>
            <div className="spinner" />
            <span>Loading connectors...</span>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: '1rem',
            }}
          >
            {allConnectors.map((connector) => (
              <ConnectorCard
                key={connector.id}
                connector={connector}
                onUpdate={fetchConnectors}
              />
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          background: '#1f2937',
          margin: '2rem 0',
        }}
      />

      {/* Add New Connection Section */}
      <div className="section">
        <h2 className="section-title" style={{ marginBottom: '1rem' }}>
          Add New Connection
        </h2>

        <div className="card" style={{ maxWidth: '480px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f9fafb', marginBottom: '1.25rem' }}>
            Connect a New Platform
          </h3>

          <form onSubmit={handleAddConnector}>
            <div className="form-group">
              <label>Connector Type</label>
              <select
                value={newConnectorType}
                onChange={e => {
                  setNewConnectorType(e.target.value);
                  setAddError(null);
                  setAddSuccess(null);
                }}
              >
                {CONNECTOR_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {newConnectorType === 'kraken' && (
              <>
                <div className="form-group">
                  <label>API Key</label>
                  <input
                    type="text"
                    value={newApiKey}
                    onChange={e => setNewApiKey(e.target.value)}
                    placeholder="Your Kraken API key"
                  />
                </div>
                <div className="form-group">
                  <label>API Secret</label>
                  <input
                    type="password"
                    value={newApiSecret}
                    onChange={e => setNewApiSecret(e.target.value)}
                    placeholder="Your Kraken API secret"
                  />
                </div>
                <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '1rem' }}>
                  Get your API credentials from{' '}
                  <a
                    href="https://www.kraken.com/u/security/api"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Kraken Security Settings
                  </a>
                  . Enable: Query Funds, Query Open Orders & Trades, Create & Modify Orders.
                </p>
              </>
            )}

            {(newConnectorType === 'plaid-bank' || newConnectorType === 'plaid-investment') && (
              <div
                style={{
                  background: '#0d1117',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  fontSize: '13px',
                  color: '#9ca3af',
                }}
              >
                <p style={{ fontWeight: '600', color: '#f9fafb', marginBottom: '8px' }}>
                  Plaid Connection
                </p>
                <p>
                  Bank and investment connections use Plaid Link, a secure OAuth flow.
                  Add your Plaid credentials to the server <code style={{ color: '#3b82f6', fontSize: '11px' }}>.env</code> file,
                  then use the "Connect via Plaid" buttons in the connector cards above.
                </p>
                <p style={{ marginTop: '8px' }}>
                  Required env vars:{' '}
                  <code style={{ color: '#3b82f6', fontSize: '11px' }}>PLAID_CLIENT_ID</code>,{' '}
                  <code style={{ color: '#3b82f6', fontSize: '11px' }}>PLAID_SECRET</code>
                </p>
              </div>
            )}

            {addError && (
              <div className="error-container" style={{ marginBottom: '1rem' }}>
                <span>⚠</span>
                <span>{addError}</span>
              </div>
            )}

            {addSuccess && (
              <div
                style={{
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#10b981',
                  fontSize: '13px',
                  marginBottom: '1rem',
                }}
              >
                ✓ {addSuccess}
              </div>
            )}

            {newConnectorType === 'kraken' && (
              <button
                type="submit"
                disabled={addLoading}
                className="btn btn-primary"
              >
                {addLoading ? (
                  <>
                    <div className="spinner" style={{ width: 14, height: 14, borderTopColor: 'white' }} />
                    Connecting...
                  </>
                ) : (
                  '+ Add Kraken'
                )}
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Environment info */}
      <div className="section">
        <h2 className="section-title" style={{ marginBottom: '1rem' }}>
          Configuration
        </h2>
        <div
          className="card"
          style={{
            background: '#0d1117',
            border: '1px solid #1f2937',
            maxWidth: '600px',
          }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f9fafb', marginBottom: '12px' }}>
            Server Configuration
          </h3>
          <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '1rem' }}>
            Configure API credentials in <code style={{ color: '#3b82f6', fontSize: '12px' }}>server/.env</code>.
            See <code style={{ color: '#3b82f6', fontSize: '12px' }}>server/.env.example</code> for all available options.
          </p>
          <div
            style={{
              background: '#0a0e1a',
              borderRadius: '8px',
              padding: '1rem',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#9ca3af',
              lineHeight: '1.8',
            }}
          >
            <div><span style={{ color: '#6b7280' }}># Crypto trading</span></div>
            <div><span style={{ color: '#10b981' }}>KRAKEN_API_KEY</span>=your_key</div>
            <div><span style={{ color: '#10b981' }}>KRAKEN_API_SECRET</span>=your_secret</div>
            <div style={{ marginTop: '8px' }}><span style={{ color: '#6b7280' }}># Bank / investments</span></div>
            <div><span style={{ color: '#10b981' }}>PLAID_CLIENT_ID</span>=your_client_id</div>
            <div><span style={{ color: '#10b981' }}>PLAID_SECRET</span>=your_secret</div>
            <div style={{ marginTop: '8px' }}><span style={{ color: '#6b7280' }}># Stock market data</span></div>
            <div><span style={{ color: '#10b981' }}>FINNHUB_API_KEY</span>=your_key</div>
          </div>
        </div>
      </div>
    </div>
  );
}
