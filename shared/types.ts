// ============================================================================
// ORCHID RETAIL PLATFORM — SHARED TYPES
// ============================================================================

// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// ─── Address ─────────────────────────────────────────────────────────────────

export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string | null;
  isActive: boolean;
  sortOrder: number;
  children?: Category[];
  createdAt: string;
}

// ─── Product ─────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  category?: Category;
  images: string[];
  tags: string[];
  exportBadge: boolean;       // "Export Quality Certified"
  isFeatured: boolean;
  isActive: boolean;
  variants: Variant[];
  reviews?: Review[];
  averageRating?: number;
  reviewCount?: number;
  // Computed from variants
  minPrice?: number;
  maxPrice?: number;
  minMrp?: number;
  totalStock?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Variant ─────────────────────────────────────────────────────────────────

export interface Variant {
  id: string;
  productId: string;
  sku: string;
  size: string;
  color: string;
  colorHex?: string;
  price: number;              // Selling price
  mrp: number;                // Maximum Retail Price (for strikethrough)
  stock: number;              // Available stock count
  reservedStock: number;      // Units held for pending payments
  isActive: boolean;
  createdAt: string;
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  // Populated from backend
  product?: Product;
  variant?: Variant;
}

export interface CartValidationResult {
  valid: boolean;
  items: {
    variantId: string;
    requestedQty: number;
    availableStock: number;
    isValid: boolean;
    message?: string;
  }[];
}

// ─── Order ───────────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  productImage: string;
  variantSize: string;
  variantColor: string;
  sku: string;
  price: number;
  mrp: number;
  quantity: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;        // ORD-2026-000001
  userId: string;

  items: OrderItem[];

  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;

  couponId?: string;
  couponCode?: string;

  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;

  // PhonePe integration
  merchantTransactionId?: string;
  gatewayTransactionId?: string;

  // Stock tracking
  stockReserved: boolean;
  stockDeducted: boolean;

  // Shipping
  shippingAddress: Address;
  trackingNumber?: string;
  courierName?: string;

  // Status history
  statusHistory: {
    status: string;
    timestamp: string;
    note?: string;
  }[];

  createdAt: string;
  updatedAt: string;
}

// ─── Review ──────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;             // 1-5
  comment: string;
  images?: string[];
  isVerified: boolean;        // Bought the product
  createdAt: string;
}

// ─── Coupon ──────────────────────────────────────────────────────────────────

export type CouponType = 'flat' | 'percentage';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Wishlist ────────────────────────────────────────────────────────────────

export interface WishlistItem {
  productId: string;
  addedAt: string;
}

// ─── API Response Wrappers ───────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Filter & Sort Types ─────────────────────────────────────────────────────

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  colors?: string[];
  tags?: string[];
  inStock?: boolean;
  exportBadge?: boolean;
  isFeatured?: boolean;
}

export type ProductSortBy = 'newest' | 'price_asc' | 'price_desc' | 'popularity' | 'rating';

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  recentOrders: Order[];
  topProducts: {
    productId: string;
    productName: string;
    totalSold: number;
    revenue: number;
  }[];
  lowStockAlerts: {
    variantId: string;
    productName: string;
    sku: string;
    stock: number;
  }[];
}

// ─── PhonePe Payment Types ───────────────────────────────────────────────────

export interface PhonePeInitiateResponse {
  redirectUrl: string;
  merchantTransactionId: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] as const;
export const COLORS = [
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Navy', hex: '#1B2A4A' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Beige', hex: '#D4B896' },
  { name: 'Grey', hex: '#6B7280' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Maroon', hex: '#7F1D1D' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Olive', hex: '#65712B' },
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Coral', hex: '#F97316' },
  { name: 'Lavender', hex: '#A78BFA' },
] as const;

export const CATEGORIES = [
  'women-tops',
  'women-dresses',
  'women-bottoms',
  'men-shirts',
  'men-trousers',
  'kids-wear',
  'accessories',
  'footwear',
] as const;
