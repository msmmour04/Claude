import React, { useState } from 'react';
import { placeOrder } from '../api/client.js';

const COMMON_PAIRS = [
  'XBTUSD', 'ETHUSD', 'SOLUSD', 'ADAUSD', 'DOTUSD',
  'LINKUSD', 'MATICUSD', 'AVAXUSD', 'ATOMUSD', 'LTCUSD',
];

export default function TradePanel({ connectors = [], onOrderPlaced }) {
  const [connectorId, setConnectorId] = useState('kraken');
  const [side, setSide] = useState('buy');
  const [pair, setPair] = useState('XBTUSD');
  const [volume, setVolume] = useState('');
  const [ordertype, setOrdertype] = useState('market');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const tradingConnectors = connectors.filter(c => c.supportsTrading);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!volume || parseFloat(volume) <= 0) {
      setError('Please enter a valid volume');
      return;
    }
    if (ordertype === 'limit' && (!price || parseFloat(price) <= 0)) {
      setError('Limit orders require a price');
      return;
    }

    setLoading(true);
    try {
      const result = await placeOrder(
        connectorId,
        side,
        pair,
        volume,
        ordertype,
        ordertype === 'limit' ? price : null
      );
      setSuccess(`Order placed! ${result.order?.description || ''}`);
      setVolume('');
      setPrice('');
      if (onOrderPlaced) onOrderPlaced(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h3
        style={{
          fontSize: '14px',
          fontWeight: '700',
          color: '#f9fafb',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span>⇄</span> Place Order
      </h3>

      {tradingConnectors.length === 0 && (
        <div
          style={{
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '8px',
            padding: '12px',
            color: '#f59e0b',
            fontSize: '13px',
            marginBottom: '1rem',
          }}
        >
          ⚠ No trading connectors connected. Add Kraken in Settings.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Connector selector */}
        <div className="form-group">
          <label>Exchange / Platform</label>
          <select
            value={connectorId}
            onChange={e => setConnectorId(e.target.value)}
            disabled={tradingConnectors.length === 0}
          >
            {tradingConnectors.length > 0 ? (
              tradingConnectors.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))
            ) : (
              <option value="">No connectors available</option>
            )}
          </select>
        </div>

        {/* Buy / Sell toggle */}
        <div className="form-group">
          <label>Side</label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}
          >
            <button
              type="button"
              onClick={() => setSide('buy')}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: `2px solid ${side === 'buy' ? '#10b981' : '#1f2937'}`,
                background: side === 'buy' ? 'rgba(16,185,129,0.12)' : '#1f2937',
                color: side === 'buy' ? '#10b981' : '#9ca3af',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              ▲ BUY
            </button>
            <button
              type="button"
              onClick={() => setSide('sell')}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: `2px solid ${side === 'sell' ? '#ef4444' : '#1f2937'}`,
                background: side === 'sell' ? 'rgba(239,68,68,0.12)' : '#1f2937',
                color: side === 'sell' ? '#ef4444' : '#9ca3af',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              ▼ SELL
            </button>
          </div>
        </div>

        {/* Pair */}
        <div className="form-group">
          <label>Pair</label>
          <input
            list="pairs-list"
            value={pair}
            onChange={e => setPair(e.target.value.toUpperCase())}
            placeholder="e.g. XBTUSD"
            required
          />
          <datalist id="pairs-list">
            {COMMON_PAIRS.map(p => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>

        {/* Order type */}
        <div className="form-group">
          <label>Order Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {['market', 'limit'].map(ot => (
              <button
                key={ot}
                type="button"
                onClick={() => setOrdertype(ot)}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${ordertype === ot ? '#3b82f6' : '#1f2937'}`,
                  background: ordertype === ot ? 'rgba(59,130,246,0.12)' : '#1f2937',
                  color: ordertype === ot ? '#3b82f6' : '#9ca3af',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s ease',
                }}
              >
                {ot.charAt(0).toUpperCase() + ot.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Price (for limit orders) */}
        {ordertype === 'limit' && (
          <div className="form-group">
            <label>Limit Price (USD)</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="0.00"
              min="0"
              step="any"
              required
            />
          </div>
        )}

        {/* Volume */}
        <div className="form-group">
          <label>Volume (amount of base asset)</label>
          <input
            type="number"
            value={volume}
            onChange={e => setVolume(e.target.value)}
            placeholder="0.00"
            min="0"
            step="any"
            required
          />
        </div>

        {/* Error / Success messages */}
        {error && (
          <div className="error-container" style={{ marginBottom: '1rem' }}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
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
            ✓ {success}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || tradingConnectors.length === 0}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: side === 'buy'
              ? loading ? '#059669' : '#10b981'
              : loading ? '#dc2626' : '#ef4444',
            color: 'white',
            fontWeight: '700',
            fontSize: '15px',
            cursor: loading || tradingConnectors.length === 0 ? 'not-allowed' : 'pointer',
            opacity: loading || tradingConnectors.length === 0 ? 0.7 : 1,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {loading ? (
            <>
              <div className="spinner" style={{ width: 16, height: 16, borderTopColor: 'white' }} />
              Placing Order...
            </>
          ) : (
            `${side === 'buy' ? '▲ Buy' : '▼ Sell'} ${pair}`
          )}
        </button>
      </form>
    </div>
  );
}
