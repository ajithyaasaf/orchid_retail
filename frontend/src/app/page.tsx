import HeroBanner from '@/components/home/HeroBanner';
import CategoryStrip from '@/components/home/CategoryStrip';
import ProductSection from '@/components/home/ProductSection';
import BrandStory from '@/components/home/BrandStory';
import TrustBadges from '@/components/home/TrustBadges';
import Newsletter from '@/components/home/Newsletter';

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <CategoryStrip />
      <ProductSection
        title="New Arrivals"
        subtitle="Fresh surplus stock — just landed"
        limit={8}
      />
      <TrustBadges />
      <ProductSection
        title="Best Sellers"
        subtitle="Our most loved picks"
        featured
        limit={8}
      />
      <BrandStory />
      <Newsletter />
    </>
  );
}
