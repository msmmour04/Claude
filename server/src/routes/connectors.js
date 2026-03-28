/**
 * Connector Management Routes
 * List, configure, and manage financial platform connectors
 */

const express = require('express');
const router = express.Router();
const registry = require('../connectors/index');
const KrakenConnector = require('../connectors/kraken');
const PlaidConnector = require('../connectors/plaid');

/**
 * GET /api/connectors
 * List all registered connectors with metadata
 */
router.get('/', (_req, res) => {
  const connectors = registry.getAll().map(({ id, meta }) => ({
    id,
    name: meta.name,
    type: meta.type,
    description: meta.description,
    icon: meta.icon,
    connected: meta.connected,
    connectedAt: meta.connectedAt,
    supportsTrading: meta.supportsTrading || false,
  }));

  // Also return known but not-yet-configured connectors
  const knownConnectors = [
    { id: 'kraken', name: 'Kraken', type: 'crypto', description: 'Kraken cryptocurrency exchange', icon: 'kraken', supportsTrading: true },
    { id: 'plaid-bofa', name: 'Bank of America', type: 'bank', description: 'Bank of America via Plaid', icon: 'bofa', supportsTrading: false },
    { id: 'plaid-public', name: 'Public.com', type: 'investment', description: 'Public.com stock investments via Plaid', icon: 'public', supportsTrading: false },
    { id: 'shopify', name: 'Shopify Balance', type: 'bank', description: 'Shopify Balance account', icon: 'shopify', supportsTrading: false, comingSoon: true },
  ];

  const registeredIds = connectors.map(c => c.id);
  const unregistered = knownConnectors
    .filter(k => !registeredIds.includes(k.id) && !registeredIds.includes('plaid'))
    .map(k => ({ ...k, connected: false }));

  // If plaid is registered, don't show individual plaid sub-connectors as unregistered
  const plaidRegistered = registeredIds.includes('plaid');
  const filteredUnregistered = unregistered.filter(u => {
    if (plaidRegistered && (u.id === 'plaid-bofa' || u.id === 'plaid-public')) return false;
    return true;
  });

  res.json({
    connected: connectors,
    available: filteredUnregistered,
    total: connectors.length,
  });
});

/**
 * POST /api/connectors/kraken
 * Register/update Kraken connector with API credentials
 */
router.post('/kraken', (req, res) => {
  const { apiKey, apiSecret } = req.body;

  if (!apiKey || !apiSecret) {
    return res.status(400).json({ error: 'apiKey and apiSecret are required' });
  }

  try {
    const kraken = new KrakenConnector(apiKey, apiSecret);
    registry.register('kraken', kraken, {
      name: 'Kraken',
      type: 'crypto',
      description: 'Kraken cryptocurrency exchange',
      icon: 'kraken',
      supportsTrading: true,
    });

    res.json({
      success: true,
      message: 'Kraken connector registered successfully',
      connectorId: 'kraken',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/connectors/plaid/link-token
 * Create a Plaid Link token to initiate bank connection flow
 */
router.post('/plaid/link-token', async (req, res) => {
  const { userId = 'default-user', products } = req.body;

  let plaid = registry.get('plaid');

  // Auto-create plaid connector if credentials exist in env
  if (!plaid && process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET) {
    plaid = new PlaidConnector(
      process.env.PLAID_CLIENT_ID,
      process.env.PLAID_SECRET,
      process.env.PLAID_ENV || 'sandbox'
    );
    registry.register('plaid', plaid, {
      name: 'Plaid',
      type: 'bank',
      description: 'Plaid bank and investment connector',
      icon: 'plaid',
    });
  }

  if (!plaid) {
    return res.status(400).json({ error: 'Plaid connector not configured. Add PLAID_CLIENT_ID and PLAID_SECRET to environment.' });
  }

  try {
    const result = await plaid.createLinkToken(userId, products);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/connectors/plaid/exchange-token
 * Exchange a Plaid public token for an access token
 */
router.post('/plaid/exchange-token', async (req, res) => {
  const { publicToken, institutionId, institutionName } = req.body;

  if (!publicToken) {
    return res.status(400).json({ error: 'publicToken is required' });
  }

  const plaid = registry.get('plaid');
  if (!plaid) {
    return res.status(400).json({ error: 'Plaid connector not configured' });
  }

  try {
    const result = await plaid.exchangePublicToken(publicToken, institutionId, institutionName);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/connectors/:id
 * Disconnect/unregister a connector
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const removed = registry.unregister(id);

  if (!removed) {
    return res.status(404).json({ error: `Connector '${id}' not found` });
  }

  res.json({ success: true, message: `Connector '${id}' disconnected` });
});

/**
 * GET /api/connectors/:id/status
 * Get status and health of a specific connector
 */
router.get('/:id/status', async (req, res) => {
  const { id } = req.params;

  const connector = registry.get(id);
  const meta = registry.getMeta(id);

  if (!connector) {
    return res.status(404).json({
      id,
      connected: false,
      error: `Connector '${id}' not found`,
    });
  }

  const status = {
    id,
    name: meta.name,
    type: meta.type,
    connected: true,
    connectedAt: meta.connectedAt,
    healthy: false,
    lastChecked: new Date().toISOString(),
  };

  // Perform a health check
  try {
    if (meta.type === 'crypto' && connector.getServerTime) {
      await connector.getServerTime();
      status.healthy = true;
    } else if (meta.type === 'bank' && connector.getConnectedInstitutions) {
      const institutions = connector.getConnectedInstitutions();
      status.healthy = true;
      status.institutions = institutions;
    } else {
      status.healthy = true; // Assume healthy if no check method
    }
  } catch (err) {
    status.healthy = false;
    status.error = err.message;
  }

  res.json(status);
});

module.exports = router;
