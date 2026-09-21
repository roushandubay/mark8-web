'use client';

import Link from 'next/link';
import { motion } from 'motion/react';

import { img, inr } from '@/lib/format';
import type { ProductCard as Card } from '@/lib/types';

/** Same card as the app: soft grey tile, name, house label, price with MRP and % off. */
export function ProductCard({ product, priority }: { product: Card; priority?: boolean }) {
  const off = product.mrp > product.price ? Math.round((1 - product.price / product.mrp) * 100) : 0;
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
      <Link href={`/product/?slug=${product.slug}`} className="group block">
        <div className="relative aspect-[160/203] overflow-hidden rounded-2xl bg-muted">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img(product.image, 640, 812)}
              alt={product.name}
              loading={priority ? 'eager' : 'lazy'}
              className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : null}
          {product.stock <= 0 && (
            <span className="absolute bottom-3 left-3 rounded-lg bg-white px-2 py-1 text-[11px] font-medium text-muted-foreground">Sold out</span>
          )}
          {off >= 20 && product.stock > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-sale backdrop-blur">
              {off}% off
            </span>
          )}
        </div>
        <p className="mt-3 line-clamp-2 text-[13px] font-medium leading-snug">{product.name}</p>
        {product.label ? <p className="mt-0.5 text-[12px] text-muted-foreground">{product.label}</p> : null}
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-semibold">{inr(product.price)}</span>
          {off > 0 && <span className="text-[12px] text-muted-foreground line-through">{inr(product.mrp)}</span>}
        </p>
      </Link>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <div className="aspect-[160/203] animate-pulse rounded-2xl bg-muted" />
      <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-muted" />
    </div>
  );
}
