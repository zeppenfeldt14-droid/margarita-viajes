const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api';

/**
 * Interceptor/Wrapper base para la función fetch
 * Función automática:
 * 1. Inyecta siempre el header Authorization con el token actual.
 * 2. Intercepta respuestas 401 Unauthorized para limpiar sesión y forzar Login.
 */
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('staff_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Intercepción global de errores 401 (Unauthorized / Token expirado o inválido)
  if (response.status === 401) {
    console.error('Sesión expirada o token inválido (401). Cerrando sesión...');
    localStorage.removeItem('staff_token');
    localStorage.removeItem('logged_user_id');
    localStorage.removeItem('admin_active_tab');
    
    // Forzar la recarga de página para redirigir al Login estricto
    window.location.href = '/'; 
    return Promise.reject(new Error('Unauthorized - Session Expired'));
  }

  return response;
}

export const api = {
  // Config
  getConfig: async () => {
    const response = await fetchWithAuth('/admin/config');
    return response.json();
  },

  saveFullConfig: async (config: any) => {
    return fetchWithAuth('/admin/config', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  },

  // Hotels
  getHotels: async () => {
    const response = await fetchWithAuth('/hotels');
    return response.json();
  },

  saveHotel: async (hotel: any, id?: string | null) => {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/hotels/${id}` : `/hotels`;
    return fetchWithAuth(url, {
      method,
      body: JSON.stringify(hotel)
    });
  },

  deleteHotel: async (id: string) => {
    return fetchWithAuth(`/hotels/${id}`, {
      method: 'DELETE'
    });
  },

  // Transfers
  getTransfers: async () => {
    const response = await fetchWithAuth('/transfers');
    return response.json();
  },

  saveTransfer: async (transfer: any, id?: string | null) => {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/transfers/${id}` : `/transfers`;
    return fetchWithAuth(url, {
      method,
      body: JSON.stringify(transfer)
    });
  },

  deleteTransfer: async (id: string) => {
    return fetchWithAuth(`/transfers/${id}`, {
      method: 'DELETE'
    });
  },

  // Quotes
  getQuotes: async () => {
    const response = await fetchWithAuth('/admin/quotes');
    return response.json();
  },

  getQuotesByHotel: async (hotelId: string) => {
    const response = await fetchWithAuth(`/admin/quotes?hotelId=${hotelId}`);
    return response.json();
  },

  createQuote: async (quoteData: any) => {
    return fetchWithAuth('/admin/quotes', {
      method: 'POST',
      body: JSON.stringify(quoteData)
    });
  },

  updateQuote: async (id: string, data: any) => {
    return fetchWithAuth(`/admin/quotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteQuote: async (id: string) => {
    return fetchWithAuth(`/admin/quotes/${id}`, {
      method: 'DELETE'
    });
  },

  // Reservations
  getReservations: async () => {
    const response = await fetchWithAuth('/admin/reservations');
    return response.json();
  },

  createReservation: async (reservationData: any) => {
    return fetchWithAuth('/admin/reservations', {
      method: 'POST',
      body: JSON.stringify(reservationData)
    });
  },

  updateReservation: async (id: string, data: any) => {
    return fetchWithAuth(`/admin/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Operations
  getOperations: async () => {
    const response = await fetchWithAuth('/admin/operations');
    return response.json();
  },

  createOperation: async (operationData: any) => {
    return fetchWithAuth('/admin/operations', {
      method: 'POST',
      body: JSON.stringify(operationData)
    });
  },

  updateOperation: async (id: string, data: any) => {
    return fetchWithAuth(`/admin/operations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteOperation: async (id: string) => {
    return fetchWithAuth(`/admin/operations/${id}`, {
      method: 'DELETE'
    });
  },
  
  // Soporte para funciones ad-hoc que hayan quedado en otros componentes
  getOperation: async (quoteId: string) => {
    return fetchWithAuth(`/admin/operations/by-quote/${quoteId}`);
  },
  
  saveOperation: async (id: string | null, operationData: any) => {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/admin/operations/${id}` : `/admin/operations`;
    return fetchWithAuth(url, {
      method,
      body: JSON.stringify(operationData)
    });
  },

  // Users
  getUsers: async () => {
    const response = await fetchWithAuth('/admin/users');
    return response.json();
  },

  saveUser: async (user: any, id?: string | null) => {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/admin/users/${id}` : `/admin/users`;
    return fetchWithAuth(url, {
      method,
      body: JSON.stringify(user)
    });
  },

  deleteUser: async (id: string) => {
    return fetchWithAuth(`/admin/users/${id}`, {
      method: 'DELETE'
    });
  },

  trackConnection: async (userId: string, hours: number) => {
    return fetchWithAuth(`/admin/users/${userId}/track-connection`, {
      method: 'PUT',
      body: JSON.stringify({ hours })
    });
  },

  saveConnectionLog: async (userId: string, data: any) => {
    return fetchWithAuth(`/admin/users/${userId}/connection-log`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export default api;
