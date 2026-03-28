/**
 * Trade Routes
 * Place, cancel, and list orders via connected trading connectors
 */

const express = require('express');
const router = express.Router();
const registry = require('../connectors/index');

/**
 * POST /api/trade/order
 * Place a new order via a connector
 * Body: { connectorId, side, pair, volume, ordertype, price? }
 */
router.post('/order', async (req, res) => {
  const { connectorId, side, pair, volume, ordertype = 'market', price } = req.body;

  if (!connectorId || !side || !pair || !volume) {
    return res.status(400).json({
      error: 'Missing required fields: connectorId, side, pair, volume',
    });
  }

  const connector = registry.get(connectorId);
  if (!connector) {
    return res.status(404).json({ error: `Connector '${connectorId}' not found` });
  }

  if (!connector.placeOrder) {
    return res.status(400).json({
      error: `Connector '${connectorId}' does not support trading`,
    });
  }

  // Validate side
  if (!['buy', 'sell'].includes(side.toLowerCase())) {
    return res.status(400).json({ error: "side must be 'buy' or 'sell'" });
  }

  // Validate ordertype
  if (!['market', 'limit'].includes(ordertype.toLowerCase())) {
    return res.status(400).json({ error: "ordertype must be 'market' or 'limit'" });
  }

  // Limit orders require price
  if (ordertype === 'limit' && !price) {
    return res.status(400).json({ error: 'Limit orders require a price' });
  }

  try {
    const result = await connector.placeOrder(
      side.toLowerCase(),
      pair.toUpperCase(),
      volume,
      ordertype.toLowerCase(),
      price || null
    );

    res.json({
      success: true,
      order: result,
      connectorId,
      placedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Trade] placeOrder error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/trade/order/:id
 * Cancel an open order
 * Query: connectorId
 */
router.delete('/order/:id', async (req, res) => {
  const { id } = req.params;
  const connectorId = req.query.connectorId || 'kraken';

  const connector = registry.get(connectorId);
  if (!connector) {
    return res.status(404).json({ error: `Connector '${connectorId}' not found` });
  }

  if (!connector.cancelOrder) {
    return res.status(400).json({
      error: `Connector '${connectorId}' does not support order cancellation`,
    });
  }

  try {
    const result = await connector.cancelOrder(id);
    res.json({
      success: true,
      result,
      orderId: id,
      connectorId,
      cancelledAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Trade] cancelOrder error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/trade/orders
 * Get open orders for a connector
 * Query: connectorId
 */
router.get('/orders', async (req, res) => {
  const connectorId = req.query.connectorId || 'kraken';

  const connector = registry.get(connectorId);
  if (!connector) {
    return res.status(404).json({ error: `Connector '${connectorId}' not found` });
  }

  if (!connector.getOpenOrders) {
    return res.status(400).json({
      error: `Connector '${connectorId}' does not support order listing`,
    });
  }

  try {
    const orders = await connector.getOpenOrders();
    res.json({
      connectorId,
      orders,
      count: orders.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Trade] getOpenOrders error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
