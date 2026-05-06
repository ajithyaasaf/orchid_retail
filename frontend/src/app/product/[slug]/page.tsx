import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { productApi } from '@/lib/api';
import ProductClient from './ProductClient';
import ProductSchema from '@/components/seo/ProductSchema';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  try {
    const res: any = await productApi.getBySlug(slug);
    return res.data;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) return { title: 'Product Not Found' };

  return {
    title: product.name,
    description: product.description.substring(0, 160),
    openGraph: {
      title: product.name,
      description: product.description.substring(0, 160),
      images: product.images.map((img: string) => ({ url: img })),
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description.substring(0, 160),
      images: [product.images[0]],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://orchidhub.in';
  const url = `${siteUrl}/product/${slug}`;

  return (
    <>
      <ProductSchema product={product} url={url} />
      <ProductClient product={product} />
    </>
  );
}
