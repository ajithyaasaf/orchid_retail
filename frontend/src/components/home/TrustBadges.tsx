'use client';

import { Shield, RotateCcw, Truck, Award, CreditCard, Headphones } from 'lucide-react';

const BADGES = [
  { icon: Award, label: 'Export Quality', desc: 'Premium factory-direct products' },
  { icon: Truck, label: 'Free Delivery', desc: 'On orders above ₹999' },
  { icon: RotateCcw, label: 'Easy Returns', desc: '7-day return policy' },
  { icon: CreditCard, label: 'COD Available', desc: 'Cash on delivery' },
  { icon: Shield, label: 'Secure Payments', desc: 'UPI, Cards & more' },
  { icon: Headphones, label: '24/7 Support', desc: 'WhatsApp & call' },
];

export default function TrustBadges() {
  return (
    <section className="py-10 md:py-14 bg-surface">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {BADGES.map(badge => (
            <div
              key={badge.label}
              className="flex flex-col items-center text-center p-4 md:p-5 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mb-3">
                <badge.icon size={22} className="text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{badge.label}</h3>
              <p className="text-xs text-muted mt-0.5">{badge.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
