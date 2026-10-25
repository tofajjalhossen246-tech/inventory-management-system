import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inventory Management System',
  description: 'Subscription-based inventory management for retail shops'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
