'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Field, Loading, PageHeader, Section } from '@/components/admin/ui';
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
};

/** Shipping, delivery and returns rules — used by the app, the website and the checkout itself. */
export default function StoreSettings() {
  const [s, setS] = useState<S | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('store_settings')
      .select('free_shipping_from, shipping_fee, delivery_days_min, delivery_days_max, return_days, support_email, support_phone')
      .eq('id', 1)
      .single()
      .then(({ data, error }) => {
        if (error) toast.error(errorText(error));
        if (data) setS({ ...data, free_shipping_from: Number(data.free_shipping_from), shipping_fee: Number(data.shipping_fee) });
      });
  }, []);

  const num = (k: keyof S) => (e: React.ChangeEvent<HTMLInputElement>) => setS((x) => ({ ...x!, [k]: Math.max(0, Number(e.target.value) || 0) }));

  const save = async () => {
    if (!s) return;
    if (s.delivery_days_max < s.delivery_days_min) return toast.error('Latest delivery day can’t be before the earliest.');
    setSaving(true);
    const { error } = await supabase
      .from('store_settings')
      .update({ ...s, support_email: s.support_email || null, support_phone: s.support_phone || null, updated_at: new Date().toISOString() })
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
      </div>
    </>
  );
}
