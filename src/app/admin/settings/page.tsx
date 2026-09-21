'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Field, Loading, PageHeader, Section, Toggle } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errorText } from '@/lib/admin';
import { inr } from '@/lib/format';
import { supabase } from '@/lib/supabase';

type S = {
  free_shipping_from: number;
  shipping_fee: number;
  delivery_days_min: number;
  delivery_days_max: number;
  return_days: number;
  support_email: string | null;
  support_phone: string | null;
  cod_enabled: boolean;
  upi_enabled: boolean;
  upi_id: string | null;
  upi_payee_name: string | null;
  whatsapp_number: string | null;
  razorpay_enabled: boolean;
  razorpay_key_id: string | null;
};

const FIELDS: (keyof S)[] = [
  'free_shipping_from', 'shipping_fee', 'delivery_days_min', 'delivery_days_max', 'return_days', 'support_email', 'support_phone',
  'cod_enabled', 'upi_enabled', 'upi_id', 'upi_payee_name', 'whatsapp_number', 'razorpay_enabled', 'razorpay_key_id',
];
const blank = (v: string | null) => (v?.trim() ? v.trim() : null);

/** Shipping, delivery and returns rules — used by the app, the website and the checkout itself. */
export default function StoreSettings() {
  const [s, setS] = useState<S | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('store_settings')
      .select(FIELDS.join(', '))
      .eq('id', 1)
      .single()
      .then(({ data, error }) => {
        if (error) toast.error(errorText(error));
        if (error?.message.includes('column')) toast.error('Run update-3-payments.sql in Supabase first.');
        const d = data as unknown as S | null;
        if (d) setS({ ...d, free_shipping_from: Number(d.free_shipping_from), shipping_fee: Number(d.shipping_fee) });
      });
  }, []);

  const num = (k: keyof S) => (e: React.ChangeEvent<HTMLInputElement>) => setS((x) => ({ ...x!, [k]: Math.max(0, Number(e.target.value) || 0) }));

  const save = async () => {
    if (!s) return;
    if (s.delivery_days_max < s.delivery_days_min) return toast.error('Latest delivery day can’t be before the earliest.');
    if (!s.cod_enabled && !s.upi_enabled) return toast.error('Keep at least one payment method on.');
    if (s.upi_enabled && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(s.upi_id?.trim() ?? '')) return toast.error('Enter a valid UPI ID, like mark8@okhdfcbank.');
    if (s.whatsapp_number && s.whatsapp_number.replace(/\D/g, '').length < 10) return toast.error('WhatsApp number looks too short.');
    if (s.razorpay_key_id && !/^rzp_(test|live)_\w+$/.test(s.razorpay_key_id.trim())) return toast.error('Razorpay Key ID starts with rzp_live_ or rzp_test_.');
    setSaving(true);
    const { error } = await supabase
      .from('store_settings')
      .update({
        ...s,
        support_email: blank(s.support_email),
        support_phone: blank(s.support_phone),
        upi_id: blank(s.upi_id),
        upi_payee_name: blank(s.upi_payee_name),
        whatsapp_number: blank(s.whatsapp_number),
        razorpay_key_id: blank(s.razorpay_key_id),
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);
    setSaving(false);
    if (error) return toast.error(errorText(error));
    toast.success('Saved — checkout uses these right away');
  };

  if (!s) return <Loading />;

  return (
    <>
      <PageHeader
        title="Store settings"
        actions={
          <Button className="h-9 px-4" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null} Save
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Shipping" description={`Orders from ${inr(s.free_shipping_from)} ship free; below that the fee is ${inr(s.shipping_fee)}.`}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Free shipping from ₹">
              <Input type="number" min={0} value={s.free_shipping_from} onChange={num('free_shipping_from')} />
            </Field>
            <Field label="Shipping fee ₹">
              <Input type="number" min={0} value={s.shipping_fee} onChange={num('shipping_fee')} />
            </Field>
          </div>
        </Section>
        <Section title="Delivery & returns">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Earliest (days)">
              <Input type="number" min={0} value={s.delivery_days_min} onChange={num('delivery_days_min')} />
            </Field>
            <Field label="Latest (days)">
              <Input type="number" min={0} value={s.delivery_days_max} onChange={num('delivery_days_max')} />
            </Field>
            <Field label="Returns (days)">
              <Input type="number" min={0} value={s.return_days} onChange={num('return_days')} />
            </Field>
          </div>
        </Section>
        <Section title="Support contact" description="Shown on the website footer and legal pages.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Email">
              <Input type="email" value={s.support_email ?? ''} onChange={(e) => setS({ ...s, support_email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={s.support_phone ?? ''} onChange={(e) => setS({ ...s, support_phone: e.target.value })} />
            </Field>
          </div>
        </Section>
        <Section title="Payments" description="What shoppers can choose at checkout. UPI payments go straight to your UPI ID — confirm them on the order page.">
          <div className="grid gap-3">
            <Toggle label="Cash on delivery" checked={s.cod_enabled} onChange={(v) => setS({ ...s, cod_enabled: v })} />
            <Toggle label="UPI" hint="Opens GPay / PhonePe / Paytm with your UPI ID and the order amount" checked={s.upi_enabled} onChange={(v) => setS({ ...s, upi_enabled: v })} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="UPI ID">
                <Input placeholder="mark8@okhdfcbank" value={s.upi_id ?? ''} onChange={(e) => setS({ ...s, upi_id: e.target.value })} />
              </Field>
              <Field label="Name shown in UPI app">
                <Input placeholder="MARK8" value={s.upi_payee_name ?? ''} onChange={(e) => setS({ ...s, upi_payee_name: e.target.value })} />
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">A business / merchant UPI ID works best — some UPI apps limit payments to personal IDs.</p>
          </div>
        </Section>
        <Section title="WhatsApp orders" description="After ordering, the app asks shoppers to send you a ready-written WhatsApp message with the order details.">
          <Field label="WhatsApp Business number">
            <Input placeholder="98765 43210" inputMode="tel" value={s.whatsapp_number ?? ''} onChange={(e) => setS({ ...s, whatsapp_number: e.target.value })} />
          </Field>
          <p className="mt-2 text-xs text-muted-foreground">Leave empty to hide the WhatsApp popup. 10-digit numbers are treated as Indian (+91).</p>
        </Section>
        <Section title="Razorpay" description="Cards, net banking and wallets. Coming later — the app keeps these as “Coming soon” until the integration is added.">
          <div className="grid gap-3">
            <Toggle label="Enable Razorpay" hint="Takes effect once the integration ships" checked={s.razorpay_enabled} onChange={(v) => setS({ ...s, razorpay_enabled: v })} />
            <Field label="Key ID (public)">
              <Input placeholder="rzp_live_…" value={s.razorpay_key_id ?? ''} onChange={(e) => setS({ ...s, razorpay_key_id: e.target.value })} />
            </Field>
            <p className="text-xs text-muted-foreground">Never paste the Key Secret here. It will be stored as a server secret during integration.</p>
          </div>
        </Section>
      </div>
    </>
  );
}
