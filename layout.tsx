import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://dhananjay.group'),
  title: { default: 'Dhananjay.group — Free Online Tools', template: '%s | Dhananjay.group' },
  description: 'Simple, free online tools for PDFs, images, calculators and everyday tasks. Process files locally in your browser.',
  applicationName: 'Dhananjay.group',
  keywords: ['free online tools','PDF tools','image compressor','QR generator','calculators'],
  openGraph: { title: 'Dhananjay.group', description: 'Everything useful. Nothing complicated.', url: 'https://dhananjay.group', siteName: 'Dhananjay.group', type: 'website' },
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
