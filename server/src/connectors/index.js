/**
 * Connector Registry - Plugin architecture for financial platform integrations
 * Supports dynamic registration and retrieval of connector instances
 */

class ConnectorRegistry {
  constructor() {
    this._connectors = new Map();
    this._metadata = new Map();
  }

  /**
   * Register a connector with the registry
   * @param {string} id - Unique identifier for the connector
   * @param {object} connector - Connector instance with standardized methods
   * @param {object} meta - Metadata about the connector (name, type, icon, etc.)
   */
  register(id, connector, meta = {}) {
    this._connectors.set(id, connector);
    this._metadata.set(id, {
      id,
      name: meta.name || id,
      type: meta.type || 'unknown',
      icon: meta.icon || null,
      description: meta.description || '',
      connected: true,
      connectedAt: new Date().toISOString(),
      ...meta,
    });
    console.log(`[ConnectorRegistry] Registered connector: ${id}`);
  }

  /**
   * Get a connector instance by ID
   * @param {string} id - Connector ID
   * @returns {object|null} Connector instance or null
   */
  get(id) {
    return this._connectors.get(id) || null;
  }

  /**
   * Get metadata for a connector
   * @param {string} id - Connector ID
   * @returns {object|null} Metadata or null
   */
  getMeta(id) {
    return this._metadata.get(id) || null;
  }

  /**
   * List all registered connector IDs
   * @returns {string[]} Array of connector IDs
   */
  list() {
    return Array.from(this._connectors.keys());
  }

  /**
   * Get all connectors as array with metadata
   * @returns {object[]} Array of { id, meta, connector }
   */
  getAll() {
    const result = [];
    for (const [id, connector] of this._connectors.entries()) {
      result.push({
        id,
        meta: this._metadata.get(id) || { id },
        connector,
      });
    }
    return result;
  }

  /**
   * Check if a connector is registered
   * @param {string} id - Connector ID
   * @returns {boolean}
   */
  has(id) {
    return this._connectors.has(id);
  }

  /**
   * Remove a connector from the registry
   * @param {string} id - Connector ID
   * @returns {boolean} True if removed
   */
  unregister(id) {
    const existed = this._connectors.has(id);
    this._connectors.delete(id);
    this._metadata.delete(id);
    if (existed) {
      console.log(`[ConnectorRegistry] Unregistered connector: ${id}`);
    }
    return existed;
  }

  /**
   * Update metadata for an existing connector
   * @param {string} id - Connector ID
   * @param {object} updates - Partial metadata updates
   */
  updateMeta(id, updates) {
    if (this._metadata.has(id)) {
      const current = this._metadata.get(id);
      this._metadata.set(id, { ...current, ...updates });
    }
  }

  /**
   * Get count of registered connectors
   * @returns {number}
   */
  count() {
    return this._connectors.size;
  }
}

// Export as singleton
const registry = new ConnectorRegistry();
module.exports = registry;
