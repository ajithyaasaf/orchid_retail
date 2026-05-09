'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Globe, Heart, MessageCircle, Play } from 'lucide-react';

const FOOTER_LINKS = {
  shop: [
    { name: "Women's Tops", href: '/category/women-tops' },
    { name: "Women's Dresses", href: '/category/women-dresses' },
    { name: "Men's Shirts", href: '/category/men-shirts' },
    { name: "Kids' Wear", href: '/category/kids-wear' },
    { name: 'Accessories', href: '/category/accessories' },
    { name: 'Footwear', href: '/category/footwear' },
  ],
  help: [
    { name: 'Track Order', href: '/account/orders' },
    { name: 'Returns & Exchanges', href: '/returns-policy' },
    { name: 'Shipping Info', href: '/shipping-info' },
    { name: 'Size Guide', href: '/size-guide' },
    { name: 'FAQs', href: '/faqs' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Bulk Enquiry', href: '/bulk-enquiry' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms of Service', href: '/terms' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-hero-bg text-white">
      {/* Main footer */}
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand section */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 group-hover:scale-110 transition-transform">
                <img src="/images/Logo.png" alt="Orchid Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight">Orchid</span>
                <span className="block text-[10px] text-gray-400 -mt-1 tracking-widest uppercase">
                  Wholesale Orchids
                </span>
              </div>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-xs">
              Premium export-quality fashion at factory prices. Direct from the manufacturer to your doorstep.
            </p>

            {/* Contact */}
            <div className="space-y-2.5">
              <a href="mailto:orchidkidswearhub@gmail.com" className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors">
                <Mail size={16} />
                orchidkidswearhub@gmail.com
              </a>
              <a href="tel:+917200879956" className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary transition-colors">
                <Phone size={14} />
                +91 72008 79956
              </a>
              <div className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin size={14} className="mt-1 shrink-0" />
                <p className="leading-relaxed">
                  no.3(1)2A, Sivarajan compound,<br />
                  appachi Nagar extension, 2nd Street,<br />
                  Kongu main road, Tirupur - 641607
                </p>
              </div>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Shop</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.shop.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Help</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.help.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Company</h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.company.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-400 hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Social */}
            <div className="flex items-center gap-3 mt-6">
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors" aria-label="Instagram">
                <Globe size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors" aria-label="Facebook">
                <Heart size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors" aria-label="Twitter">
                <MessageCircle size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors" aria-label="YouTube">
                <Play size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Orchid Export Store. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">We accept:</span>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="px-2 py-1 bg-white/10 rounded">UPI</span>
              <span className="px-2 py-1 bg-white/10 rounded">Cards</span>
              <span className="px-2 py-1 bg-white/10 rounded">NetBanking</span>
              <span className="px-2 py-1 bg-white/10 rounded">COD</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
