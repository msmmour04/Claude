import React, { useState, useEffect } from 'react';
import MarketTable from '../components/MarketTable.jsx';
import PriceChart from '../components/PriceChart.jsx';
import { getCryptoMarket, getStockMarket } from '../api/client.js';

export default function Markets() {
  const [tab, setTab] = useState('crypto');
  const [cryptoData, setCryptoData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [loadingCrypto, setLoadingCrypto] = useState(false);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [errorCrypto, setErrorCrypto] = useState(null);
  const [errorStocks, setErrorStocks] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);

  useEffect(() => {
    // Load crypto on mount
    setLoadingCrypto(true);
    getCryptoMarket()
      .then(data => {
        setCryptoData(data);
        // Pre-select first item
        if (data.length > 0 && !selectedAsset) {
          setSelectedAsset(data[0]);
        }
      })
      .catch(err => setErrorCrypto(err.message))
      .finally(() => setLoadingCrypto(false));
  }, []);

  useEffect(() => {
    if (tab === 'stocks' && stockData.length === 0) {
      setLoadingStocks(true);
      getStockMarket()
        .then(data => {
          setStockData(data);
        })
        .catch(err => setErrorStocks(err.message))
        .finally(() => setLoadingStocks(false));
    }
  }, [tab]);

  const currentData = tab === 'crypto' ? cryptoData : stockData;
  const currentLoading = tab === 'crypto' ? loadingCrypto : loadingStocks;
  const currentError = tab === 'crypto' ? errorCrypto : errorStocks;

  function handleSelectAsset(asset) {
    setSelectedAsset(asset);
  }

  return (
    <div className="page fade-in">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Markets</h1>
        <p className="page-subtitle">
          Live market data for cryptocurrencies and stocks
        </p>
      </div>

      {/* Tab switcher */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '1.25rem',
          background: '#111827',
          border: '1px solid #1f2937',
          borderRadius: '10px',
          padding: '4px',
          width: 'fit-content',
        }}
      >
        {[
          { key: 'crypto', label: '₿ Crypto', count: cryptoData.length },
          { key: 'stocks', label: '📈 Stocks', count: stockData.length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              setSelectedAsset(null);
            }}
            style={{
              padding: '8px 20px',
              borderRadius: '7px',
              border: 'none',
              background: tab === key ? '#1f2937' : 'transparent',
              color: tab === key ? '#f9fafb' : '#9ca3af',
              fontWeight: tab === key ? '600' : '400',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {label}
            {count > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  background: tab === key ? '#3b82f6' : '#2d3748',
                  color: 'white',
                  padding: '1px 6px',
                  borderRadius: '10px',
                }}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {currentError && (
        <div className="error-container" style={{ marginBottom: '1rem' }}>
          <span>⚠</span>
          <span>Failed to load market data: {currentError}</span>
        </div>
      )}

      {/* Selected asset price chart */}
      {selectedAsset && (
        <div style={{ marginBottom: '1.25rem' }}>
          <PriceChart asset={selectedAsset} type={tab} />
        </div>
      )}

      {/* Market table */}
      <MarketTable
        data={currentData}
        loading={currentLoading}
        type={tab}
        onSelectAsset={handleSelectAsset}
        selectedAsset={selectedAsset}
      />

      {/* Footer note */}
      {!currentLoading && currentData.length > 0 && (
        <p
          style={{
            color: '#4b5563',
            fontSize: '11px',
            textAlign: 'center',
            marginTop: '1rem',
          }}
        >
          {tab === 'crypto'
            ? 'Data from CoinGecko · Refreshes every 60 seconds'
            : 'Data from Finnhub · Market prices delayed'}
          {tab === 'stocks' && !stockData[0]?.note && ' · Click row for price chart'}
        </p>
      )}
    </div>
  );
}
