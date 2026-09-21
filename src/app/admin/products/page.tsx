'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Empty, Loading, PageHeader, Select, StatusPill } from '@/components/admin/ui';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { img, inr } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAsync } from '@/lib/use-async';
import { cn } from '@/lib/utils';

type Row = {
  id: string;
  slug: string;
  name: string;
  gender: string;
  price: number;
  mrp: number;
  is_active: boolean;
  sold_count: number;
  categories: { name: string; path: string } | null;
  product_images: { url: string; sort_order: number }[];
  product_variants: { stock: number; is_active: boolean }[];
};

export default function Products() {
  const [q, setQ] = useState('');
  const [show, setShow] = useState('all');
  const products = useAsync(async () => {
    let query = supabase
      .from('products')
      .select('id, slug, name, gender, price, mrp, is_active, sold_count, categories(name, path), product_images(url, sort_order), product_variants(stock, is_active)')
      .order('created_at', { ascending: false });
    if (q.trim()) query = query.ilike('name', `%${q.trim()}%`);
    if (show === 'live') query = query.eq('is_active', true);
    if (show === 'hidden') query = query.eq('is_active', false);
    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as Row[];
  }, [q, show]);

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Names, photos, prices, colours, sizes and stock. Changes show in the app and on the website straight away."
        actions={
          <>
            <Input placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} className="w-48" />
            <Select
              value={show}
              onChange={setShow}
              options={[
                { value: 'all', label: 'All' },
                { value: 'live', label: 'Live' },
                { value: 'hidden', label: 'Hidden' },
              ]}
              className="w-28"
            />
            <Link href="/admin/product/?id=new" className={cn(buttonVariants(), 'h-9 gap-1.5 px-3')}>
              <Plus className="size-4" /> New product
            </Link>
          </>
        }
      />
      {products.loading ? (
        <Loading />
      ) : !products.data?.length ? (
        <Empty>No products yet.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Sold</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.data.map((p) => {
                const cover = [...p.product_images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
                const stock = p.product_variants.filter((v) => v.is_active).reduce((n, v) => n + v.stock, 0);
                const off = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
                return (
                  <tr key={p.id} className="hover:bg-muted/40">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/product/?id=${p.id}`} className="flex items-center gap-3">
                        <span className="size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {cover ? <img src={img(cover, 100)} alt="" className="h-full w-full object-cover" /> : null}
                        </span>
                        <span className="font-medium hover:underline">{p.name}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {p.categories?.name} · {p.gender}
                    </td>
                    <td className="px-4 py-2.5">
                      {inr(Number(p.price))}
                      {off ? <span className="ml-1.5 text-xs text-sale">−{off}%</span> : null}
                    </td>
                    <td className={cn('px-4 py-2.5', stock === 0 && 'font-semibold text-destructive')}>{stock === 0 ? 'Sold out' : stock}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.sold_count}</td>
                    <td className="px-4 py-2.5">
                      <StatusPill on={p.is_active} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
