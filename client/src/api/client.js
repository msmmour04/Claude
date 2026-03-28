/**
 * API Client
 * Axios instance + all API call functions for the Net Worth Tracker
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor - normalize errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unknown error occurred';
    return Promise.reject(new Error(message));
  }
);

// ============================================================
// Portfolio
// ============================================================

/**
 * Get aggregated portfolio across all platforms
 */
export async function getPortfolio() {
  return api.get('/portfolio');
}

/**
 * Get portfolio for a specific platform connector
 * @param {string} connectorId
 */
export async function getPlatformPortfolio(connectorId) {
  return api.get(`/portfolio/${connectorId}`);
}

// ============================================================
// Market Data
// ============================================================

/**
 * Get top 20 cryptocurrencies
 */
export async function getCryptoMarket() {
  return api.get('/market/crypto');
}

/**
 * Get top stocks
 */
export async function getStockMarket() {
  return api.get('/market/stocks');
}

/**
 * Get 7-day price history for a symbol
 * @param {string} symbol - Ticker symbol
 * @param {string} type - 'crypto' or 'stock'
 * @param {string} coinId - CoinGecko coin ID (for crypto)
 */
export async function getAssetChart(symbol, type = 'crypto', coinId = null) {
  const params = { type };
  if (coinId) params.coinId = coinId;
  return api.get(`/market/chart/${symbol}`, { params });
}

// ============================================================
// Trading
// ============================================================

/**
 * Place a trading order
 * @param {string} connectorId - Which connector to use
 * @param {string} side - 'buy' or 'sell'
 * @param {string} pair - Trading pair (e.g., 'XBTUSD')
 * @param {string|number} volume - Amount
 * @param {string} ordertype - 'market' or 'limit'
 * @param {string|number} [price] - Price for limit orders
 */
export async function placeOrder(connectorId, side, pair, volume, ordertype, price = null) {
  return api.post('/trade/order', { connectorId, side, pair, volume, ordertype, price });
}

/**
 * Cancel an open order
 * @param {string} connectorId
 * @param {string} orderId
 */
export async function cancelOrder(connectorId, orderId) {
  return api.delete(`/trade/order/${orderId}`, { params: { connectorId } });
}

/**
 * Get open orders for a connector
 * @param {string} connectorId
 */
export async function getOpenOrders(connectorId = 'kraken') {
  return api.get('/trade/orders', { params: { connectorId } });
}

// ============================================================
// Connectors
// ============================================================

/**
 * Get all registered connectors
 */
export async function getConnectors() {
  return api.get('/connectors');
}

/**
 * Get status for a specific connector
 * @param {string} connectorId
 */
export async function getConnectorStatus(connectorId) {
  return api.get(`/connectors/${connectorId}/status`);
}

/**
 * Register Kraken connector
 * @param {string} apiKey
 * @param {string} apiSecret
 */
export async function connectKraken(apiKey, apiSecret) {
  return api.post('/connectors/kraken', { apiKey, apiSecret });
}

/**
 * Create a Plaid Link token to start bank connection flow
 * @param {string} [userId]
 */
export async function createPlaidLinkToken(userId = 'default-user') {
  return api.post('/connectors/plaid/link-token', { userId });
}

/**
 * Exchange Plaid public token for access token
 * @param {string} publicToken - From Plaid Link callback
 * @param {string} institutionId - Institution identifier
 * @param {string} institutionName - Human-readable name
 */
export async function exchangePlaidToken(publicToken, institutionId, institutionName) {
  return api.post('/connectors/plaid/exchange-token', { publicToken, institutionId, institutionName });
}

/**
 * Disconnect a connector
 * @param {string} connectorId
 */
export async function disconnectConnector(connectorId) {
  return api.delete(`/connectors/${connectorId}`);
}

/**
 * Health check
 */
export async function getHealth() {
  return api.get('/health');
}

export default api;
