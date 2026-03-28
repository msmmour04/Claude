/**
 * Portfolio Routes
 * Aggregate balances and net worth across all connected platforms
 */

const express = require('express');
const router = express.Router();
const registry = require('../connectors/index');

/**
 * GET /api/portfolio
 * Returns aggregated net worth across all platforms
 */
router.get('/', async (_req, res) => {
  try {
    const connectors = registry.getAll();

    if (connectors.length === 0) {
      return res.json({
        totalNetWorth: 0,
        currency: 'USD',
        platforms: [],
        breakdown: {},
        lastUpdated: new Date().toISOString(),
      });
    }

    const platforms = [];
    let totalNetWorth = 0;

    for (const { id, meta, connector } of connectors) {
      try {
        let platformData = {
          id,
          name: meta.name,
          type: meta.type,
          icon: meta.icon,
          totalValue: 0,
          assets: [],
          currency: 'USD',
          error: null,
        };

        if (meta.type === 'crypto' && connector.getBalance) {
          const balances = await connector.getBalance();
          // Fetch prices to calculate USD value
          const nonZeroAssets = Object.entries(balances)
            .filter(([, bal]) => bal > 0)
            .map(([asset]) => asset);

          let prices = {};
          if (nonZeroAssets.length > 0 && connector.getTicker) {
            try {
              // Build pairs for non-USD assets
              const pairs = nonZeroAssets
                .filter(a => a !== 'USD' && a !== 'EUR')
                .map(a => `${a === 'BTC' ? 'XBT' : a}USD`)
                .slice(0, 10);

              if (pairs.length > 0) {
                const tickers = await connector.getTicker(pairs);
                tickers.forEach(t => {
                  const sym = t.symbol.split('/')[0];
                  prices[sym] = t.price;
                });
              }
            } catch (tickerErr) {
              console.warn(`[Portfolio] Could not fetch tickers for ${id}:`, tickerErr.message);
            }
          }

          platformData.assets = Object.entries(balances)
            .filter(([, bal]) => bal > 0)
            .map(([asset, balance]) => {
              let usdValue = 0;
              if (asset === 'USD') {
                usdValue = balance;
              } else if (prices[asset]) {
                usdValue = balance * prices[asset];
              }
              return { asset, balance, usdValue, price: prices[asset] || null };
            });

          platformData.totalValue = platformData.assets.reduce((sum, a) => sum + a.usdValue, 0);

        } else if (meta.type === 'bank' && connector.getAccounts) {
          const accounts = await connector.getAccounts();

          // Also check for investments
          let investments = [];
          try {
            // Try to get investments if any institution tokens are available
            const institutions = connector.getConnectedInstitutions ? connector.getConnectedInstitutions() : [];
            for (const inst of institutions) {
              if (inst.institutionName === 'Public.com' || inst.institutionId === 'public') {
                const invData = await connector.getInvestments(inst.itemId).catch(() => null);
                if (invData) investments.push(...(invData.holdings || []));
              }
            }
          } catch (invErr) {
            // Investments may not be configured
          }

          platformData.assets = accounts.map(acct => ({
            asset: acct.name,
            balance: acct.balance.current,
            usdValue: acct.balance.current,
            type: acct.type,
            subtype: acct.subtype,
            institution: acct.institution,
          }));

          if (investments.length > 0) {
            investments.forEach(holding => {
              platformData.assets.push({
                asset: holding.symbol,
                balance: holding.quantity,
                usdValue: holding.institutionValue || 0,
                type: 'investment',
                subtype: 'equity',
              });
            });
          }

          platformData.totalValue = platformData.assets.reduce((sum, a) => sum + (a.usdValue || 0), 0);
        }

        totalNetWorth += platformData.totalValue;
        platforms.push(platformData);
      } catch (platformErr) {
        console.error(`[Portfolio] Error fetching data for ${id}:`, platformErr.message);
        platforms.push({
          id,
          name: meta.name,
          type: meta.type,
          totalValue: 0,
          assets: [],
          error: platformErr.message,
        });
      }
    }

    // Build allocation breakdown
    const breakdown = {};
    platforms.forEach(p => {
      breakdown[p.name] = {
        value: p.totalValue,
        percentage: totalNetWorth > 0 ? (p.totalValue / totalNetWorth) * 100 : 0,
      };
    });

    res.json({
      totalNetWorth,
      currency: 'USD',
      platforms,
      breakdown,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Portfolio] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/portfolio/:connectorId
 * Returns portfolio data for a specific platform
 */
router.get('/:connectorId', async (req, res) => {
  const { connectorId } = req.params;

  const connector = registry.get(connectorId);
  const meta = registry.getMeta(connectorId);

  if (!connector) {
    return res.status(404).json({ error: `Connector '${connectorId}' not found` });
  }

  try {
    let data = { id: connectorId, name: meta.name, type: meta.type };

    if (meta.type === 'crypto') {
      const balances = await connector.getBalance();
      data.balances = balances;

      // Fetch tickers for non-zero assets
      const pairs = Object.entries(balances)
        .filter(([asset, bal]) => bal > 0 && asset !== 'USD')
        .map(([asset]) => `${asset === 'BTC' ? 'XBT' : asset}USD`)
        .slice(0, 10);

      if (pairs.length > 0) {
        try {
          data.tickers = await connector.getTicker(pairs);
        } catch (_) {
          data.tickers = [];
        }
      }
    } else if (meta.type === 'bank') {
      data.accounts = await connector.getAccounts();
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
