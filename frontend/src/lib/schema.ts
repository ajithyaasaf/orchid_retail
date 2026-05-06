import { Product, WithContext } from 'schema-dts';

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  minPrice: number;
  maxPrice: number;
  minMrp: number;
  totalStock: number;
  averageRating: number;
  reviewCount: number;
  category?: { name: string };
  variants: Array<{
    sku: string;
    price: number;
    stock: number;
    size: string;
    color: string;
  }>;
  reviews?: Array<{
    rating: number;
    comment: string;
    user: { name: string };
    createdAt: string;
  }>;
}

export function generateProductSchema(product: ProductData, url: string): WithContext<Product> {
  const isAvailable = product.totalStock > 0;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map(img => img.startsWith('http') ? img : `${process.env.NEXT_PUBLIC_SITE_URL}${img}`),
    sku: product.variants[0]?.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: 'Orchid',
    },
    category: product.category?.name,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: product.minPrice,
      highPrice: product.maxPrice,
      offerCount: product.variants.length,
      availability: isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: url,
    },
    ...(product.reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.averageRating,
        reviewCount: product.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(product.reviews && product.reviews.length > 0 && {
      review: product.reviews.map(r => ({
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.rating,
        },
        author: {
          '@type': 'Person',
          name: r.user.name,
        },
        reviewBody: r.comment,
        datePublished: r.createdAt,
      })),
    }),
  };
}
