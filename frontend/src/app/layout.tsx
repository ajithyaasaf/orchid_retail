import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import StoreShell from '@/components/layout/StoreShell';
import { SHIPPING } from '@orchid/shared';

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
    default: 'Orchid Wholesale | Premium Fashion at Factory Prices',
    template: '%s | Orchid Wholesale',
  },
  description: `Shop premium quality fashion at unbeatable factory prices. Wholesale Orchids — Women, Men, Kids — direct from the manufacturer. Free shipping above ₹${SHIPPING.FREE_THRESHOLD}.`,
  keywords: ['wholesale fashion', 'factory prices', 'affordable fashion', 'women clothing', 'men clothing', 'kids wear', 'orchid store'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://orchidhub.in',
    siteName: 'Orchid Wholesale',
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
        <StoreShell>{children}</StoreShell>
      </body>
    </html>
  );
}
