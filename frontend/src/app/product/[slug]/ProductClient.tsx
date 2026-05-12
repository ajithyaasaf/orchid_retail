'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, ShoppingBag, Truck, RotateCcw, Shield, Star, ChevronRight, Minus, Plus, Check } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { formatPrice, calculateDiscount, cn } from '@/lib/utils';
import { SHIPPING } from '@orchid/shared';
import ProductCard from '@/components/product/ProductCard';

interface VariantData {
  id: string;
  size: string;
  color: string;
  colorHex?: string;
  price: number;
  mrp: number;
  stock: number;
  reservedStock: number;
  imageIndex: number;
  sku: string;
}

interface ReviewData {
  id: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: string;
  user: { name: string };
}

interface ProductDataFull {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  categoryId: string;
  category?: { name: string; slug: string };
  exportBadge: boolean;
  freeShipping: boolean;
  variants: VariantData[];
  reviews: ReviewData[];
  averageRating: number;
  reviewCount: number;
  minPrice: number;
  maxPrice: number;
  minMrp: number;
  totalStock: number;
  relatedProducts?: Array<{
    id: string; name: string; slug: string; images: string[]; minPrice: number; minMrp: number; totalStock: number; reviewCount: number; exportBadge: boolean;
    variants: { id: string; size: string; color: string; price: number; mrp: number; stock: number }[];
  }>;
}

interface ProductClientProps {
  product: ProductDataFull;
}

