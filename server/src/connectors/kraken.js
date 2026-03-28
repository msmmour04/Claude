/**
 * Kraken Connector
 * Integrates with Kraken cryptocurrency exchange via kraken-api package
 */

const KrakenClient = require('kraken-api');

class KrakenConnector {
  constructor(apiKey, apiSecret) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.client = new KrakenClient(apiKey, apiSecret);
    this.name = 'Kraken';
    this.type = 'crypto';
  }

  /**
   * Get account balances
   * @returns {object} Map of asset -> balance { BTC: 0.5, ETH: 2.3, USD: 1000, ... }
   */
  async getBalance() {
    try {
      const response = await this.client.api('Balance');
      if (response.error && response.error.length > 0) {
        throw new Error(`Kraken API error: ${response.error.join(', ')}`);
      }
      // Normalize Kraken asset codes (XXBT -> BTC, XETH -> ETH, ZUSD -> USD)
      const raw = response.result || {};
      const normalized = {};
      for (const [asset, balance] of Object.entries(raw)) {
        const normalizedAsset = this._normalizeAsset(asset);
        normalized[normalizedAsset] = parseFloat(balance);
      }
      return normalized;
    } catch (err) {
      console.error('[KrakenConnector] getBalance error:', err.message);
      throw err;
    }
  }

  /**
   * Get ticker data for given pairs
   * @param {string[]} pairs - Array of pair strings like ['XBTUSD', 'ETHUSD']
   * @returns {object[]} Array of { symbol, price, change24h, volume, bid, ask }
   */
  async getTicker(pairs = ['XBTUSD', 'ETHUSD', 'SOLUSD', 'ADAUSD']) {
    try {
      const pairStr = pairs.join(',');
      const response = await this.client.api('Ticker', { pair: pairStr });
      if (response.error && response.error.length > 0) {
        throw new Error(`Kraken API error: ${response.error.join(', ')}`);
      }

      const result = response.result || {};
      return Object.entries(result).map(([pair, data]) => {
        const lastPrice = parseFloat(data.c[0]);
        const openPrice = parseFloat(data.o);
        const change24h = openPrice > 0 ? ((lastPrice - openPrice) / openPrice) * 100 : 0;

        return {
          symbol: this._normalizePair(pair),
          rawPair: pair,
          price: lastPrice,
          change24h: parseFloat(change24h.toFixed(2)),
          volume: parseFloat(data.v[1]), // 24h volume
          bid: parseFloat(data.b[0]),
          ask: parseFloat(data.a[0]),
          high24h: parseFloat(data.h[1]),
          low24h: parseFloat(data.l[1]),
        };
      });
    } catch (err) {
      console.error('[KrakenConnector] getTicker error:', err.message);
      throw err;
    }
  }

  /**
   * Get open orders
   * @returns {object[]} Array of open orders
   */
  async getOpenOrders() {
    try {
      const response = await this.client.api('OpenOrders');
      if (response.error && response.error.length > 0) {
        throw new Error(`Kraken API error: ${response.error.join(', ')}`);
      }

      const orders = response.result?.open || {};
      return Object.entries(orders).map(([orderId, order]) => ({
        id: orderId,
        pair: order.descr?.pair || '',
        type: order.descr?.ordertype || '',
        side: order.descr?.type || '',
        price: parseFloat(order.descr?.price || 0),
        volume: parseFloat(order.vol || 0),
        volumeExecuted: parseFloat(order.vol_exec || 0),
        status: order.status || 'open',
        openTime: order.opentm ? new Date(order.opentm * 1000).toISOString() : null,
        fee: parseFloat(order.fee || 0),
        cost: parseFloat(order.cost || 0),
      }));
    } catch (err) {
      console.error('[KrakenConnector] getOpenOrders error:', err.message);
      throw err;
    }
  }

  /**
   * Place an order
   * @param {string} side - 'buy' or 'sell'
   * @param {string} pair - Trading pair like 'XBTUSD'
   * @param {string|number} volume - Amount to buy/sell
   * @param {string} ordertype - 'market' or 'limit'
   * @param {string|number} [price] - Price for limit orders
   * @returns {object} Order confirmation
   */
  async placeOrder(side, pair, volume, ordertype = 'market', price = null) {
    try {
      const params = {
        pair,
        type: side,
        ordertype,
        volume: volume.toString(),
      };

      if (ordertype === 'limit' && price) {
        params.price = price.toString();
      }

      const response = await this.client.api('AddOrder', params);
      if (response.error && response.error.length > 0) {
        throw new Error(`Kraken API error: ${response.error.join(', ')}`);
      }

      const result = response.result || {};
      return {
        success: true,
        txids: result.txid || [],
        description: result.descr?.order || '',
        pair,
        side,
        volume: parseFloat(volume),
        ordertype,
        price: price ? parseFloat(price) : null,
      };
    } catch (err) {
      console.error('[KrakenConnector] placeOrder error:', err.message);
      throw err;
    }
  }

  /**
   * Cancel an order
   * @param {string} orderId - Order transaction ID
   * @returns {object} Cancellation result
   */
  async cancelOrder(orderId) {
    try {
      const response = await this.client.api('CancelOrder', { txid: orderId });
      if (response.error && response.error.length > 0) {
        throw new Error(`Kraken API error: ${response.error.join(', ')}`);
      }

      return {
        success: true,
        count: response.result?.count || 0,
        pending: response.result?.pending || false,
        orderId,
      };
    } catch (err) {
      console.error('[KrakenConnector] cancelOrder error:', err.message);
      throw err;
    }
  }

  /**
   * Get recent trades for a pair
   * @param {string} pair - Trading pair
   * @returns {object[]} Recent trades
   */
  async getRecentTrades(pair = 'XBTUSD') {
    try {
      const response = await this.client.api('Trades', { pair });
      if (response.error && response.error.length > 0) {
        throw new Error(`Kraken API error: ${response.error.join(', ')}`);
      }
      return response.result || {};
    } catch (err) {
      console.error('[KrakenConnector] getRecentTrades error:', err.message);
      throw err;
    }
  }

  /**
   * Get OHLC data for charting
   * @param {string} pair - Trading pair
   * @param {number} interval - Interval in minutes (1, 5, 15, 30, 60, 240, 1440)
   * @returns {object[]} OHLC data
   */
  async getOHLC(pair = 'XBTUSD', interval = 1440) {
    try {
      const response = await this.client.api('OHLC', { pair, interval });
      if (response.error && response.error.length > 0) {
        throw new Error(`Kraken API error: ${response.error.join(', ')}`);
      }

      const result = response.result || {};
      const pairData = result[Object.keys(result).find(k => k !== 'last')] || [];

      return pairData.map(candle => ({
        time: candle[0],
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        vwap: parseFloat(candle[5]),
        volume: parseFloat(candle[6]),
        count: candle[7],
      }));
    } catch (err) {
      console.error('[KrakenConnector] getOHLC error:', err.message);
      throw err;
    }
  }

  /**
   * Get server time (useful for checking connectivity)
   * @returns {object} Server time
   */
  async getServerTime() {
    try {
      const response = await this.client.api('Time');
      return response.result || {};
    } catch (err) {
      console.error('[KrakenConnector] getServerTime error:', err.message);
      throw err;
    }
  }

  /**
   * Normalize Kraken asset codes to standard symbols
   * @private
   */
  _normalizeAsset(asset) {
    const map = {
      XXBT: 'BTC',
      XBT: 'BTC',
      XETH: 'ETH',
      XLTC: 'LTC',
      XXLM: 'XLM',
      XXMR: 'XMR',
      XXRP: 'XRP',
      XZEC: 'ZEC',
      ZUSD: 'USD',
      ZEUR: 'EUR',
      ZGBP: 'GBP',
      ZCAD: 'CAD',
      ZJPY: 'JPY',
    };
    return map[asset] || asset;
  }

  /**
   * Normalize Kraken pair to readable format
   * @private
   */
  _normalizePair(pair) {
    const map = {
      XXBTZUSD: 'BTC/USD',
      XETHZUSD: 'ETH/USD',
      XLTCZUSD: 'LTC/USD',
      XXLMZUSD: 'XLM/USD',
      XXRPZUSD: 'XRP/USD',
      SOLUSD: 'SOL/USD',
      ADAUSD: 'ADA/USD',
      DOTUSD: 'DOT/USD',
      MATICUSD: 'MATIC/USD',
    };
    return map[pair] || pair;
  }
}

module.exports = KrakenConnector;
