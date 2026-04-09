const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ─── Product APIs ────────────────────────────────────────────────────────────

export const productApi = {
  list: (params?: Record<string, string | number | boolean | undefined>) =>
    fetchApi('/products', { params }),

  getBySlug: (slug: string) =>
    fetchApi(`/products/${slug}`),
};

// ─── Category APIs ───────────────────────────────────────────────────────────

export const categoryApi = {
  list: () => fetchApi('/categories'),
  getBySlug: (slug: string) => fetchApi(`/categories/${slug}`),
};

// ─── Cart APIs ───────────────────────────────────────────────────────────────

export const cartApi = {
  validate: (items: { variantId: string; quantity: number }[]) =>
    fetchApi('/cart/validate', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
};

// ─── Order APIs ──────────────────────────────────────────────────────────────

export const orderApi = {
  create: (data: {
    userId?: string;
    items: { variantId: string; quantity: number }[];
    shippingAddressId: string;
    couponCode?: string;
  }) =>
    fetchApi('/orders/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getById: (id: string) => fetchApi(`/orders/${id}`),

  getUserOrders: (userId: string) => fetchApi(`/orders/user/${userId}`),
};

// ─── Payment APIs ────────────────────────────────────────────────────────────

export const paymentApi = {
  initiate: (orderId: string) =>
    fetchApi('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    }),

  checkStatus: (merchantTransactionId: string) =>
    fetchApi(`/payments/status/${merchantTransactionId}`),
};

// ─── Review APIs ─────────────────────────────────────────────────────────────

export const reviewApi = {
  getByProduct: (productId: string) => fetchApi(`/reviews/${productId}`),

  submit: (data: { productId: string; userId: string; rating: number; comment: string }) =>
    fetchApi('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ─── Admin APIs ──────────────────────────────────────────────────────────────

export const adminApi = {
  dashboard: () => fetchApi('/admin/dashboard'),

  createProduct: (data: Record<string, unknown>) =>
    fetchApi('/admin/products', { method: 'POST', body: JSON.stringify(data) }),

  updateProduct: (id: string, data: Record<string, unknown>) =>
    fetchApi(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  updateVariant: (id: string, data: Record<string, unknown>) =>
    fetchApi(`/admin/variants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getOrders: (params?: Record<string, string | number | boolean | undefined>) =>
    fetchApi('/admin/orders', { params }),

  updateOrder: (id: string, data: Record<string, unknown>) =>
    fetchApi(`/admin/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getCoupons: () => fetchApi('/admin/coupons'),

  createCoupon: (data: Record<string, unknown>) =>
    fetchApi('/admin/coupons', { method: 'POST', body: JSON.stringify(data) }),

  createCategory: (data: Record<string, unknown>) =>
    fetchApi('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),

  updateCategory: (id: string, data: Record<string, unknown>) =>
    fetchApi(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export default fetchApi;
