'use client';

import Link from 'next/link';

import { Loading, PageHeader, Section } from '@/components/admin/ui';
import { statusLabel } from '@/lib/admin';
import { fmtDate, inr } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAsync } from '@/lib/use-async';

type Stats = {
  orders_today: number;
  revenue_30d: number;
  open_orders: number;
  customers: number;
  products: number;
  low_stock: number;
  out_of_stock: number;
  pending_reviews: number;
};

export default function Dashboard() {
  const stats = useAsync(async () => {
    const { data, error } = await supabase.rpc('admin_stats');
    if (error) throw error;
    return data as Stats;
  }, []);
  const recent = useAsync(async () => {
    const { data } = await supabase.from('orders').select('id, order_number, status, total, created_at').order('created_at', { ascending: false }).limit(8);
    return data ?? [];
  }, []);
  const low = useAsync(async () => {
    const { data } = await supabase
      .from('product_variants')
      .select('id, color_name, size_label, stock, products(id, name)')
      .eq('is_active', true)
      .lte('stock', 5)
      .order('stock')
      .limit(10);
    return (data ?? []) as unknown as { id: string; color_name: string; size_label: string; stock: number; products: { id: string; name: string } }[];
  }, []);

  const s = stats.data;
  const tiles: [string, string | number, string?][] = s
    ? [
        ['Orders today', s.orders_today, '/admin/orders/'],
        ['Revenue · 30 days', inr(Number(s.revenue_30d))],
        ['Open orders', s.open_orders, '/admin/orders/'],
        ['Customers', s.customers, '/admin/customers/'],
        ['Live products', s.products, '/admin/products/'],
        ['Low stock sizes', s.low_stock],
        ['Sold-out sizes', s.out_of_stock],
        ['Reviews to check', s.pending_reviews, '/admin/reviews/'],
      ]
    : [];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Everything on the app and website is managed from here." />
      {stats.loading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map(([label, value, href]) => {
            const body = (
              <div className="rounded-2xl border border-border bg-white p-5 transition hover:border-foreground/20">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
              </div>
            );
            return href ? (
              <Link key={label} href={href}>
                {body}
              </Link>
            ) : (
              <div key={label}>{body}</div>
            );
          })}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title="Recent orders" actions={<Link href="/admin/orders/" className="text-sm text-muted-foreground hover:text-foreground">All orders</Link>}>
          {recent.data?.length ? (
            <ul className="divide-y divide-border">
              {recent.data.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/order/?id=${o.id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:opacity-70">
                    <span className="font-medium">{o.order_number}</span>
                    <span className="text-muted-foreground">{statusLabel(o.status)}</span>
                    <span className="text-muted-foreground">{fmtDate(o.created_at)}</span>
                    <span className="font-medium">{inr(Number(o.total))}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          )}
        </Section>

        <Section title="Running low" description="Sizes with 5 or fewer left.">
          {low.data?.length ? (
            <ul className="divide-y divide-border">
              {low.data.map((v) => (
                <li key={v.id}>
                  <Link href={`/admin/product/?id=${v.products.id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:opacity-70">
                    <span className="truncate font-medium">{v.products.name}</span>
                    <span className="text-muted-foreground">
                      {v.color_name} · {v.size_label}
                    </span>
                    <span className={v.stock === 0 ? 'font-semibold text-destructive' : 'font-semibold'}>{v.stock === 0 ? 'Sold out' : `${v.stock} left`}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Stock looks healthy.</p>
          )}
        </Section>
      </div>
    </>
  );
}
