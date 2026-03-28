/**
 * Plaid Connector
 * Integrates with bank accounts (BofA) and investment accounts (Public.com) via Plaid API
 */

const { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } = require('plaid');

class PlaidConnector {
  constructor(clientId, secret, env = 'sandbox') {
    this.clientId = clientId;
    this.secret = secret;
    this.env = env;

    // In-memory token storage (production would use a database)
    this._accessTokens = new Map(); // institutionId -> { accessToken, itemId, institutionName }

    const configuration = new Configuration({
      basePath: PlaidEnvironments[env] || PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': clientId,
          'PLAID-SECRET': secret,
        },
      },
    });

    this.client = new PlaidApi(configuration);
    this.name = 'Plaid';
    this.type = 'bank';
  }

  /**
   * Create a Plaid Link token to initiate the OAuth flow
   * @param {string} userId - User identifier
   * @param {string[]} products - Plaid products to request (transactions, investments, etc.)
   * @returns {object} { linkToken, expiration }
   */
  async createLinkToken(userId = 'default-user', products = ['transactions', 'investments']) {
    try {
      const request = {
        user: { client_user_id: userId },
        client_name: 'NetWorth Tracker',
        products: products.map(p => p),
        country_codes: [CountryCode.Us],
        language: 'en',
      };

      const response = await this.client.linkTokenCreate(request);
      return {
        linkToken: response.data.link_token,
        expiration: response.data.expiration,
        requestId: response.data.request_id,
      };
    } catch (err) {
      console.error('[PlaidConnector] createLinkToken error:', err.response?.data || err.message);
      throw new Error(`Failed to create link token: ${err.response?.data?.error_message || err.message}`);
    }
  }

  /**
   * Exchange a public token for an access token after user completes Plaid Link
   * @param {string} publicToken - Public token from Plaid Link callback
   * @param {string} institutionId - Institution identifier
   * @param {string} institutionName - Human-readable institution name
   * @returns {object} { accessToken, itemId }
   */
  async exchangePublicToken(publicToken, institutionId = 'default', institutionName = 'Institution') {
    try {
      const response = await this.client.itemPublicTokenExchange({
        public_token: publicToken,
      });

      const accessToken = response.data.access_token;
      const itemId = response.data.item_id;

      // Store in memory
      this._accessTokens.set(institutionId, {
        accessToken,
        itemId,
        institutionName,
        connectedAt: new Date().toISOString(),
      });

      console.log(`[PlaidConnector] Exchanged token for institution: ${institutionName}`);

      return {
        success: true,
        itemId,
        institutionId,
        institutionName,
      };
    } catch (err) {
      console.error('[PlaidConnector] exchangePublicToken error:', err.response?.data || err.message);
      throw new Error(`Failed to exchange token: ${err.response?.data?.error_message || err.message}`);
    }
  }

  /**
   * Get all connected accounts across all institutions
   * @param {string} [accessToken] - Specific access token, or uses all stored tokens
   * @returns {object[]} Array of { id, name, type, subtype, balance, institution, mask }
   */
  async getAccounts(accessToken = null) {
    try {
      const tokens = accessToken
        ? [{ accessToken, institutionName: 'Unknown', institutionId: 'unknown' }]
        : Array.from(this._accessTokens.values()).map(t => ({
            accessToken: t.accessToken,
            institutionName: t.institutionName,
            institutionId: t.itemId,
          }));

      if (tokens.length === 0) {
        return [];
      }

      const allAccounts = [];

      for (const tokenInfo of tokens) {
        try {
          const response = await this.client.accountsGet({
            access_token: tokenInfo.accessToken,
          });

          const accounts = response.data.accounts.map(acct => ({
            id: acct.account_id,
            name: acct.name,
            officialName: acct.official_name,
            type: acct.type,
            subtype: acct.subtype,
            balance: {
              available: acct.balances.available,
              current: acct.balances.current,
              limit: acct.balances.limit,
              currency: acct.balances.iso_currency_code || 'USD',
            },
            mask: acct.mask,
            institution: tokenInfo.institutionName,
          }));

          allAccounts.push(...accounts);
        } catch (innerErr) {
          console.error(`[PlaidConnector] getAccounts error for ${tokenInfo.institutionName}:`, innerErr.message);
        }
      }

      return allAccounts;
    } catch (err) {
      console.error('[PlaidConnector] getAccounts error:', err.response?.data || err.message);
      throw err;
    }
  }

  /**
   * Get recent transactions for an institution
   * @param {string} accessToken - Plaid access token
   * @param {number} daysBack - Number of days back to fetch
   * @returns {object[]} Array of transactions
   */
  async getTransactions(accessToken, daysBack = 30) {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await this.client.transactionsGet({
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
        options: {
          count: 100,
          offset: 0,
        },
      });

      return response.data.transactions.map(tx => ({
        id: tx.transaction_id,
        accountId: tx.account_id,
        amount: tx.amount,
        currency: tx.iso_currency_code || 'USD',
        date: tx.date,
        name: tx.name,
        merchantName: tx.merchant_name,
        category: tx.category,
        pending: tx.pending,
        paymentChannel: tx.payment_channel,
      }));
    } catch (err) {
      console.error('[PlaidConnector] getTransactions error:', err.response?.data || err.message);
      throw new Error(`Failed to get transactions: ${err.response?.data?.error_message || err.message}`);
    }
  }

  /**
   * Get investment holdings (for Public.com and similar)
   * @param {string} accessToken - Plaid access token
   * @returns {object} { accounts, holdings, securities }
   */
  async getInvestments(accessToken) {
    try {
      const response = await this.client.investmentsHoldingsGet({
        access_token: accessToken,
      });

      const securities = {};
      response.data.securities.forEach(sec => {
        securities[sec.security_id] = sec;
      });

      const holdings = response.data.holdings.map(holding => {
        const security = securities[holding.security_id] || {};
        return {
          id: holding.security_id,
          accountId: holding.account_id,
          symbol: security.ticker_symbol || 'UNKNOWN',
          name: security.name || 'Unknown Security',
          type: security.type || 'equity',
          quantity: holding.quantity,
          institutionPrice: holding.institution_price,
          institutionValue: holding.institution_value,
          costBasis: holding.cost_basis,
          currency: holding.iso_currency_code || 'USD',
          closePrice: security.close_price,
          closePriceAsOf: security.close_price_as_of,
        };
      });

      return {
        accounts: response.data.accounts,
        holdings,
        totalValue: holdings.reduce((sum, h) => sum + (h.institutionValue || 0), 0),
      };
    } catch (err) {
      console.error('[PlaidConnector] getInvestments error:', err.response?.data || err.message);
      throw new Error(`Failed to get investments: ${err.response?.data?.error_message || err.message}`);
    }
  }

  /**
   * Get all stored institution connections
   * @returns {object[]} List of connected institutions
   */
  getConnectedInstitutions() {
    return Array.from(this._accessTokens.entries()).map(([id, info]) => ({
      institutionId: id,
      institutionName: info.institutionName,
      itemId: info.itemId,
      connectedAt: info.connectedAt,
    }));
  }

  /**
   * Store an access token manually (for pre-configured institutions)
   * @param {string} institutionId
   * @param {string} accessToken
   * @param {string} institutionName
   */
  storeAccessToken(institutionId, accessToken, institutionName = '') {
    this._accessTokens.set(institutionId, {
      accessToken,
      itemId: institutionId,
      institutionName,
      connectedAt: new Date().toISOString(),
    });
  }

  /**
   * Remove a stored access token
   * @param {string} institutionId
   */
  removeAccessToken(institutionId) {
    this._accessTokens.delete(institutionId);
  }

  /**
   * Check if any institutions are connected
   * @returns {boolean}
   */
  isConnected() {
    return this._accessTokens.size > 0;
  }
}

module.exports = PlaidConnector;
