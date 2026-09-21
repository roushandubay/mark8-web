'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

import { confirmDelete, Empty, Loading, PageHeader, Select } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { errorText } from '@/lib/admin';
import { fmtDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAsync } from '@/lib/use-async';
import { cn } from '@/lib/utils';

type R = { id: string; author_name: string; rating: number; title: string | null; body: string; status: string; created_at: string; products: { name: string } | null };

export default function Reviews() {
  const [status, setStatus] = useState('pending');
  const reviews = useAsync(async () => {
    let q = supabase.from('reviews').select('id, author_name, rating, title, body, status, created_at, products(name)').order('created_at', { ascending: false }).limit(200);
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    return data as unknown as R[];
  }, [status]);

  const setStatusOf = async (r: R, s: string) => {
    const { error } = await supabase.from('reviews').update({ status: s }).eq('id', r.id);
    if (error) return toast.error(errorText(error));
    toast.success(s === 'published' ? 'Published' : 'Hidden');
    reviews.reload();
  };
  const remove = async (r: R) => {
    if (!confirmDelete('this review')) return;
    const { error } = await supabase.from('reviews').delete().eq('id', r.id);
    if (error) return toast.error(errorText(error));
    reviews.reload();
  };

  return (
    <>
      <PageHeader
        title="Reviews"
        subtitle="Only published reviews show in the app. Ratings update automatically."
        actions={<Select value={status} onChange={setStatus} placeholder="All" options={[{ value: 'pending', label: 'Waiting' }, { value: 'published', label: 'Published' }, { value: 'rejected', label: 'Hidden' }]} className="w-40" />}
      />
      {reviews.loading ? (
        <Loading />
      ) : !reviews.data?.length ? (
        <Empty>Nothing here.</Empty>
      ) : (
        <div className="space-y-3">
          {reviews.data.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-white p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-semibold">{r.author_name}</span>
                <span className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={cn('size-3.5', n <= r.rating ? 'fill-foreground' : 'text-muted-foreground')} />
                  ))}
                </span>
                <span className="text-muted-foreground">on {r.products?.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{fmtDate(r.created_at)}</span>
              </div>
              {r.title ? <p className="mt-2 font-medium">{r.title}</p> : null}
              <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
              <div className="mt-4 flex gap-2">
                {r.status !== 'published' && <Button className="h-8" onClick={() => setStatusOf(r, 'published')}>Publish</Button>}
                {r.status !== 'rejected' && <Button variant="outline" className="h-8" onClick={() => setStatusOf(r, 'rejected')}>Hide</Button>}
                <Button variant="ghost" className="h-8 text-destructive" onClick={() => remove(r)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
