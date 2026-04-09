import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import WhatsAppButton from '@/components/layout/WhatsAppButton';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Orchid Export Surplus Store | Premium Fashion at Surplus Prices',
    template: '%s | Orchid Export Surplus Store',
  },
  description: 'Shop export-quality fashion at unbeatable surplus prices. Women, Men, Kids — tops, dresses, shirts, accessories & more. Free shipping above ₹999.',
  keywords: ['export surplus', 'fashion', 'affordable fashion', 'women clothing', 'men clothing', 'kids wear', 'orchid store'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    siteName: 'Orchid Export Surplus Store',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
