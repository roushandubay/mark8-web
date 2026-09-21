'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Monitor, Plus, Smartphone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { confirmDelete, Field, Loading, MediaField, PageHeader, Section, Select, StatusPill, Toggle } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errorText } from '@/lib/admin';
import { img } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Banner } from '@/lib/types';
import { useAsync } from '@/lib/use-async';

const toLocal = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);

/**
 * Offer banners. Each has separate desktop (wide, 21:9) and mobile (tall, 4:5)
 * artwork — an image or a short video — and can show on the website, the app, or both.
 */
export default function Banners() {
  const banners = useAsync(async () => {
    const { data, error } = await supabase.from('banners').select('*').order('sort_order');
    if (error) throw error;
    return data as Banner[];
  }, []);
  const cols = useAsync(async () => (await supabase.from('collections').select('slug, name').order('sort_order')).data ?? [], []);
  const [open, setOpen] = useState<string | null>(null);
  const list = banners.data ?? [];

  const patch = async (b: Banner, p: Partial<Banner>) => {
    banners.setData(list.map((x) => (x.id === b.id ? { ...x, ...p } : x)));
    const { error } = await supabase.from('banners').update(p).eq('id', b.id);
    if (error) toast.error(errorText(error));
  };
  const add = async () => {
    const { data, error } = await supabase
      .from('banners')
      .insert({ title: 'New offer', cta: 'Shop now', sort_order: list.length, is_active: false })
      .select('*')
      .single();
    if (error) return toast.error(errorText(error));
    banners.setData([...list, data as Banner]);
    setOpen(data.id);
  };
  const remove = async (b: Banner) => {
    if (!confirmDelete(`the banner “${b.title ?? ''}”`)) return;
    const { error } = await supabase.from('banners').delete().eq('id', b.id);
    if (error) return toast.error(errorText(error));
    banners.setData(list.filter((x) => x.id !== b.id));
  };
  const move = async (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    banners.setData(next);
    await Promise.all(next.map((b, n) => supabase.from('banners').update({ sort_order: n }).eq('id', b.id)));
  };

  if (banners.loading) return <Loading />;
  const colOptions = (cols.data ?? []).map((c) => ({ value: c.slug, label: c.name }));

  return (
    <>
      <PageHeader
        title="Offer banners"
        subtitle="Separate artwork for desktop and mobile. Images or short videos (under 50 MB)."
        actions={<Button className="h-9 gap-1.5" onClick={add}><Plus className="size-4" /> New banner</Button>}
      />
      <div className="space-y-3">
        {list.map((b, i) => {
          const expanded = open === b.id;
          const thumb = b.desktop_media_type === 'image' ? b.desktop_media_url : b.poster_url;
          return (
            <div key={b.id} className="rounded-2xl border border-border bg-white">
              <div className="flex items-center gap-3 p-3">
                <span className="h-12 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {thumb ? <img src={img(thumb, 200)} alt="" className="h-full w-full object-cover" /> : null}
                </span>
                <button onClick={() => setOpen(expanded ? null : b.id)} className="flex-1 text-left">
                  <p className="text-sm font-semibold">{b.title || 'Untitled banner'}</p>
                  <p className="text-xs text-muted-foreground">
                    {[b.show_on_web && 'Website', b.show_on_app && 'App'].filter(Boolean).join(' + ') || 'Nowhere'}
                  </p>
                </button>
                <StatusPill on={b.is_active} />
                <Button variant="ghost" size="icon-sm" onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp /></Button>
                <Button variant="ghost" size="icon-sm" onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown /></Button>
                <Button variant="ghost" size="icon-sm" onClick={() => remove(b)} aria-label="Delete banner"><Trash2 /></Button>
              </div>

              {expanded && (
                <div className="space-y-6 border-t border-border p-4">
                  <div className="grid gap-5 md:grid-cols-[2fr_1fr]">
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Monitor className="size-3.5" /> Desktop · 21:9
                      </p>
                      <MediaField
                        label="Desktop image or video"
                        value={b.desktop_media_url}
                        kind={b.desktop_media_type}
                        onKind={(k) => patch(b, { desktop_media_type: k })}
                        onChange={(url) => patch(b, { desktop_media_url: url || null })}
                        folder="banners"
                        accept="image/*,video/mp4,video/webm"
                        aspect="aspect-[21/9]"
                      />
                    </div>
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <Smartphone className="size-3.5" /> Mobile · 4:5
                      </p>
                      <MediaField
                        label="Mobile image or video"
                        value={b.mobile_media_url}
                        kind={b.mobile_media_type}
                        onKind={(k) => patch(b, { mobile_media_type: k })}
                        onChange={(url) => patch(b, { mobile_media_url: url || null })}
                        folder="banners"
                        accept="image/*,video/mp4,video/webm"
                        aspect="aspect-[4/5]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 md:grid-cols-3">
                    <div className="space-y-4 md:col-span-2">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Headline">
                          <Input defaultValue={b.title ?? ''} onBlur={(e) => patch(b, { title: e.target.value || null })} />
                        </Field>
                        <Field label="Button text">
                          <Input defaultValue={b.cta ?? ''} onBlur={(e) => patch(b, { cta: e.target.value || null })} />
                        </Field>
                        <Field label="Subtitle" className="md:col-span-2">
                          <Input defaultValue={b.subtitle ?? ''} onBlur={(e) => patch(b, { subtitle: e.target.value || null })} />
                        </Field>
                        <Field label="Opens collection">
                          <Select value={b.link_collection ?? ''} onChange={(v) => patch(b, { link_collection: v || null, link_url: null, link_path: null })} options={colOptions} placeholder="—" />
                        </Field>
                        <Field label="…or a web link" hint="Overrides the collection.">
                          <Input defaultValue={b.link_url ?? ''} placeholder="https://" onBlur={(e) => patch(b, { link_url: e.target.value || null })} />
                        </Field>
                        <Field label="Text colour" hint="Light text for dark artwork.">
                          <Select value={b.text_color} onChange={(v) => patch(b, { text_color: v as Banner['text_color'] })} options={[{ value: 'light', label: 'Light (white)' }, { value: 'dark', label: 'Dark' }]} />
                        </Field>
                        <div />
                        <Field label="Start" hint="Optional">
                          <Input type="datetime-local" defaultValue={toLocal(b.starts_at)} onBlur={(e) => patch(b, { starts_at: fromLocal(e.target.value) })} />
                        </Field>
                        <Field label="End" hint="Optional — hides itself after this.">
                          <Input type="datetime-local" defaultValue={toLocal(b.ends_at)} onBlur={(e) => patch(b, { ends_at: fromLocal(e.target.value) })} />
                        </Field>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Toggle label="Live" checked={b.is_active} onChange={(v) => patch(b, { is_active: v })} />
                      <Toggle label="On the website" checked={b.show_on_web} onChange={(v) => patch(b, { show_on_web: v })} />
                      <Toggle label="In the app" checked={b.show_on_app} onChange={(v) => patch(b, { show_on_app: v })} hint="The app shows the mobile artwork." />
                      <MediaField label="Video still (poster)" value={b.poster_url} onChange={(url) => patch(b, { poster_url: url || null })} folder="banners" aspect="aspect-[4/5]" hint="Shown while a video loads, and in the app for video banners." />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!list.length && (
          <Section>
            <p className="py-8 text-center text-sm text-muted-foreground">No banners yet.</p>
          </Section>
        )}
      </div>
    </>
  );
}
