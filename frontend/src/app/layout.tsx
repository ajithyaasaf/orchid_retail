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
    default: 'Orchid Export Store | Premium Fashion at Factory Prices',
    template: '%s | Orchid Export Store',
  },
  description: 'Shop premium export-quality fashion at unbeatable factory prices. Women, Men, Kids — tops, dresses, shirts, accessories & more. Free shipping above ₹999.',
  keywords: ['export quality', 'fashion', 'affordable fashion', 'women clothing', 'men clothing', 'kids wear', 'orchid store'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://orchidhub.in',
    siteName: 'Orchid Export Store',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col font-sans antialiased" suppressHydrationWarning>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
