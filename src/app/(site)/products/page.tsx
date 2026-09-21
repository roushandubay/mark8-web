'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { SearchX } from 'lucide-react';

import { ProductCard, ProductCardSkeleton } from '@/components/site/product-card';
import { getCollections, getProducts } from '@/lib/data';
import { useAsync } from '@/lib/use-async';
import { cn } from '@/lib/utils';

function Listing() {
  const params = useSearchParams();
  const collection = params.get('collection') ?? undefined;
  const path = params.get('path') ?? undefined;
  const gender = params.get('gender') ?? undefined;
  const search = params.get('q') ?? undefined;
  const title = params.get('title') ?? 'Shop';

  const products = useAsync(() => getProducts({ collection, path, gender, search, limit: 60 }), [collection, path, gender, search]);
  const styles = useAsync(() => getCollections('style'), []);

  const chips = [
    { label: 'Women', href: '/products/?gender=women&title=Women', on: gender === 'women' && !collection },
    { label: 'Men', href: '/products/?gender=men&title=Men', on: gender === 'men' && !collection },
    ...(styles.data ?? []).map((c) => ({
      label: c.name,
      href: `/products/?collection=${c.slug}&title=${encodeURIComponent(c.name)}`,
      on: collection === c.slug,
    })),
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
      <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{products.data ? `${products.data.length} items` : ' '}</p>

      <div className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
        {chips.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={cn(
              'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition',
              c.on ? 'bg-foreground text-white' : 'bg-white text-foreground hover:bg-muted',
            )}
          >
            {c.label}
          </Link>
        ))}
      </div>

      {products.error ? (
        <div className="py-24 text-center">
          <p className="font-semibold">Something went wrong</p>
          <button onClick={products.reload} className="mt-3 text-sm underline">
            Try again
          </button>
        </div>
      ) : products.data && !products.data.length ? (
        <div className="py-24 text-center">
          <SearchX className="mx-auto size-8" strokeWidth={1.5} />
          <p className="mt-4 font-semibold">We couldn’t find that</p>
          <p className="mt-1 text-sm text-muted-foreground">Try another category.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          {(products.data ?? Array.from({ length: 8 }, () => null)).map((p, n) =>
            p ? <ProductCard key={p.id} product={p} priority={n < 4} /> : <ProductCardSkeleton key={n} />,
          )}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <Listing />
    </Suspense>
  );
}
