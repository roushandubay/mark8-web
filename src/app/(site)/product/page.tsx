'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, RotateCcw, Truck } from 'lucide-react';

import { ProductSection } from '@/components/site/home-sections';
import { useSite } from '@/components/site/site-data';
import { LiquidButton } from '@/components/ui/liquid-glass-button';
import { getProduct } from '@/lib/data';
import { img, inr } from '@/lib/format';
import { useAsync } from '@/lib/use-async';
import { cn } from '@/lib/utils';

type System = 'in' | 'uk' | 'us';

function Detail() {
  const slug = useSearchParams().get('slug') ?? '';
  const { settings, setDownloadOpen } = useSite();
  const { data: p, loading } = useAsync(() => getProduct(slug), [slug]);
  const [active, setActive] = useState(0);
  const [system, setSystem] = useState<System>('in');
  const colors = useMemo(() => {
    const m = new Map<string, string>();
    p?.variants.forEach((v) => m.set(v.color_name, v.color_hex));
    return [...m];
  }, [p]);
  const [color, setColor] = useState<string | null>(null);
  const shownColor = color ?? colors[0]?.[0] ?? null;
  const sizes = p?.variants.filter((v) => v.color_name === shownColor) ?? [];

  if (loading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 md:grid-cols-2 md:px-8">
        <div className="aspect-[4/5] animate-pulse rounded-3xl bg-muted" />
        <div className="space-y-4">
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }
  if (!p) {
    return (
      <div className="py-32 text-center">
        <p className="text-lg font-semibold">This piece is no longer available</p>
        <Link href="/products/" className="mt-3 inline-block text-sm underline">
          Keep shopping
        </Link>
      </div>
    );
  }

  const images = p.images.length ? p.images : p.image ? [p.image] : [];
  const off = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  const cfg = settings;

  return (
    <>
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-8 md:grid-cols-2 md:gap-14 md:px-8 md:py-12">
        <div>
          <Link href="/products/" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back
          </Link>
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted">
            {images[active] ? (
              <motion.img
                key={images[active]}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                src={img(images[active], 1400, 1750)}
                alt={p.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((u, n) => (
                <button
                  key={u + n}
                  onClick={() => setActive(n)}
                  aria-label={`Image ${n + 1}`}
                  className={cn('relative size-20 overflow-hidden rounded-xl bg-muted ring-2 transition', n === active ? 'ring-foreground' : 'ring-transparent')}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img(u, 200)} alt="" className="absolute inset-0 h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:pt-12">
          <p className="text-sm text-muted-foreground">{p.label ?? p.categoryName}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{p.name}</h1>
          <p className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-semibold">{inr(p.price)}</span>
            {off > 0 && (
              <>
                <span className="text-muted-foreground line-through">{inr(p.mrp)}</span>
                <span className="font-semibold text-sale">{off}% off</span>
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>

          {colors.length > 1 && (
            <div className="mt-8">
              <p className="text-sm font-semibold">
                Colour <span className="font-normal text-muted-foreground">· {shownColor}</span>
              </p>
              <div className="mt-3 flex gap-3">
                {colors.map(([name, hex]) => (
                  <button
                    key={name}
                    onClick={() => setColor(name)}
                    aria-label={name}
                    className={cn('grid size-9 place-items-center rounded-full ring-2 transition', name === shownColor ? 'ring-foreground' : 'ring-transparent')}
                  >
                    <span className="size-7 rounded-full ring-1 ring-border" style={{ backgroundColor: hex }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 1 && (
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Sizes</p>
                <div className="flex rounded-xl bg-muted p-1 text-xs font-semibold">
                  {(['in', 'uk', 'us'] as System[]).map((s) => (
                    <button key={s} onClick={() => setSystem(s)} className={cn('rounded-lg px-2.5 py-1 transition', system === s ? 'bg-white shadow-sm' : 'text-muted-foreground')}>
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {sizes.map((v) => {
                  const label = (system === 'in' ? v.size_in : system === 'uk' ? v.size_uk : v.size_us) ?? v.size_label;
                  return (
                    <span
                      key={v.size_label}
                      className={cn('grid h-14 min-w-14 place-items-center rounded-xl bg-muted px-3 text-sm font-semibold', v.stock <= 0 && 'text-muted-foreground line-through opacity-60')}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <LiquidButton variant="primary" size="xl" className="mt-10 w-full md:w-auto" onClick={() => setDownloadOpen(true)}>
            Buy in the MARK8 app
          </LiquidButton>

          <div className="mt-8 space-y-3 rounded-2xl bg-white p-5 text-sm">
            <p className="flex items-center gap-3">
              <Truck className="size-4" strokeWidth={1.6} />
              Delivery in {cfg?.delivery_days_min ?? 3}–{cfg?.delivery_days_max ?? 5} days · free over {inr(Number(cfg?.free_shipping_from ?? 999))}
            </p>
            <p className="flex items-center gap-3">
              <RotateCcw className="size-4" strokeWidth={1.6} />
              Easy {cfg?.return_days ?? 7}-day returns
            </p>
          </div>

          <div className="mt-8">
            <p className="text-sm font-semibold">Description</p>
            <p className="mt-2 leading-relaxed text-muted-foreground">{p.description}</p>
            <dl className="mt-4 grid grid-cols-[100px_1fr] gap-y-2 text-sm">
              {[
                ['Material', p.material],
                ['Fit', p.fit],
                ['Care', p.care],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>
      </div>
      <ProductSection title="You may also like" collection="trending" href="/products/?collection=trending&title=Trending" />
      <div className="h-16" />
    </>
  );
}

export default function ProductPage() {
  return (
    <Suspense>
      <Detail />
    </Suspense>
  );
}
