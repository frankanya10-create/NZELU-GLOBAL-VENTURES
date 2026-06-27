import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ngv_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (error.response?.data?.timeout) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ngv_token');
          localStorage.removeItem('ngv_user');
          window.location.href = '/login?timeout=1';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  checkActivity: () => api.post('/auth/check-inactivity'),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const usersAPI = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const productsAPI = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  updatePrices: (id, data) => api.put(`/products/prices/${id}`, data),
};

export const rollsAPI = {
  list: (params) => api.get('/rolls', { params }),
  get: (id) => api.get(`/rolls/${id}`),
  create: (data) => api.post('/rolls', data),
  update: (id, data) => api.put(`/rolls/${id}`, data),
  getActiveByProduct: (productId) => api.get(`/rolls/product/${productId}/active`),
};

export const invoicesAPI = {
  list: (params) => api.get('/invoices', { params }),
  get: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  commit: (id, data) => api.post(`/invoices/${id}/commit`, data),
  convert: (id) => api.post(`/invoices/${id}/convert`),
  approveDiscount: (id, data) => api.post(`/invoices/${id}/approve-discount`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  nextCode: (type) => api.get('/invoices/next-code', { params: { type } }),
};

export const customersAPI = {
  list: (params) => api.get('/customers', { params }),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  search: (query) => api.post('/customers/search', { query }),
};

export const dashboardAPI = {
  summary: () => api.get('/dashboard/summary'),
};

export const reportsAPI = {
  dailySales: (params) => api.get('/reports/daily-sales', { params }),
  monthlySales: (params) => api.get('/reports/monthly-sales', { params }),
  pnl: (params) => api.get('/reports/pnl', { params }),
  stockValuation: () => api.get('/reports/stock-valuation'),
  ageing: () => api.get('/reports/ageing'),
  cuttingHistory: (params) => api.get('/reports/cutting-history', { params }),
};

export const transfersAPI = {
  list: (params) => api.get('/transfers', { params }),
  create: (data) => api.post('/transfers', data),
  approve: (id) => api.put(`/transfers/${id}/approve`),
  updateStatus: (id, data) => api.put(`/transfers/${id}/status`, data),
};

export const expensesAPI = {
  list: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
};

export const installationsAPI = {
  list: (params) => api.get('/installations', { params }),
  create: (data) => api.post('/installations', data),
  update: (id, data) => api.put(`/installations/${id}`, data),
};

export const deliveriesAPI = {
  list: (params) => api.get('/deliveries', { params }),
  create: (data) => api.post('/deliveries', data),
  update: (id, data) => api.put(`/deliveries/${id}`, data),
};

export const auditLogsAPI = {
  list: (params) => api.get('/audit-logs', { params }),
  events: () => api.get('/audit-logs/events'),
  summary: () => api.get('/audit-logs/summary'),
};

export const branchesAPI = {
  list: () => api.get('/branches'),
  create: (data) => api.post('/branches', data),
  update: (id, data) => api.put(`/branches/${id}`, data),
};

export default api;
