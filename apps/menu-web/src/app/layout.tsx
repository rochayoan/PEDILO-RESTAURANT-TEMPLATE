import './globals.css';
import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';

const name = process.env.NEXT_PUBLIC_RESTAURANT_NAME || 'Restaurante';
const subtitle = process.env.NEXT_PUBLIC_RESTAURANT_SUBTITLE || '';
const color = process.env.NEXT_PUBLIC_RESTAURANT_PRIMARY || '#b54327';
const logo = process.env.NEXT_PUBLIC_RESTAURANT_LOGO || '/brand/logo.svg';
export const metadata: Metadata = {
  title: name + ' | Menú digital',
  description: 'Consultá los productos y precios de ' + name,
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="es"><body style={{ '--brand': color } as CSSProperties}>
    <header className="header"><div className="header-inner">
      <img src={logo} alt="" className="logo" width="64" height="64" />
      <div><h1 style={{margin:0}}>{name}</h1><p style={{margin:'6px 0 0'}}>{subtitle}</p></div>
    </div></header>{children}
  </body></html>;
}
