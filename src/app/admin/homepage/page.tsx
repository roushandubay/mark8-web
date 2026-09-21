'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { confirmDelete, Field, Loading, MediaField, PageHeader, Section, Select, StatusPill, Toggle } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errorText } from '@/lib/admin';
import { supabase } from '@/lib/supabase';
import { useAsync } from '@/lib/use-async';

type Sec = {
  id: string;
  type: 'hero' | 'categories' | 'products' | 'stack' | 'styles' | 'banners';
  title: string | null;
  subtitle: string | null;
  config: Record<string, unknown>;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

const TYPES: { value: Sec['type']; label: string; hint: string }[] = [
  { value: 'hero', label: 'Hero banner', hint: 'Big photo with a headline and button.' },
  { value: 'banners', label: 'Offer banners', hint: 'Swipeable offers — managed under Offer banners.' },
  { value: 'categories', label: 'Shop by category', hint: 'Row of category pills.' },
  { value: 'stack', label: 'Shape showcase', hint: 'The animated numbered list — best for New arrivals / Best sellers.' },
  { value: 'products', label: 'Product grid', hint: 'Four products from a collection.' },
  { value: 'styles', label: 'Trending styles', hint: 'Chips for every “style” collection.' },
];

const toLocal = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);

/** The app's Home screen, section by section. Order here = order in the app. */
export default function Homepage() {
  const secs = useAsync(async () => {
    const { data, error } = await supabase.from('homepage_sections').select('*').order('sort_order');
    if (error) throw error;
    return data as Sec[];
  }, []);
  const cols = useAsync(async () => (await supabase.from('collections').select('slug, name').order('sort_order')).data ?? [], []);
  const [open, setOpen] = useState<string | null>(null);
  const list = secs.data ?? [];

  const patch = async (s: Sec, p: Partial<Sec>) => {
    secs.setData(list.map((x) => (x.id === s.id ? { ...x, ...p } : x)));
    const { error } = await supabase.from('homepage_sections').update(p).eq('id', s.id);
    if (error) toast.error(errorText(error));
  };
  const setCfg = (s: Sec, k: string, v: unknown) => patch(s, { config: { ...s.config, [k]: v } });

  const move = async (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    secs.setData(next.map((s, n) => ({ ...s, sort_order: n })));
    await Promise.all(next.map((s, n) => supabase.from('homepage_sections').update({ sort_order: n }).eq('id', s.id)));
  };

  const add = async (type: Sec['type']) => {
    const defaults: Record<Sec['type'], Record<string, unknown>> = {
      hero: { image: '', eyebrow: '', cta: 'Shop now', collection: 'new-arrivals' },
      banners: {},
      categories: { items: [] },
      stack: { collection: 'new-arrivals', limit: 4 },
      products: { collection: 'trending', limit: 4 },
      styles: {},
    };
    const { data, error } = await supabase
      .from('homepage_sections')
      .insert({ type, title: TYPES.find((t) => t.value === type)!.label, config: defaults[type], sort_order: list.length, is_active: false })
      .select('*')
      .single();
    if (error) return toast.error(errorText(error));
    secs.setData([...list, data as Sec]);
    setOpen(data.id);
    toast.success('Section added (hidden until you switch it on)');
  };

  const remove = async (s: Sec) => {
    if (!confirmDelete(`the “${s.title ?? s.type}” section`)) return;
    const { error } = await supabase.from('homepage_sections').delete().eq('id', s.id);
    if (error) return toast.error(errorText(error));
    secs.setData(list.filter((x) => x.id !== s.id));
  };

  if (secs.loading) return <Loading />;
  const colOptions = (cols.data ?? []).map((c) => ({ value: c.slug, label: c.name }));

  return (
    <>
      <PageHeader
        title="App homepage"
        subtitle="Add, remove, reorder and schedule the sections on the app’s Home screen. Changes appear the next time the app refreshes."
        actions={<Select value="" onChange={(v) => v && add(v as Sec['type'])} placeholder="+ Add section…" options={TYPES.map((t) => ({ value: t.value, label: t.label }))} className="w-48" />}
      />
      <div className="space-y-3">
        {list.map((s, i) => {
          const type = TYPES.find((t) => t.value === s.type);
          const expanded = open === s.id;
          const items = (s.config.items as { label: string; path?: string; segment?: string; image: string }[] | undefined) ?? [];
          return (
            <div key={s.id} className="rounded-2xl border border-border bg-white">
              <div className="flex items-center gap-2 p-3 pl-4">
                <span className="w-5 text-xs text-muted-foreground">{i + 1}</span>
                <button onClick={() => setOpen(expanded ? null : s.id)} className="flex-1 text-left">
                  <p className="text-sm font-semibold">{s.title || type?.label}</p>
                  <p className="text-xs text-muted-foreground">{type?.label}</p>
                </button>
                <StatusPill on={s.is_active} />
                <Button variant="ghost" size="icon-sm" onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp /></Button>
                <Button variant="ghost" size="icon-sm" onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown /></Button>
                <Button variant="ghost" size="icon-sm" onClick={() => remove(s)} aria-label="Delete section"><Trash2 /></Button>
              </div>

              {expanded && (
                <div className="grid gap-5 border-t border-border p-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <Toggle label="Show in app" checked={s.is_active} onChange={(v) => patch(s, { is_active: v })} />
                    <Field label="Title">
                      <Input defaultValue={s.title ?? ''} onBlur={(e) => patch(s, { title: e.target.value })} />
                    </Field>
                    {s.type === 'hero' && (
                      <>
                        <Field label="Subtitle">
                          <Input defaultValue={s.subtitle ?? ''} onBlur={(e) => patch(s, { subtitle: e.target.value || null })} />
                        </Field>
                        <Field label="Small line above the title">
                          <Input defaultValue={(s.config.eyebrow as string) ?? ''} onBlur={(e) => setCfg(s, 'eyebrow', e.target.value)} />
                        </Field>
                        <Field label="Button text">
                          <Input defaultValue={(s.config.cta as string) ?? ''} onBlur={(e) => setCfg(s, 'cta', e.target.value)} />
                        </Field>
                        <Field label="Opens collection">
                          <Select value={(s.config.collection as string) ?? ''} onChange={(v) => setCfg(s, 'collection', v)} options={colOptions} placeholder="—" />
                        </Field>
                      </>
                    )}
                    {(s.type === 'products' || s.type === 'stack') && (
                      <>
                        <Toggle label="Personalised" checked={!!s.config.personalised} onChange={(v) => setCfg(s, 'personalised', v)} hint="Shows the shopper’s own Men/Women picks instead of a collection." />
                        {!s.config.personalised && (
                          <Field label="Collection">
                            <Select value={(s.config.collection as string) ?? ''} onChange={(v) => setCfg(s, 'collection', v)} options={colOptions} placeholder="—" />
                          </Field>
                        )}
                        <Field label="How many products">
                          <Input type="number" min={2} max={12} defaultValue={String(s.config.limit ?? 4)} onBlur={(e) => setCfg(s, 'limit', Math.max(2, Math.min(12, Number(e.target.value) || 4)))} />
                        </Field>
                      </>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Show from" hint="Optional">
                        <Input type="datetime-local" defaultValue={toLocal(s.starts_at)} onBlur={(e) => patch(s, { starts_at: fromLocal(e.target.value) })} />
                      </Field>
                      <Field label="Hide after" hint="Optional">
                        <Input type="datetime-local" defaultValue={toLocal(s.ends_at)} onBlur={(e) => patch(s, { ends_at: fromLocal(e.target.value) })} />
                      </Field>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">{type?.hint}</p>
                    {s.type === 'hero' && (
                      <MediaField label="Image" value={s.config.image as string} onChange={(url) => setCfg(s, 'image', url)} folder="home" aspect="aspect-[4/5]" />
                    )}
                    {s.type === 'categories' && (
                      <div className="space-y-3">
                        {items.map((it, n) => (
                          <div key={n} className="rounded-xl border border-border p-3">
                            <div className="grid grid-cols-[72px_1fr] gap-3">
                              <MediaField label="" value={it.image} onChange={(url) => setCfg(s, 'items', items.map((x, k) => (k === n ? { ...x, image: url } : x)))} folder="home" aspect="aspect-square" />
                              <div className="space-y-2">
                                <Input defaultValue={it.label} placeholder="Label" onBlur={(e) => setCfg(s, 'items', items.map((x, k) => (k === n ? { ...x, label: e.target.value } : x)))} />
                                <Input defaultValue={it.path ?? it.segment ?? ''} placeholder="men · women/clothing · footwear" onBlur={(e) => {
                                  const v = e.target.value.trim();
                                  const isSegment = v && !v.includes('/') && v !== 'men' && v !== 'women';
                                  setCfg(s, 'items', items.map((x, k) => (k === n ? { label: x.label, image: x.image, ...(isSegment ? { segment: v } : { path: v }) } : x)));
                                }} />
                                <button className="text-xs text-destructive" onClick={() => setCfg(s, 'items', items.filter((_, k) => k !== n))}>Remove</button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" className="h-8 gap-1.5" onClick={() => setCfg(s, 'items', [...items, { label: 'New', path: 'women', image: '' }])}>
                          <Plus className="size-3.5" /> Category pill
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
