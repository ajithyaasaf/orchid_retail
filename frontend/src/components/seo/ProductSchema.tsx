import { generateProductSchema } from '@/lib/schema';
import { WithContext, Product } from 'schema-dts';

interface ProductSchemaProps {
  product: any;
  url: string;
}

export default function ProductSchema({ product, url }: ProductSchemaProps) {
  const schema = generateProductSchema(product, url);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
