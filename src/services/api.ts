const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('staff_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
};

export const api = {
  // Config
  getConfig: async () => {
    const res = await fetchWithAuth('/public/config');
    return res.json();
  },
  saveFullConfig: async (config: any) => {
    return fetchWithAuth('/admin/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  // Hotels
  getHotels: async () => {
    const res = await fetchWithAuth('/public/hotels');
    return res.json();
  },
  saveHotel: async (data: any, id: string | null) => {
    const url = id ? `/admin/hotels/${id}` : '/admin/hotels';
    return fetchWithAuth(url, {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data),
    });
  },
  deleteHotel: async (id: string) => {
    return fetchWithAuth(`/admin/hotels/${id}`, { method: 'DELETE' });
  },

  // Transfers
  getTransfers: async () => {
    const res = await fetchWithAuth('/public/transfers');
    return res.json();
  },
  saveTransfer: async (data: any, id: string | null) => {
    const url = id ? `/admin/transfers/${id}` : '/admin/transfers';
    return fetchWithAuth(url, {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data),
    });
  },
  deleteTransfer: async (id: string) => {
    return fetchWithAuth(`/admin/transfers/${id}`, { method: 'DELETE' });
  },

  // Quotes
  getQuotes: async () => {
    const res = await fetchWithAuth('/admin/quotes');
    return res.json();
  },
  createQuote: async (data: any) => {
    return fetchWithAuth('/quotes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateQuote: async (id: string, data: any) => {
    return fetchWithAuth(`/admin/quotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  getNextFolio: async () => {
    const res = await fetchWithAuth('/public/quotes/next-folio');
    return res.json();
  },

  // Reservations
  getReservations: async () => {
    const res = await fetchWithAuth('/admin/reservations');
    return res.json();
  },
  createReservation: async (data: any) => {
    return fetchWithAuth('/admin/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateReservation: async (id: string, data: any) => {
    return fetchWithAuth(`/admin/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Operations
  getOperations: async () => {
    const res = await fetchWithAuth('/admin/operations');
    return res.json();
  },
  getOperation: async (quoteId: string) => {
    return fetchWithAuth(`/admin/operations/${quoteId}`);
  },
  saveOperation: async (id: string | null, data: any) => {
    const url = id ? `/admin/operations/${id}` : '/admin/operations';
    return fetchWithAuth(url, {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data),
    });
  },
  createOperation: async (data: any) => {
    return fetchWithAuth('/admin/operations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Coupons
  getCoupons: async () => {
    const res = await fetchWithAuth('/public/coupons');
    return res.json();
  },
  getAdminCoupons: async () => {
    const res = await fetchWithAuth('/admin/coupons');
    return res.json();
  },
  saveCoupon: async (data: any, id: string | number | null) => {
    const url = id ? `/admin/coupons/${id}` : '/admin/coupons';
    return fetchWithAuth(url, {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data),
    });
  },
  deleteCoupon: async (id: string | number) => {
    return fetchWithAuth(`/admin/coupons/${id}`, {
      method: 'DELETE',
    });
  },

  // Users
  getUsers: async () => {
    const res = await fetchWithAuth('/admin/users');
    return res.json();
  },
  saveUser: async (data: any, id: string | null) => {
    const url = id ? `/admin/users/${id}` : '/admin/users';
    return fetchWithAuth(url, {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(data),
    });
  },
  deleteUser: async (id: string) => {
    return fetchWithAuth(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Auth
  login: async (credentials: any) => {
    return fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Logs
  getLogs: async () => {
    const res = await fetchWithAuth('/admin/logs');
    return res.json();
  },
  createLog: async (logData: any) => {
    return fetchWithAuth('/admin/logs', {
      method: 'POST',
      body: JSON.stringify(logData),
    });
  },
  dispatchCommunication: async (data: {
    type: 'email' | 'whatsapp';
    target: 'client' | 'provider';
    recipient: string;
    subject?: string;
    message?: string;
    documentId: string;
    documentType: 'quote' | 'reservation' | 'voucher';
  }) => {
    return fetchWithAuth('/communications/dispatch', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getBaseUrl: () => API_URL
};

export default api;
