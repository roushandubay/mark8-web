'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

import { LiquidButton } from '@/components/ui/liquid-glass-button';
import { cn } from '@/lib/utils';
import { useSite } from './site-data';

const NAV = [
  { label: 'Women', href: '/products/?gender=women&title=Women' },
  { label: 'Men', href: '/products/?gender=men&title=Men' },
  { label: 'New in', href: '/products/?collection=new-arrivals&title=New%20Arrivals' },
  { label: 'Best sellers', href: '/products/?collection=best-sellers&title=Best%20Sellers' },
];

/**
 * Floats transparent over the hero video (white logo), then turns into a
 * frosted bar once the page scrolls.
 */
export function Header({ overHero = false }: { overHero?: boolean }) {
  const { setDownloadOpen } = useSite();
  const [scrolled, setScrolled] = useState(!overHero);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!overHero) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [overHero]);

  const light = overHero && !scrolled && !open;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300',
        light ? 'bg-transparent' : 'bg-background/75 shadow-[0_1px_0_rgba(0,0,0,0.05)] backdrop-blur-xl',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
        <Link href="/" aria-label="MARK8 home" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={light ? '/brand/wordmark-light.png' : '/brand/wordmark.png'} alt="MARK8" className="h-4 w-auto md:h-5" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className={cn('text-sm font-medium transition hover:opacity-60', light ? 'text-white' : 'text-foreground')}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LiquidButton variant={light ? 'light' : 'primary'} size="lg" onClick={() => setDownloadOpen(true)}>
            Get the app
          </LiquidButton>
          <button
            className={cn('grid size-10 place-items-center rounded-full md:hidden', light ? 'text-white' : 'text-foreground')}
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-background/95 px-5 pb-6 pt-2 backdrop-blur-xl md:hidden">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href} onClick={() => setOpen(false)} className="block py-3 text-lg font-medium">
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
