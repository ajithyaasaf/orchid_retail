'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const BANNERS = [
  {
    id: 1,
    image: '/images/2.png',
    href: '/category/new-born',
    // Text removed as requested
  },
  {
    id: 2,
    title: 'New Arrivals',
    subtitle: 'Premium Factory Stock',
    description: 'Discover the latest additions to our collection — just landed from export houses.',
    cta: 'Explore',
    href: '/category/women-dresses',
    gradient: 'from-[#111111] to-[#333333]',
  },
  {
    id: 3,
    title: 'Flat 50% OFF',
    subtitle: 'Men\'s Collection',
    description: 'Premium shirts, trousers & more at prices that will surprise you.',
    cta: 'Shop Men',
    href: '/category/men-shirts',
    gradient: 'from-[#1B2A4A] to-[#0D1B2A]',
  },
];

export default function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % BANNERS.length);
  }, []);

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + BANNERS.length) % BANNERS.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative w-full aspect-[16/9] md:aspect-[21/9] lg:aspect-[21/7]">
        {/* Slides */}
        {BANNERS.map((banner, index) => (
          <div
            key={banner.id}
            className={cn(
              'absolute inset-0 transition-all duration-700 ease-in-out',
              !banner.image && 'bg-gradient-to-br',
              !banner.image && banner.gradient,
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            )}
          >
            {/* Background Image */}
            {banner.image && (
              <div className="absolute inset-0">
                <img
                  src={banner.image}
                  alt={banner.title || 'Banner'}
                  className="w-full h-full object-cover"
                />
                {/* Subtle overlay for images with text */}
                {banner.title && <div className="absolute inset-0 bg-black/20" />}
              </div>
            )}

            {/* Content overlay */}
            {(banner.title || banner.subtitle) && (
              <div className="container relative h-full flex items-center z-10">
                <div className="max-w-xl text-white space-y-4 md:space-y-6">
                  {banner.subtitle && (
                    <span className="inline-block text-xs md:text-sm font-semibold tracking-[0.3em] uppercase text-white/80 animate-fade-in">
                      {banner.subtitle}
                    </span>
                  )}
                  {banner.title && (
                    <h1
                      className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      {banner.title}
                    </h1>
                  )}
                  {banner.description && (
                    <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-md">
                      {banner.description}
                    </p>
                  )}
                  {banner.cta && (
                    <Link
                      href={banner.href}
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-primary font-semibold rounded-full text-sm hover:bg-primary hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      {banner.cta}
                      <ChevronRight size={16} />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Decorative circles (only for gradient backgrounds) */}
            {!banner.image && (
              <>
                <div className="absolute -right-20 -bottom-20 w-[500px] h-[500px] rounded-full bg-white/5" />
                <div className="absolute right-20 top-10 w-[200px] h-[200px] rounded-full bg-white/5" />
              </>
            )}
            
            {/* Link the whole slide if it's just an image */}
            {banner.image && !banner.title && (
              <Link href={banner.href} className="absolute inset-0 z-20" aria-label="Slide link" />
            )}
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
        {BANNERS.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
