import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Guhanix CRM — Lead Management Dashboard',
  description: 'Lead generation and management CRM for Guhanix Technology',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
