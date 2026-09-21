'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Field, Loading, PageHeader, Section, Select } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errorText, ORDER_STATUSES, statusLabel } from '@/lib/admin';
import { fmtDate, img, inr } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAsync } from '@/lib/use-async';

function OrderDetail() {
  const id = useSearchParams().get('id') ?? '';
  const order = useAsync(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), order_events(status, note, created_at)')
      .eq('id', id)
      .single();
    if (error) throw error;
    const { data: who } = await supabase.from('profiles').select('full_name, email').eq('id', data.user_id).maybeSingle();
    return { ...data, customer: who };
  }, [id]);
  const [next, setNext] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (order.loading) return <Loading />;
  const o = order.data;
  if (!o) return <p className="text-sm text-muted-foreground">Order not found.</p>;
  const addr = o.shipping_address as Record<string, string>;
  const events = [...(o.order_events as { status: string; note: string | null; created_at: string }[])].sort((a, b) => a.created_at.localeCompare(b.created_at));

  const update = async () => {
    if (!next) return;
    if (next === 'cancelled' && !window.confirm('Cancel this order? Its stock goes back on sale.')) return;
    setBusy(true);
    const { error } = await supabase.rpc('admin_set_order_status', { p_order: id, p_status: next, p_note: note || null });
    setBusy(false);
    if (error) return toast.error(errorText(error));
    toast.success(`Marked ${statusLabel(next).toLowerCase()}`);
    setNext('');
    setNote('');
    order.reload();
  };

  const setPayment = async (status: 'paid' | 'failed' | 'pending') => {
    setBusy(true);
    const { error } = await supabase.rpc('admin_set_payment_status', { p_order: id, p_status: status, p_note: null });
    setBusy(false);
    if (error) return toast.error(errorText(error));
    toast.success(`Payment marked ${status}`);
    order.reload();
  };
  const phone = String(addr.phone ?? '').replace(/\D/g, '');
  const waHref = `https://wa.me/${phone.length === 10 ? `91${phone}` : phone}?text=${encodeURIComponent(`Hi ${addr.full_name}, this is MARK8 about your order ${o.order_number}.`)}`;

  return (
    <>
      <Link href="/admin/orders/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Orders
      </Link>
      <PageHeader title={o.order_number} subtitle={`Placed ${fmtDate(o.created_at, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}`} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Section title="Items">
            <ul className="divide-y divide-border">
              {(o.order_items as { id: string; name: string; image_url: string | null; color_name: string; size_label: string; quantity: number; unit_price: number }[]).map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3">
                  <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {i.image_url ? <img src={img(i.image_url, 120)} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{i.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {i.color_name} · {i.size_label} · Qty {i.quantity}
                    </p>
                  </div>
                  <p className="font-medium">{inr(Number(i.unit_price) * i.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{inr(Number(o.subtotal))}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{Number(o.shipping) ? inr(Number(o.shipping)) : 'Free'}</dd></div>
              <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{inr(Number(o.total))}</dd></div>
            </dl>
          </Section>

          <Section title="Timeline" description="What the customer sees under Track order.">
            <ol className="space-y-3">
              {events.map((e, n) => (
                <li key={n} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-foreground" />
                  <div>
                    <p className="font-medium">{statusLabel(e.status)}</p>
                    <p className="text-muted-foreground">
                      {fmtDate(e.created_at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                      {e.note ? ` · ${e.note}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Update status">
            <p className="mb-4 text-sm">
              Now: <span className="font-semibold">{statusLabel(o.status)}</span>
            </p>
            <div className="space-y-3">
              <Field label="Move to">
                <Select value={next} onChange={setNext} placeholder="Choose…" options={ORDER_STATUSES.filter((s) => s !== o.status).map((s) => ({ value: s, label: statusLabel(s) }))} />
              </Field>
              <Field label="Note (optional)" hint="e.g. courier and tracking number — shown on the timeline.">
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Blue Dart · AWB 1234567" />
              </Field>
              <Button className="h-9 w-full" disabled={!next || busy} onClick={update}>
                Update order
              </Button>
            </div>
          </Section>

          <Section title="Customer">
            <p className="text-sm font-medium">{o.customer?.full_name ?? addr.full_name}</p>
            {o.customer?.email ? <p className="text-sm text-muted-foreground">{o.customer.email}</p> : null}
            <p className="mt-4 text-sm font-medium">Deliver to</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {addr.full_name}
              <br />
              {addr.line1}
              {addr.line2 ? `, ${addr.line2}` : ''}
              <br />
              {addr.city}, {addr.state} {addr.pincode}
              <br />
              +91 {addr.phone}
            </p>
            <a href={waHref} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-muted">
              WhatsApp customer ↗
            </a>
          </Section>

          <Section title="Payment" description={o.payment_method === 'upi' ? 'Match the UTR below in your UPI app, then mark it paid.' : undefined}>
            <p className="text-sm">
              {o.payment_method === 'cod' ? 'Cash on delivery' : o.payment_method.toUpperCase()} · {inr(Number(o.total))} ·{' '}
              <span className={o.payment_status === 'paid' ? 'font-semibold text-emerald-700' : o.payment_status === 'failed' ? 'font-semibold text-red-700' : 'font-semibold'}>
                {o.payment_status}
              </span>
            </p>
            {o.payment_method === 'upi' ? (
              o.upi_ref ? (
                <div className="mt-3 rounded-xl bg-muted px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">Customer’s UPI reference (UTR)</p>
                  <p className="font-mono text-base font-semibold tracking-wider">{o.upi_ref}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Search this number in your UPI app’s history and check the amount is {inr(Number(o.total))}.
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">No UPI reference submitted yet.</p>
              )
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {o.payment_status !== 'paid' && (
                <Button className="h-9" disabled={busy} onClick={() => setPayment('paid')}>
                  Mark paid
                </Button>
              )}
              {o.payment_status === 'pending' && (
                <Button variant="outline" className="h-9" disabled={busy} onClick={() => setPayment('failed')}>
                  Mark failed
                </Button>
              )}
              {o.payment_status !== 'pending' && (
                <Button variant="outline" className="h-9" disabled={busy} onClick={() => setPayment('pending')}>
                  Back to pending
                </Button>
              )}
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}

export default function OrderPage() {
  return (
    <Suspense>
      <OrderDetail />
    </Suspense>
  );
}
