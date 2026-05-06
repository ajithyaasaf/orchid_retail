'use client';

export default function BrandStory() {
  return (
    <section className="py-14 md:py-20">
      <div className="container">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-3">
            Our Story
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold text-foreground mb-6"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Why Orchid?
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mt-10">
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-2xl">
                🏭
              </div>
              <h3 className="text-base font-semibold text-foreground">Export Stock</h3>
              <p className="text-sm text-muted leading-relaxed">
                Our products are from top export houses that manufacture for brands like H&M, Zara, and GAP.
                Same quality, fraction of the price.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-2xl">
                ✨
              </div>
              <h3 className="text-base font-semibold text-foreground">Premium Quality</h3>
              <p className="text-sm text-muted leading-relaxed">
                Every piece passes strict quality checks. What you get is the same fabric, stitching,
                and finishing that goes to international stores.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-2xl">
                💰
              </div>
              <h3 className="text-base font-semibold text-foreground">Unbeatable Prices</h3>
              <p className="text-sm text-muted leading-relaxed">
                We cut out the middlemen and brand markups. Get genuine export-quality products at
                60–80% less than retail.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
