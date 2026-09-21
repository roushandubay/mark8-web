'use client';

import Link from 'next/link';

import { useSite } from './site-data';

export function Footer() {
  const { settings, setDownloadOpen } = useSite();
  const email = settings?.support_email;
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/wordmark.png" alt="MARK8" className="h-5 w-auto" />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Clothing, footwear and accessories for men and women. Designed in-house, delivered across India.
          </p>
          <button onClick={() => setDownloadOpen(true)} className="mt-5 text-sm font-semibold underline-offset-4 hover:underline">
            Download the app →
          </button>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Shop</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/products/?gender=women&title=Women">Women</Link></li>
            <li><Link href="/products/?gender=men&title=Men">Men</Link></li>
            <li><Link href="/products/?collection=new-arrivals&title=New%20Arrivals">New arrivals</Link></li>
            <li><Link href="/products/?collection=best-sellers&title=Best%20Sellers">Best sellers</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Help</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {email ? <li><a href={`mailto:${email}`}>{email}</a></li> : null}
            <li><Link href="/privacy/">Privacy policy</Link></li>
            <li><Link href="/terms/">Terms &amp; Conditions</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-muted-foreground md:flex-row md:justify-between md:px-8">
          <span>
            © {new Date().getFullYear()} MARK8. All rights reserved. ·{' '}
            <Link href="/terms/" className="hover:text-foreground">Terms &amp; Conditions</Link> ·{' '}
            <Link href="/privacy/" className="hover:text-foreground">Privacy</Link>
          </span>
          <span className="font-[family-name:var(--font-montserrat)] text-[13px] tracking-wide">
            <span className="font-light">Developed By</span> <span className="font-medium text-foreground">NyxonLab</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
