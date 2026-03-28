/**
 * Market Data Routes
 * Fetches crypto data from CoinGecko and stock data from Finnhub
 * Caches results for 60 seconds to avoid rate limits
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 60 seconds

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const FINNHUB_KEY = process.env.FINNHUB_API_KEY || '';

const TOP_STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC'];

/**
 * GET /api/market/crypto
 * Returns top 20 cryptocurrencies by market cap
 */
router.get('/crypto', async (_req, res) => {
  const cacheKey = 'crypto_markets';
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await axios.get(`${COINGECKO_BASE}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 20,
        page: 1,
        sparkline: true,
        price_change_percentage: '24h,7d',
      },
      timeout: 10000,
    });

    const coins = response.data.map((coin, index) => ({
      rank: index + 1,
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      price: coin.current_price,
      marketCap: coin.market_cap,
      volume24h: coin.total_volume,
      change24h: coin.price_change_percentage_24h,
      change7d: coin.price_change_percentage_7d_in_currency,
      sparkline: coin.sparkline_in_7d?.price || [],
      ath: coin.ath,
      athDate: coin.ath_date,
    }));

    setCache(cacheKey, coins);
    res.json(coins);
  } catch (err) {
    console.error('[Market] CoinGecko error:', err.message);
    // Return cached stale data if available
    const stale = cache.get(cacheKey);
    if (stale) return res.json(stale.data);
    res.status(502).json({ error: 'Failed to fetch crypto market data', details: err.message });
  }
});

/**
 * GET /api/market/stocks
 * Returns top stocks with current price and change
 */
router.get('/stocks', async (_req, res) => {
  const cacheKey = 'stock_markets';
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  if (!FINNHUB_KEY) {
    // Return mock data if no API key configured
    const mockStocks = TOP_STOCKS.map((symbol, index) => ({
      rank: index + 1,
      symbol,
      name: symbol,
      price: Math.random() * 500 + 50,
      change24h: (Math.random() - 0.5) * 10,
      change: (Math.random() - 0.5) * 10,
      volume24h: Math.floor(Math.random() * 50000000),
      marketCap: Math.floor(Math.random() * 2e12),
      sparkline: Array.from({ length: 7 }, () => Math.random() * 500 + 50),
      note: 'Demo data - add FINNHUB_API_KEY for live data',
    }));
    setCache(cacheKey, mockStocks);
    return res.json(mockStocks);
  }

  try {
    const stockPromises = TOP_STOCKS.map(async (symbol, index) => {
      try {
        const [quoteRes, profileRes] = await Promise.all([
          axios.get(`${FINNHUB_BASE}/quote`, {
            params: { symbol, token: FINNHUB_KEY },
            timeout: 8000,
          }),
          axios.get(`${FINNHUB_BASE}/stock/profile2`, {
            params: { symbol, token: FINNHUB_KEY },
            timeout: 8000,
          }),
        ]);

        const quote = quoteRes.data;
        const profile = profileRes.data;

        return {
          rank: index + 1,
          symbol,
          name: profile.name || symbol,
          price: quote.c,
          change24h: quote.dp, // daily % change
          change: quote.d, // daily absolute change
          high: quote.h,
          low: quote.l,
          open: quote.o,
          prevClose: quote.pc,
          volume24h: null,
          marketCap: profile.marketCapitalization ? profile.marketCapitalization * 1e6 : null,
          logo: profile.logo || null,
          exchange: profile.exchange || null,
        };
      } catch (err) {
        return { rank: index + 1, symbol, name: symbol, price: 0, change24h: 0, error: err.message };
      }
    });

    const stocks = await Promise.all(stockPromises);
    setCache(cacheKey, stocks);
    res.json(stocks);
  } catch (err) {
    console.error('[Market] Finnhub error:', err.message);
    res.status(502).json({ error: 'Failed to fetch stock market data', details: err.message });
  }
});

/**
 * GET /api/market/chart/:symbol
 * Returns 7-day price history for a symbol (crypto or stock)
 */
router.get('/chart/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const type = req.query.type || 'crypto'; // 'crypto' or 'stock'
  const cacheKey = `chart_${type}_${symbol}`;

  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    let chartData = [];

    if (type === 'crypto') {
      // Use CoinGecko market_chart endpoint
      const coinId = req.query.coinId || symbol.toLowerCase();
      const response = await axios.get(`${COINGECKO_BASE}/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: 7,
          interval: 'hourly',
        },
        timeout: 10000,
      });

      chartData = response.data.prices.map(([timestamp, price]) => ({
        timestamp,
        date: new Date(timestamp).toISOString(),
        price,
      }));
    } else if (type === 'stock' && FINNHUB_KEY) {
      // Use Finnhub candle endpoint
      const to = Math.floor(Date.now() / 1000);
      const from = to - 7 * 24 * 60 * 60;

      const response = await axios.get(`${FINNHUB_BASE}/stock/candle`, {
        params: {
          symbol: symbol.toUpperCase(),
          resolution: 'D',
          from,
          to,
          token: FINNHUB_KEY,
        },
        timeout: 8000,
      });

      const candles = response.data;
      if (candles.s === 'ok') {
        chartData = candles.t.map((timestamp, i) => ({
          timestamp: timestamp * 1000,
          date: new Date(timestamp * 1000).toISOString(),
          price: candles.c[i],
          open: candles.o[i],
          high: candles.h[i],
          low: candles.l[i],
          volume: candles.v[i],
        }));
      }
    } else {
      // Generate mock chart data
      const now = Date.now();
      const basePrice = 100 + Math.random() * 400;
      chartData = Array.from({ length: 168 }, (_, i) => {
        const timestamp = now - (168 - i) * 60 * 60 * 1000;
        const noise = (Math.random() - 0.5) * basePrice * 0.05;
        return {
          timestamp,
          date: new Date(timestamp).toISOString(),
          price: basePrice + noise,
        };
      });
    }

    setCache(cacheKey, chartData);
    res.json(chartData);
  } catch (err) {
    console.error(`[Market] Chart error for ${symbol}:`, err.message);
    res.status(502).json({ error: 'Failed to fetch chart data', details: err.message });
  }
});

module.exports = router;
