import type { Metadata } from 'next';
import './globals.css';
import OrderReminder from './order-reminder';
export const metadata: Metadata = {
  title: 'Meinerz Uniform Studio — criação e produção de uniformes',
  creator: 'Andrei Raimundi',
  authors: [{ name: 'Andrei Raimundi' }],
  description: 'Simulador de uniformes, apresentações 3D, listas, orçamentos e pedidos de produção.',
  icons: {
    icon: [
      { url: '/favicon.ico?v=meinerz-20261113', type: 'image/x-icon', sizes: '16x16 32x32 48x48 64x64' },
      { url: '/atlas-favicon-32.png?v=meinerz-20261113', type: 'image/png', sizes: '32x32' },
      { url: '/atlas-favicon.svg?v=meinerz-20261113', type: 'image/svg+xml', sizes: 'any' },
    ],
    shortcut: '/favicon.ico?v=meinerz-20261113',
    apple: { url: '/apple-touch-icon.png?v=meinerz-20261113', sizes: '180x180', type: 'image/png' },
  },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" suppressHydrationWarning><head><link rel="stylesheet" href="/interface-theme.css?v=2"/><link rel="stylesheet" href="/studio-navigation.css?v=1"/><link rel="stylesheet" href="/atlas-brand.css?v=1"/><link rel="stylesheet" href="/interface-typography.css?v=4"/><link rel="stylesheet" href="/work-progress.css?v=1"/><script src="/interface-theme.js?v=2"/></head><body>{children}<OrderReminder/></body></html>;
}
