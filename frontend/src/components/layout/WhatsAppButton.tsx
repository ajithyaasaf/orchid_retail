'use client';

import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  const message = encodeURIComponent(
    'Hi! I have a query about products at Orchid Export Store.'
  );
  const phone = '917200879956';

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 hover:shadow-xl transition-all duration-200"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={26} fill="white" />
    </a>
  );
}
