'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <section className="bg-primary py-12 md:py-16">
      <div className="container text-center">
        <h2
          className="text-2xl md:text-3xl font-bold text-white mb-3"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Stay in the Loop
        </h2>
        <p className="text-sm text-white/80 mb-8 max-w-md mx-auto">
          Get first access to new surplus drops, exclusive deals, and flash sales. No spam — just style.
        </p>

        {submitted ? (
          <div className="animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 text-2xl">
              🎉
            </div>
            <p className="text-lg font-semibold text-white">You&apos;re in!</p>
            <p className="text-sm text-white/80 mt-1">Watch your inbox for exclusive deals.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-5 py-3.5 rounded-full text-sm text-foreground bg-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              className="px-8 py-3.5 bg-hero-bg text-white rounded-full text-sm font-semibold flex items-center justify-center gap-2 hover:bg-black transition-colors shadow-lg"
            >
              <Send size={16} />
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
