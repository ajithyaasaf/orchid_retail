'use client';

import Link from 'next/link';

const CATEGORIES = [
  { name: "Women's Tops", slug: 'women-tops', emoji: '👚' },
  { name: "Dresses", slug: 'women-dresses', emoji: '👗' },
  { name: "Bottoms", slug: 'women-bottoms', emoji: '👖' },
  { name: "Men's Shirts", slug: 'men-shirts', emoji: '👔' },
  { name: "Trousers", slug: 'men-trousers', emoji: '🩳' },
  { name: "Kids", slug: 'kids-wear', emoji: '🧒' },
  { name: "Accessories", slug: 'accessories', emoji: '👜' },
  { name: "Footwear", slug: 'footwear', emoji: '👟' },
];

export default function CategoryStrip() {
  return (
    <section className="py-10 md:py-14">
      <div className="container">
        <h2
          className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Shop by Category
        </h2>

        <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap md:justify-center">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="flex flex-col items-center gap-2.5 group shrink-0"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary-light flex items-center justify-center text-2xl md:text-3xl group-hover:bg-primary group-hover:scale-110 transition-all duration-300 shadow-sm group-hover:shadow-md">
                {cat.emoji}
              </div>
              <span className="text-xs md:text-sm font-medium text-foreground text-center whitespace-nowrap group-hover:text-primary transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
