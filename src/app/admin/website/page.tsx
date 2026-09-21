'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Field, Loading, MediaField, PageHeader, Section, Select } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { errorText } from '@/lib/admin';
import { supabase } from '@/lib/supabase';
import type { SiteContent } from '@/lib/types';

/** Everything on the public website that isn't a product or banner. */
export default function Website() {
  const [site, setSite] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('store_settings')
      .select('site')
      .eq('id', 1)
      .single()
      .then(({ data, error }) => {
        if (error) toast.error(errorText(error));
        setSite((data?.site as SiteContent) ?? {});
      });
  }, []);

  const set = <K extends keyof SiteContent>(k: K, v: SiteContent[K]) => setSite((s) => ({ ...s!, [k]: v }));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('store_settings').update({ site, updated_at: new Date().toISOString() }).eq('id', 1);
    setSaving(false);
    if (error) return toast.error(errorText(error));
    toast.success('Website updated — live now');
  };

  if (!site) return <Loading />;
  const features = site.features ?? [];

  return (
    <>
      <PageHeader
        title="Website"
        subtitle="Hero, lookbook, download link and legal pages. Save to publish."
        actions={
          <>
            <a href="/" target="_blank" className="text-sm text-muted-foreground hover:text-foreground">
              Open website ↗
            </a>
            <Button className="h-9 px-4" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null} Save
            </Button>
          </>
        }
      />
      <div className="space-y-6">
        <Section title="Hero" description="Full-screen video with the big MARK8 logo over it.">
          <div className="grid gap-5 md:grid-cols-2">
            <MediaField
              label="Background video"
              value={site.hero_video}
              onChange={(url) => set('hero_video', url)}
              folder="website"
              accept="video/mp4,video/webm"
              kind="video"
              hint="MP4, under 50 MB. 10–20 seconds, muted, loops. Men & women fashion works best."
            />
            <MediaField label="Fallback image" value={site.hero_image} onChange={(url) => set('hero_image', url)} folder="website" hint="Shown while the video loads, and if there’s no video." />
            <Field label="Word on the left">
              <Input value={site.hero_word_left ?? ''} onChange={(e) => set('hero_word_left', e.target.value)} placeholder="Menswear" />
            </Field>
            <Field label="Word on the right">
              <Input value={site.hero_word_right ?? ''} onChange={(e) => set('hero_word_right', e.target.value)} placeholder="Womenswear" />
            </Field>
            <Field label="Colour wash over the video">
              <Select
                value={site.hero_overlay ?? 'brand'}
                onChange={(v) => set('hero_overlay', v as SiteContent['hero_overlay'])}
                options={[
                  { value: 'brand', label: 'Brand (soft violet)' },
                  { value: 'dark', label: 'Dark' },
                ]}
              />
            </Field>
            <Field label="Line under the logo (optional)">
              <Input value={site.hero_subtitle ?? ''} onChange={(e) => set('hero_subtitle', e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Lookbook" description="The scroll section where product photos fly out of a stack.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Headline">
              <Input value={site.lookbook_title ?? ''} onChange={(e) => set('lookbook_title', e.target.value)} placeholder="Dressed with intent." />
            </Field>
            <Field label="Sub-line">
              <Input value={site.lookbook_subtitle ?? ''} onChange={(e) => set('lookbook_subtitle', e.target.value)} />
            </Field>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Photos come from the Trending collection — change them under Collections.</p>
        </Section>

        <Section title="App download" description="Used by every “Get the app” button and the QR code.">
          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <Field label="APK download link" hint="Paste the link from the Expo build page. Leave empty to show “coming soon”.">
              <Input value={site.apk_url ?? ''} onChange={(e) => set('apk_url', e.target.value)} placeholder="https://expo.dev/artifacts/…apk" />
            </Field>
            <Field label="Version shown">
              <Input value={site.app_version ?? ''} onChange={(e) => set('app_version', e.target.value)} placeholder="1.0.0" />
            </Field>
          </div>
        </Section>

        <Section
          title="Promises"
          description="The three small cards near the bottom of the home page."
          actions={
            <Button variant="outline" className="h-8 gap-1.5" onClick={() => set('features', [...features, { title: '', body: '' }])}>
              <Plus className="size-3.5" /> Add
            </Button>
          }
        >
          <div className="space-y-3">
            {features.map((f, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
                <Input value={f.title} placeholder="Title" onChange={(e) => set('features', features.map((x, n) => (n === i ? { ...x, title: e.target.value } : x)))} />
                <Input value={f.body} placeholder="One line" onChange={(e) => set('features', features.map((x, n) => (n === i ? { ...x, body: e.target.value } : x)))} />
                <Button variant="ghost" size="icon" onClick={() => set('features', features.filter((_, n) => n !== i))} aria-label="Remove">
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Legal pages" description="Needed for Google sign-in publishing. Separate paragraphs with a blank line.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Privacy policy">
              <Textarea rows={12} value={site.privacy ?? ''} onChange={(e) => set('privacy', e.target.value)} />
            </Field>
            <Field label="Terms of use">
              <Textarea rows={12} value={site.terms ?? ''} onChange={(e) => set('terms', e.target.value)} />
            </Field>
          </div>
        </Section>
      </div>
    </>
  );
}
