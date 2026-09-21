'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { confirmDelete, Field, Loading, MediaField, PageHeader, Section, Select, StatusPill, Toggle } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errorText } from '@/lib/admin';
import { img, slugify } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAsync } from '@/lib/use-async';
import { cn } from '@/lib/utils';

type Col = { id: string; slug: string; name: string; description: string | null; image_url: string | null; kind: string; sort_order: number; is_active: boolean };
type Item = { product_id: string; sort_order: number; products: { name: string; product_images: { url: string; sort_order: number }[] } };

/**
 * New Arrivals, Best Sellers, Trending and style edits (Streetwear, Old Money…).
 * Order here is the order shoppers see.
 */
export default function Collections() {
  const cols = useAsync(async () => {
    const { data, error } = await supabase.from('collections').select('*').order('sort_order');
    if (error) throw error;
    return data as Col[];
  }, []);
  const [sel, setSel] = useState<string | null>(null);
  const current = cols.data?.find((c) => c.id === sel) ?? null;

  const items = useAsync(async () => {
    if (!sel) return [] as Item[];
    const { data, error } = await supabase
      .from('collection_products')
      .select('product_id, sort_order, products(name, product_images(url, sort_order))')
      .eq('collection_id', sel)
      .order('sort_order');
    if (error) throw error;
    return data as unknown as Item[];
  }, [sel]);

  const [search, setSearch] = useState('');
  const results = useAsync(async () => {
    if (search.trim().length < 2) return [];
    const { data } = await supabase.from('products').select('id, name').ilike('name', `%${search.trim()}%`).limit(8);
    return data ?? [];
  }, [search]);

  const patch = async (p: Partial<Col>) => {
    if (!current) return;
    cols.setData(cols.data!.map((c) => (c.id === current.id ? { ...c, ...p } : c)));
    const { error } = await supabase.from('collections').update(p).eq('id', current.id);
    if (error) toast.error(errorText(error));
  };

  const create = async () => {
    const name = window.prompt('Collection name (e.g. Festive Edit):')?.trim();
    if (!name) return;
    const { data, error } = await supabase
      .from('collections')
      .insert({ name, slug: slugify(name), kind: 'edit', sort_order: cols.data?.length ?? 0 })
      .select('*')
      .single();
    if (error) return toast.error(errorText(error));
    cols.setData([...(cols.data ?? []), data as Col]);
    setSel(data.id);
  };

  const remove = async () => {
    if (!current || !confirmDelete(`the collection “${current.name}”`)) return;
    const { error } = await supabase.from('collections').delete().eq('id', current.id);
    if (error) return toast.error(errorText(error));
    cols.setData(cols.data!.filter((c) => c.id !== current.id));
    setSel(null);
  };

  const addProduct = async (pid: string) => {
    if (!sel) return;
    const { error } = await supabase.from('collection_products').insert({ collection_id: sel, product_id: pid, sort_order: items.data?.length ?? 0 });
    if (error) return toast.error(errorText(error));
    setSearch('');
    items.reload();
  };
  const removeProduct = async (pid: string) => {
    const { error } = await supabase.from('collection_products').delete().eq('collection_id', sel!).eq('product_id', pid);
    if (error) return toast.error(errorText(error));
    items.reload();
  };
  const reorder = async (i: number, d: number) => {
    const list = [...(items.data ?? [])];
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    items.setData(list);
    const results = await Promise.all(list.map((it, n) => supabase.from('collection_products').update({ sort_order: n }).eq('collection_id', sel!).eq('product_id', it.product_id)));
    const failed = results.find((r) => r.error);
    if (failed) toast.error(errorText(failed.error));
  };

  if (cols.loading) return <Loading />;

  return (
    <>
      <PageHeader title="Collections" subtitle="Curated edits used on the homepage, in the Shop tab and on the website." actions={<Button className="h-9 gap-1.5" onClick={create}><Plus className="size-4" /> New collection</Button>} />
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Section>
          <ul className="space-y-0.5">
            {cols.data?.map((c) => (
              <li key={c.id}>
                <button onClick={() => setSel(c.id)} className={cn('flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted', sel === c.id && 'bg-muted font-medium')}>
                  {c.name}
                  <span className="text-xs text-muted-foreground">{c.kind}</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>

        {current ? (
          <div className="space-y-6">
            <Section title={current.name} actions={<Button variant="destructive" size="icon" onClick={remove} aria-label="Delete collection"><Trash2 /></Button>}>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-4">
                  <Field label="Name">
                    <Input key={current.id + 'n'} defaultValue={current.name} onBlur={(e) => e.target.value.trim() && patch({ name: e.target.value.trim() })} />
                  </Field>
                  <Field label="Type" hint="“Style” edits appear as Trending styles chips.">
                    <Select value={current.kind} onChange={(v) => patch({ kind: v })} options={[{ value: 'edit', label: 'Edit (New in, Best sellers…)' }, { value: 'style', label: 'Style (Streetwear, Old Money…)' }, { value: 'campaign', label: 'Campaign' }]} />
                  </Field>
                  <Field label="Short description">
                    <Input key={current.id + 'd'} defaultValue={current.description ?? ''} onBlur={(e) => patch({ description: e.target.value || null })} />
                  </Field>
                  <Toggle label="Live" checked={current.is_active} onChange={(v) => patch({ is_active: v })} />
                  <p className="text-xs text-muted-foreground">Link name: {current.slug} <StatusPill on={current.is_active} /></p>
                </div>
                <MediaField label="Cover image" value={current.image_url} onChange={(url) => patch({ image_url: url || null })} folder="collections" aspect="aspect-[4/3]" />
              </div>
            </Section>

            <Section title="Products in this collection" description="Top to bottom is the order shoppers see.">
              <div className="relative mb-4">
                <Input placeholder="Add a product — type its name" value={search} onChange={(e) => setSearch(e.target.value)} />
                {results.data && results.data.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg">
                    {results.data.map((p) => (
                      <li key={p.id}>
                        <button onClick={() => addProduct(p.id)} className="w-full px-3 py-2 text-left text-sm hover:bg-muted">
                          {p.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {items.loading ? (
                <Loading />
              ) : (
                <ul className="divide-y divide-border">
                  {items.data?.map((it, i) => {
                    const cover = [...it.products.product_images].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
                    return (
                      <li key={it.product_id} className="flex items-center gap-3 py-2.5">
                        <span className="w-6 text-center text-xs text-muted-foreground">{i + 1}</span>
                        <span className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {cover ? <img src={img(cover, 80)} alt="" className="h-full w-full object-cover" /> : null}
                        </span>
                        <span className="flex-1 truncate text-sm font-medium">{it.products.name}</span>
                        <Button variant="ghost" size="icon-sm" onClick={() => reorder(i, -1)} aria-label="Move up"><ArrowUp /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => reorder(i, 1)} aria-label="Move down"><ArrowDown /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => removeProduct(it.product_id)} aria-label="Remove"><X /></Button>
                      </li>
                    );
                  })}
                  {!items.data?.length && <li className="py-8 text-center text-sm text-muted-foreground">No products yet — add some above.</li>}
                </ul>
              )}
            </Section>
          </div>
        ) : (
          <Section>
            <p className="py-10 text-center text-sm text-muted-foreground">Pick a collection to edit it and its products.</p>
          </Section>
        )}
      </div>
    </>
  );
}
