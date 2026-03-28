import React, { useState, useEffect, useCallback } from 'react';
import TradePanel from '../components/TradePanel.jsx';
import { getConnectors, getOpenOrders, cancelOrder } from '../api/client.js';

function formatPrice(value) {
  if (!value) return '-';
  if (value >= 1000) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${value.toFixed(2)}`;
}

function OrderRow({ order, onCancel }) {
  const [cancelling, setCancelling] = useState(false);

  async function handleCancel() {
    if (!confirm(`Cancel order ${order.id}?`)) return;
    setCancelling(true);
    try {
      await onCancel(order.id);
    } finally {
      setCancelling(false);
    }
  }

  const isBuy = order.side === 'buy';

  return (
    <tr>
      <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6b7280' }}>
        {order.id?.slice(0, 8)}...
      </td>
      <td>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '700',
            background: isBuy ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
            color: isBuy ? '#10b981' : '#ef4444',
          }}
        >
          {(order.side || '').toUpperCase()}
        </span>
      </td>
      <td style={{ fontWeight: '600', color: '#f9fafb' }}>
        {order.pair}
      </td>
      <td style={{ color: '#9ca3af' }}>
        {order.type}
      </td>
      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {formatPrice(order.price)}
      </td>
      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {order.volume?.toFixed(8)}
      </td>
      <td style={{ textAlign: 'right' }}>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            background: 'rgba(59,130,246,0.15)',
            color: '#3b82f6',
          }}
        >
          {order.status}
        </span>
      </td>
      <td style={{ textAlign: 'right' }}>
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="btn btn-ghost btn-sm"
          style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
        >
          {cancelling ? '...' : 'Cancel'}
        </button>
      </td>
    </tr>
  );
}

export default function Trade() {
  const [connectors, setConnectors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedConnector, setSelectedConnector] = useState('kraken');
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState(null);

  const fetchConnectors = useCallback(async () => {
    try {
      const data = await getConnectors();
      setConnectors(data.connected || []);
    } catch (err) {
      console.error('Failed to load connectors:', err.message);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!selectedConnector) return;
    setLoadingOrders(true);
    setError(null);
    try {
      const data = await getOpenOrders(selectedConnector);
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [selectedConnector]);

  useEffect(() => {
    fetchConnectors();
  }, [fetchConnectors]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function handleCancelOrder(orderId) {
    try {
      await cancelOrder(selectedConnector, orderId);
      await fetchOrders();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleOrderPlaced() {
    // Refresh orders after placing one
    setTimeout(fetchOrders, 1000);
  }

  const tradingConnectors = connectors.filter(c => c.supportsTrading);

  return (
    <div className="page fade-in">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Trade</h1>
        <p className="page-subtitle">
          Place orders and manage positions via Kraken
        </p>
      </div>

      {/* Warning if no trading connectors */}
      {tradingConnectors.length === 0 && (
        <div
          style={{
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#f59e0b',
          }}
        >
          <span style={{ fontSize: '18px' }}>⚠</span>
          <div>
            <p style={{ fontWeight: '600', marginBottom: '2px', color: '#f59e0b' }}>No trading connectors</p>
            <p style={{ fontSize: '13px', color: '#92400e' }}>
              Connect Kraken in{' '}
              <a href="/settings" style={{ color: '#f59e0b' }}>Settings</a>{' '}
              to start trading.
            </p>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 380px) 1fr',
          gap: '1.25rem',
          alignItems: 'start',
        }}
      >
        {/* Trade panel */}
        <TradePanel
          connectors={connectors}
          onOrderPlaced={handleOrderPlaced}
        />

        {/* Open orders */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '1.25rem',
              borderBottom: '1px solid #1f2937',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f9fafb' }}>
              Open Orders
              {orders.length > 0 && (
                <span
                  style={{
                    marginLeft: '8px',
                    fontSize: '11px',
                    background: 'rgba(59,130,246,0.15)',
                    color: '#3b82f6',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  {orders.length}
                </span>
              )}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {tradingConnectors.length > 1 && (
                <select
                  value={selectedConnector}
                  onChange={e => setSelectedConnector(e.target.value)}
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                  {tradingConnectors.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
              <button
                onClick={fetchOrders}
                disabled={loadingOrders}
                className="btn btn-ghost btn-sm"
              >
                {loadingOrders ? '...' : '↻ Refresh'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ padding: '1rem' }}>
              <div className="error-container">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {loadingOrders ? (
            <div className="loading-container" style={{ padding: '2rem' }}>
              <div className="spinner" />
              <span>Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state" style={{ padding: '2.5rem' }}>
              <div style={{ fontSize: '32px', opacity: 0.3 }}>📋</div>
              <h3 style={{ fontSize: '14px' }}>No open orders</h3>
              <p style={{ fontSize: '13px' }}>
                {tradingConnectors.length > 0
                  ? 'All orders have been filled or cancelled'
                  : 'Connect Kraken to view orders'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Side</th>
                    <th>Pair</th>
                    <th>Type</th>
                    <th style={{ textAlign: 'right' }}>Price</th>
                    <th style={{ textAlign: 'right' }}>Volume</th>
                    <th style={{ textAlign: 'right' }}>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      onCancel={handleCancelOrder}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div
        style={{
          marginTop: '2rem',
          padding: '12px 16px',
          background: '#0d1117',
          border: '1px solid #1f2937',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#4b5563',
        }}
      >
        ⚠ Trading involves risk. Orders placed here execute directly via the Kraken API.
        Always verify your order details before submitting. This application is for
        informational and educational purposes.
      </div>
    </div>
  );
}
