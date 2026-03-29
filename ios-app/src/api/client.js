import axios from 'axios';

// TODO: Replace with your Mac's local IP address (find it in System Settings → Wi-Fi → Details)
// Example: http://192.168.1.100:3001
const API_BASE_URL = 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

export const getPortfolio = async () => {
  try {
    return await apiClient.get('/api/portfolio');
  } catch (error) {
    throw error;
  }
};

export const getCryptoMarket = async () => {
  try {
    return await apiClient.get('/api/market/crypto');
  } catch (error) {
    throw error;
  }
};

export const getStockMarket = async () => {
  try {
    return await apiClient.get('/api/market/stocks');
  } catch (error) {
    throw error;
  }
};

export const getAssetChart = async (symbol, range = '1W') => {
  try {
    return await apiClient.get(`/api/chart/${symbol}`, { params: { range } });
  } catch (error) {
    throw error;
  }
};

export const placeOrder = async (orderData) => {
  try {
    return await apiClient.post('/api/orders', orderData);
  } catch (error) {
    throw error;
  }
};

export const getOpenOrders = async () => {
  try {
    return await apiClient.get('/api/orders/open');
  } catch (error) {
    throw error;
  }
};

export default apiClient;
