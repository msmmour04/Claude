/**
 * Net Worth Tracker - Express Server
 * Main entry point: sets up Express, mounts all routes, initializes connectors
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const registry = require('./connectors/index');
const KrakenConnector = require('./connectors/kraken');
const PlaidConnector = require('./connectors/plaid');

const portfolioRoutes = require('./routes/portfolio');
const marketRoutes = require('./routes/market');
const tradeRoutes = require('./routes/trade');
const connectorRoutes = require('./routes/connectors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (dev)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Mount routes
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/connectors', connectorRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    connectors: registry.list(),
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

/**
 * Initialize connectors from environment variables on startup
 */
function initConnectors() {
  // Kraken
  if (process.env.KRAKEN_API_KEY && process.env.KRAKEN_API_SECRET) {
    try {
      const kraken = new KrakenConnector(
        process.env.KRAKEN_API_KEY,
        process.env.KRAKEN_API_SECRET
      );
      registry.register('kraken', kraken, {
        name: 'Kraken',
        type: 'crypto',
        description: 'Kraken cryptocurrency exchange',
        icon: 'kraken',
        supportsTrading: true,
      });
      console.log('[Init] Kraken connector registered');
    } catch (err) {
      console.error('[Init] Failed to register Kraken connector:', err.message);
    }
  } else {
    console.log('[Init] Kraken credentials not found in env, skipping auto-registration');
  }

  // Plaid (for BofA, Public.com, etc.)
  if (process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET) {
    try {
      const plaidEnv = process.env.PLAID_ENV || 'sandbox';
      const plaid = new PlaidConnector(
        process.env.PLAID_CLIENT_ID,
        process.env.PLAID_SECRET,
        plaidEnv
      );

      // If pre-configured access tokens exist, store them
      if (process.env.PLAID_ACCESS_TOKEN_BOFA) {
        plaid.storeAccessToken('bofa', process.env.PLAID_ACCESS_TOKEN_BOFA, 'Bank of America');
        console.log('[Init] BofA access token loaded from env');
      }
      if (process.env.PLAID_ACCESS_TOKEN_PUBLIC) {
        plaid.storeAccessToken('public', process.env.PLAID_ACCESS_TOKEN_PUBLIC, 'Public.com');
        console.log('[Init] Public.com access token loaded from env');
      }

      registry.register('plaid', plaid, {
        name: 'Plaid',
        type: 'bank',
        description: 'Plaid bank and investment connector',
        icon: 'plaid',
        supportsTrading: false,
        institutions: ['Bank of America', 'Public.com'],
      });
      console.log('[Init] Plaid connector registered');
    } catch (err) {
      console.error('[Init] Failed to register Plaid connector:', err.message);
    }
  } else {
    console.log('[Init] Plaid credentials not found in env, skipping auto-registration');
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  Net Worth Tracker API`);
  console.log(`  Listening on http://localhost:${PORT}`);
  console.log(`========================================\n`);
  initConnectors();
});

module.exports = app;