export default function ProductClient({ product }: ProductClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial values from URL or first available in-stock variant
  const getInitialValue = (param: string, type: 'size' | 'color') => {
    const fromUrl = searchParams.get(param);
    if (fromUrl) {
      const exists = product.variants.some(v => 
        (type === 'size' ? v.size : v.color).toLowerCase() === fromUrl.toLowerCase()
      );
      if (exists) return fromUrl;
    }
    
    const firstInStock = product.variants.find(v => (v.stock - v.reservedStock) > 0);
    if (type === 'size') return firstInStock?.size || product.variants[0]?.size || '';
    return firstInStock?.color || product.variants[0]?.color || '';
  };

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(getInitialValue('size', 'size'));
  const [selectedColor, setSelectedColor] = useState<string>(getInitialValue('color', 'color'));
  
  // Sync selection to URL (shallow)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('size', selectedSize);
      params.set('color', selectedColor);
      window.history.replaceState(null, '', `?${params.toString()}`);
    }
  }, [selectedSize, selectedColor]);
  
  // Color mapping for swatches
  const colorMap: Record<string, string> = {
    'red': '#EF4444',
    'blue': '#3B82F6',
    'green': '#10B981',
    'yellow': '#F59E0B',
    'black': '#000000',
    'white': '#FFFFFF',
    'pink': '#EC4899',
    'purple': '#8B5CF6',
    'orange': '#F97316',
    'gray': '#6B7280',
    'grey': '#6B7280',
    'navy': '#1E3A8A',
    'maroon': '#800000',
    'peach': '#FFDAB9',
    'lavender': '#E6E6FA',
  };

  const getColorHex = (colorName: string) => {
    const normalized = colorName.toLowerCase().trim();
    
    // Exact match first
    if (colorMap[normalized]) return colorMap[normalized];
    
    // Fuzzy match (e.g. "Sky Blue" -> "blue")
    const words = normalized.split(/\s+/);
    for (const word of words) {
      if (colorMap[word]) return colorMap[word];
    }
    
    return '#cccccc';
  };
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState('description');
  const [pincode, setPincode] = useState('');
  const [pincodeMsg, setPincodeMsg] = useState('');

  const { addItem } = useCartStore();
  const { toggle, isWishlisted } = useWishlistStore();
  const wishlisted = isWishlisted(product.id);

  // Derived state
  const uniqueColors = [...new Map(product.variants.map(v => [v.color.toLowerCase().trim(), v])).values()];
  const uniqueSizes = [...new Set(product.variants.map(v => v.size))];

  // Reset image index when color changes
  useEffect(() => {
    setSelectedImage(0);
  }, [selectedColor]);

  // Filtered images based on color
  const filteredImages = (() => {
    const indices = new Set<number>();
    
    // 1. Find all variants of the selected color and include their imageIndices
    product.variants.forEach(v => {
      if (v.color.toLowerCase().trim() === selectedColor.toLowerCase().trim()) {
        if (v.imageIndex !== undefined) indices.add(v.imageIndex);
      }
    });

    // 2. Also fuzzy match images by filename (best practice fallback)
    product.images.forEach((img, idx) => {
      if (img.toLowerCase().includes(selectedColor.toLowerCase().trim())) {
        indices.add(idx);
      }
    });

    // 3. If NO specific images were found for this color, fall back to the primary hero image
    if (indices.size === 0) {
      indices.add(0);
    }

    // Sort to keep original order but filter the actual list
    return Array.from(indices).sort((a, b) => a - b).map(idx => product.images[idx]).filter(Boolean);
  })();

  const currentMainImage = filteredImages[selectedImage] || filteredImages[0] || product.images[0];

  const selectedVariant = product.variants.find(v => 
    v.size === selectedSize && 
    v.color.toLowerCase().trim() === selectedColor.toLowerCase().trim()
  );
  const displayPrice = selectedVariant?.price || product.minPrice;
  const displayMrp = selectedVariant?.mrp || product.minMrp;
  const discount = calculateDiscount(displayMrp, displayPrice);
  const availableStock = selectedVariant ? (selectedVariant.stock - selectedVariant.reservedStock) : 0;
  const isOutOfStock = !selectedVariant || availableStock <= 0;

  const isVariantAvailable = (size: string, color: string) => {
    const v = product.variants.find(v => 
      v.size === size && 
      v.color.toLowerCase().trim() === color.toLowerCase().trim()
    );
    return v ? v.stock - v.reservedStock > 0 : false;
  };

  // Check if a size is available in ANY color
  const isSizeAvailableAtAll = (size: string) => {
    return product.variants.some(v => v.size === size && (v.stock - v.reservedStock) > 0);
  };

  const handleAddToCart = () => {
    if (!selectedVariant || isOutOfStock) return;
    
    // Best Practice: Use the variant-specific image for the cart display
    const cartImage = (selectedVariant.imageIndex !== undefined && product.images[selectedVariant.imageIndex])
      ? product.images[selectedVariant.imageIndex]
      : product.images[0] || '';

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      quantity,
      productName: product.name,
      productImage: cartImage,
      productSlug: product.slug,
      variantSize: selectedVariant.size,
      variantColor: selectedVariant.color,
      price: selectedVariant.price,
      mrp: selectedVariant.mrp,
      freeShipping: product.freeShipping,
    });
  };

  const checkPincode = () => {
    if (pincode.length === 6) {
      setPincodeMsg('✅ Delivery available in 3–5 business days');
    } else {
      setPincodeMsg('Please enter a valid 6-digit pincode');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-surface py-3">
        <div className="container">
          <nav className="flex items-center gap-1.5 text-xs text-muted">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight size={12} />
            {product.category && (
              <>
                <Link href={`/category/${product.category.slug}`} className="hover:text-primary transition-colors">
                  {product.category.name}
                </Link>
                <ChevronRight size={12} />
              </>
            )}
            <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container py-6 md:py-10">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/5] bg-muted rounded-2xl overflow-hidden group">
              <img
                src={currentMainImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {discount}% OFF
                </div>
              )}
            </div>

            {/* Thumbnails */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {filteredImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={cn(
                    'relative w-20 aspect-[4/5] rounded-lg overflow-hidden border-2 transition-all flex-shrink-0',
                    selectedImage === idx ? 'border-primary' : 'border-transparent'
                  )}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-5">
            {/* Badges */}
            <div className="flex items-center gap-2">
              {product.exportBadge && (
                <span className="px-2.5 py-1 bg-hero-bg text-white text-[10px] font-semibold rounded-md uppercase tracking-wider">
                  Export Quality
                </span>
              )}
              {discount > 0 && (
                <span className="px-2.5 py-1 bg-primary text-white text-[10px] font-bold rounded-md">
                  {discount}% OFF
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-success/10 rounded text-success">
                  <Star size={14} fill="currentColor" />
                  <span className="text-sm font-bold">{product.averageRating.toFixed(1)}</span>
                </div>
                <span className="text-sm text-muted">({product.reviewCount} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-foreground">{formatPrice(displayPrice)}</span>
              {discount > 0 && (
                <>
                  <span className="text-lg text-muted line-through">{formatPrice(displayMrp)}</span>
                  <span className="text-sm font-semibold text-primary">You save {formatPrice(displayMrp - displayPrice)}</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted">Inclusive of all taxes</p>

            {/* Color Selector */}
            {uniqueColors.length > 1 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2.5">
                  Color: <span className="font-normal text-muted">{selectedColor}</span>
                </h3>
                <div className="flex gap-2">
                  {uniqueColors.map(v => {
                    const availableInSelectedSize = product.variants.some(
                      pv => pv.color.toLowerCase().trim() === v.color.toLowerCase().trim() && 
                      pv.size === selectedSize && 
                      (pv.stock - pv.reservedStock) > 0
                    );

                    const handleColorClick = () => {
                      setSelectedColor(v.color);
                      
                      // Auto-switch size if current size isn't available in new color
                      if (!availableInSelectedSize) {
                        const firstAvailableSize = product.variants.find(
                          pv => pv.color.toLowerCase().trim() === v.color.toLowerCase().trim() && 
                          (pv.stock - pv.reservedStock) > 0
                        )?.size;
                        if (firstAvailableSize) setSelectedSize(firstAvailableSize);
                      }

                      // Explicit Image Mapping: Jump to the image index defined in the admin
                      if (v.imageIndex !== undefined && product.images[v.imageIndex]) {
                        setSelectedImage(v.imageIndex);
                      } else {
                        // Fallback to Smart Image Matching if index is default/0
                        const colorName = v.color.toLowerCase().trim();
                        const matchingImageIndex = product.images.findIndex(img => 
                          img.toLowerCase().includes(colorName)
                        );
                        if (matchingImageIndex !== -1) {
                          setSelectedImage(matchingImageIndex);
                        }
                      }
                    };

                    return (
                      <button
                        key={v.color}
                        onClick={handleColorClick}
                        className={cn(
                          'w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all',
                          selectedColor.toLowerCase().trim() === v.color.toLowerCase().trim() 
                            ? 'border-primary ring-2 ring-primary/20' 
                            : 'border-border',
                          !availableInSelectedSize && 'opacity-30'
                        )}
                        title={v.color}
                      >
                        <div
                          className="w-6 h-6 rounded-full border border-black/5"
                          style={{ backgroundColor: (v.colorHex && v.colorHex !== '#000000') ? v.colorHex : getColorHex(v.color) }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2.5">
                Size: <span className="font-normal text-muted">{selectedSize}</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {uniqueSizes.map(size => {
                  const availableInSelectedColor = isVariantAvailable(size, selectedColor);
                  const availableAtAll = isSizeAvailableAtAll(size);
                  
                  const handleSizeClick = () => {
                    setSelectedSize(size);
                    // Auto-switch color if current color isn't available in new size
                    if (!availableInSelectedColor) {
                      const firstAvailableColor = product.variants.find(
                        pv => pv.size === size && (pv.stock - pv.reservedStock) > 0
                      )?.color;
                      if (firstAvailableColor) setSelectedColor(firstAvailableColor);
                    }
                  };

                  return (
                    <button
                      key={size}
                      onClick={handleSizeClick}
                      disabled={!availableAtAll}
                      className={cn(
                        'min-w-[48px] px-3 py-2.5 rounded-lg border text-sm font-medium transition-all',
                        selectedSize === size
                          ? 'bg-primary text-white border-primary'
                          : availableInSelectedColor
                            ? 'border-border text-foreground hover:border-primary hover:text-primary'
                            : availableAtAll
                              ? 'border-border text-foreground/60 border-dashed hover:border-primary hover:text-primary'
                              : 'border-border text-muted line-through opacity-40 cursor-not-allowed'
                      )}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              <div className="h-[24px] mt-2">
                {selectedVariant && availableStock > 0 && availableStock <= 5 && (
                  <p className="text-xs text-warning font-medium">
                    ⚠️ Only {availableStock} left in stock!
                  </p>
                )}
                {isOutOfStock && (
                  <p className="text-xs text-error font-medium">This variant is currently out of stock</p>
                )}
              </div>
            </div>

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5 hover:bg-surface transition-colors">
                  <Minus size={16} />
                </button>
                <span className="w-12 text-sm font-semibold flex items-center justify-center">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(availableStock, quantity + 1))} className="p-2.5 hover:bg-surface transition-colors">
                  <Plus size={16} />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={cn(
                  'flex-1 py-3.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-colors',
                  isOutOfStock
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary-dark'
                )}
              >
                <ShoppingBag size={18} />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>

              <button
                onClick={() => toggle(product.id)}
                className={cn(
                  'w-12 h-12 shrink-0 rounded-full border flex items-center justify-center transition-all',
                  wishlisted ? 'bg-primary border-primary text-white' : 'border-border text-foreground hover:text-primary hover:border-primary'
                )}
              >
                <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Delivery check */}
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-foreground mb-2">Check Delivery</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter pincode"
                  value={pincode}
                  onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '')); setPincodeMsg(''); }}
                  className="px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary w-40"
                />
                <button onClick={checkPincode} className="px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 rounded-lg transition-colors">
                  Check
                </button>
              </div>
              <div className="h-[20px] mt-1.5">
                {pincodeMsg && <p className="text-xs text-muted">{pincodeMsg}</p>}
              </div>
            </div>

            {/* USPs */}
            <div className="grid grid-cols-3 gap-3 pt-3">
              <div className="flex flex-col items-center text-center p-3 bg-surface rounded-lg">
                <Truck size={18} className="text-primary mb-1.5" />
                <span className="text-[10px] font-medium text-foreground">Free Delivery</span>
                <span className="text-[10px] text-muted">Above ₹{SHIPPING.FREE_THRESHOLD}</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-surface rounded-lg">
                <RotateCcw size={18} className="text-primary mb-1.5" />
                <span className="text-[10px] font-medium text-foreground">Easy Returns</span>
                <span className="text-[10px] text-muted">7 days</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 bg-surface rounded-lg">
                <Shield size={18} className="text-primary mb-1.5" />
                <span className="text-[10px] font-medium text-foreground">Secure Pay</span>
                <span className="text-[10px] text-muted">100% safe</span>
              </div>
            </div>

            {/* Accordions */}
            <div className="border-t border-border pt-4 space-y-0">
              {[
                { key: 'description', title: 'Description', content: product.description },
                { key: 'sizing', title: 'Size Guide', content: 'Please refer to the size chart. Sizes are in standard international measurements. For the best fit, we recommend measuring yourself and comparing with the chart.' },
                { key: 'returns', title: 'Return Policy', content: 'We offer 7-day hassle-free returns. Products must be unused with original tags. Refunds are processed within 5-7 business days after pickup.' },
                { key: 'shipping', title: 'Shipping Info', content: `Standard delivery: 3-5 business days. Express delivery: 1-2 business days. Free shipping on orders above ₹${SHIPPING.FREE_THRESHOLD}. COD available.` },
              ].map(acc => (
                <div key={acc.key} className="border-b border-border">
                  <button
                    onClick={() => setOpenAccordion(openAccordion === acc.key ? '' : acc.key)}
                    className="w-full flex items-center justify-between py-4 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                  >
                    {acc.title}
                    <ChevronRight
                      size={16}
                      className={cn('transition-transform', openAccordion === acc.key && 'rotate-90')}
                    />
                  </button>
                  <div
                    className={cn(
                      'overflow-hidden transition-all duration-300 ease-in-out',
                      openAccordion === acc.key ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    )}
                  >
                    <div className="pb-4 text-sm text-muted leading-relaxed">
                      {acc.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews section */}
        {product.reviews && product.reviews.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-6" style={{ fontFamily: 'var(--font-playfair)' }}>
              Customer Reviews
            </h2>
            <div className="space-y-4 max-w-2xl">
              {product.reviews.map(review => (
                <div key={review.id} className="p-4 bg-surface rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-success/10 rounded text-success">
                      <Star size={12} fill="currentColor" />
                      <span className="text-xs font-bold">{review.rating}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{review.user.name}</span>
                    {review.isVerified && (
                      <span className="flex items-center gap-0.5 text-[10px] text-success font-medium">
                        <Check size={10} /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted">{review.comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related products */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-foreground mb-6" style={{ fontFamily: 'var(--font-playfair)' }}>
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {product.relatedProducts.map(rp => (
                <ProductCard key={rp.id} {...rp} averageRating={0} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
