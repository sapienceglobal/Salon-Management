import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: {
    default: 'Salon Pro — Premium Salon & Spa Management',
    template: '%s | Salon Pro',
  },
  description: 'Book salon services online. Premium haircuts, skin care, spa treatments, bridal makeup, and more. Best salon management experience.',
  keywords: ['salon', 'spa', 'beauty', 'haircut', 'facial', 'bridal makeup', 'booking'],
  authors: [{ name: 'Salon Pro' }],
  openGraph: {
    title: 'Salon Pro — Premium Salon & Spa Management',
    description: 'Book salon services online. Premium haircuts, skin care, spa treatments, and more.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'Salon Pro',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme-mode="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
