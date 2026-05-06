const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── Shared Types ─────────────────────────────────────────────────────────────
export interface AddressData {
  id: string;
  userId: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;
  let url = `${API_BASE}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') searchParams.append(key, String(value));
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...fetchOptions.headers },
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
  list: (params?: Record<string, string | number | boolean | undefined>) => fetchApi('/products', { params }),
  getBySlug: (slug: string) => fetchApi(`/products/${slug}`),
};

// ─── Category APIs ───────────────────────────────────────────────────────────
export const categoryApi = {
  list: () => fetchApi('/categories'),
  getBySlug: (slug: string) => fetchApi(`/categories/${slug}`),
};

// ─── Cart APIs ───────────────────────────────────────────────────────────────
export const cartApi = {
  validate: (items: { variantId: string; quantity: number }[]) =>
    fetchApi('/cart/validate', { method: 'POST', body: JSON.stringify({ items }) }),
};

// ─── Order APIs ──────────────────────────────────────────────────────────────
export const orderApi = {
  create: (data: {
    userId: string;
    items: { variantId: string; quantity: number }[];
    shippingAddressId: string;
    deliveryOption: 'standard' | 'express';
    couponCode?: string;
  }) => fetchApi('/orders/create', { method: 'POST', body: JSON.stringify(data) }),
  getById: (id: string) => fetchApi(`/orders/${id}`),
  getUserOrders: (userId: string) => fetchApi(`/orders/user/${userId}`),
};

// ─── Address APIs ─────────────────────────────────────────────────────────────
export const addressApi = {
  list: (userId: string) => fetchApi<{ success: boolean; data: AddressData[] }>(`/addresses/${userId}`),
  create: (data: {
    userId: string; name: string; phone: string; addressLine1: string;
    addressLine2?: string; city: string; state: string; pincode: string; isDefault?: boolean;
  }) => fetchApi<{ success: boolean; data: AddressData }>('/addresses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<AddressData> & { userId?: string }) =>
    fetchApi<{ success: boolean; data: AddressData }>(`/addresses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi(`/addresses/${id}`, { method: 'DELETE' }),
};

// ─── Payment APIs (Razorpay) ─────────────────────────────────────────────────
export const paymentApi = {
  createOrder: (orderId: string) =>
    fetchApi<{ success: boolean; data: { razorpayOrderId: string; amount: number; currency: string; keyId: string } }>(
      '/payments/create-order', { method: 'POST', body: JSON.stringify({ orderId }) }
    ),
  verify: (data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string; orderId: string }) =>
    fetchApi('/payments/verify', { method: 'POST', body: JSON.stringify(data) }),
  getStatus: (orderId: string) => fetchApi(`/payments/status/${orderId}`),
  getKey: () => fetchApi<{ success: boolean; data: { keyId: string } }>('/payments/key'),
};

// ─── Coupon APIs ──────────────────────────────────────────────────────────────
export const couponApi = {
  validate: (code: string, userId: string, subtotal: number) =>
    fetchApi<{ success: boolean; data: { code: string; type: string; value: number; discount: number; maxDiscount?: number; minOrder?: number } }>(
      `/coupons/validate?code=${encodeURIComponent(code)}&userId=${encodeURIComponent(userId)}&subtotal=${subtotal}`
    ),
};

// ─── Review APIs ─────────────────────────────────────────────────────────────
export const reviewApi = {
  getByProduct: (productId: string) => fetchApi(`/reviews/${productId}`),
  submit: (data: { productId: string; userId: string; rating: number; comment: string }) =>
    fetchApi('/reviews', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Admin APIs ──────────────────────────────────────────────────────────────
export const adminApi = {
  // Dashboard
  dashboard: () => fetchApi('/admin/dashboard'),

  // Products
  getProducts: (params?: Record<string, string | number | boolean | undefined>) => fetchApi('/admin/products', { params }),
  createProduct: (data: Record<string, unknown>) => fetchApi('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: Record<string, unknown>) => fetchApi(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => fetchApi(`/admin/products/${id}`, { method: 'DELETE' }),

  // Variants
  addVariant: (productId: string, data: Record<string, unknown>) => fetchApi(`/admin/products/${productId}/variants`, { method: 'POST', body: JSON.stringify(data) }),
  updateVariant: (id: string, data: Record<string, unknown>) => fetchApi(`/admin/variants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVariant: (id: string) => fetchApi(`/admin/variants/${id}`, { method: 'DELETE' }),

  // Orders
  getOrders: (params?: Record<string, string | number | boolean | undefined>) => fetchApi('/admin/orders', { params }),
  getOrder: (id: string) => fetchApi(`/admin/orders/${id}`),
  updateOrder: (id: string, data: Record<string, unknown>) => fetchApi(`/admin/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Customers
  getCustomers: (params?: Record<string, string | number | boolean | undefined>) => fetchApi('/admin/customers', { params }),
  getCustomer: (id: string) => fetchApi(`/admin/customers/${id}`),

  // Coupons
  getCoupons: () => fetchApi('/admin/coupons'),
  createCoupon: (data: Record<string, unknown>) => fetchApi('/admin/coupons', { method: 'POST', body: JSON.stringify(data) }),
  updateCoupon: (id: string, data: Record<string, unknown>) => fetchApi(`/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCoupon: (id: string) => fetchApi(`/admin/coupons/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => fetchApi('/admin/categories'),
  createCategory: (data: Record<string, unknown>) => fetchApi('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id: string, data: Record<string, unknown>) => fetchApi(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id: string) => fetchApi(`/admin/categories/${id}`, { method: 'DELETE' }),

  // Collections
  getCollections: () => fetchApi('/admin/collections'),
  createCollection: (data: Record<string, unknown>) => fetchApi('/admin/collections', { method: 'POST', body: JSON.stringify(data) }),
  updateCollection: (id: string, data: Record<string, unknown>) => fetchApi(`/admin/collections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCollection: (id: string) => fetchApi(`/admin/collections/${id}`, { method: 'DELETE' }),
  addProductsToCollection: (id: string, productIds: string[]) => fetchApi(`/admin/collections/${id}/products`, { method: 'POST', body: JSON.stringify({ productIds }) }),
  removeProductFromCollection: (collectionId: string, productId: string) => fetchApi(`/admin/collections/${collectionId}/products/${productId}`, { method: 'DELETE' }),
};

export default fetchApi;
