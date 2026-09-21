'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Empty, Loading, PageHeader, Select } from '@/components/admin/ui';
import { Input } from '@/components/ui/input';
import { ORDER_STATUSES, statusLabel } from '@/lib/admin';
import { fmtDate, inr } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAsync } from '@/lib/use-async';
import { cn } from '@/lib/utils';

const TONE: Record<string, string> = {
  placed: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-sky-50 text-sky-700',
  packed: 'bg-sky-50 text-sky-700',
  shipped: 'bg-violet-50 text-violet-700',
  out_for_delivery: 'bg-violet-50 text-violet-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-muted text-muted-foreground',
};

export default function Orders() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const orders = useAsync(async () => {
    let query = supabase
      .from('orders')
      .select('id, order_number, status, payment_method, payment_status, upi_ref, total, created_at, shipping_address, order_items(quantity)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (status) query = query.eq('status', status);
    if (q.trim()) query = query.ilike('order_number', `%${q.trim()}%`);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }, [status, q]);
  const { reload } = orders;
  useEffect(() => {
    window.addEventListener('mark8:new-order', reload);
    return () => window.removeEventListener('mark8:new-order', reload);
  }, [reload]);

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle="Move orders through packing and delivery — customers see every step in the app."
        actions={
          <>
            <Input placeholder="Search order no." value={q} onChange={(e) => setQ(e.target.value)} className="w-44" />
            <Select value={status} onChange={setStatus} placeholder="All statuses" options={ORDER_STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))} className="w-44" />
          </>
        }
      />
      {orders.loading ? (
        <Loading />
      ) : !orders.data?.length ? (
        <Empty>No orders match.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.data.map((o) => {
                const addr = o.shipping_address as { full_name: string; city: string };
                const items = (o.order_items as { quantity: number }[]).reduce((n, i) => n + i.quantity, 0);
                return (
                  <tr key={o.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/admin/order/?id=${o.id}`} className="hover:underline">
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {addr.full_name}
                      <span className="text-muted-foreground"> · {addr.city}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(o.created_at)}</td>
                    <td className="px-4 py-3">{items}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {o.payment_method.toUpperCase()} · {o.payment_method === 'upi' && o.payment_status === 'pending' && o.upi_ref ? 'verify UTR' : o.payment_status}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', TONE[o.status] ?? 'bg-muted')}>{statusLabel(o.status)}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{inr(Number(o.total))}</td>
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
