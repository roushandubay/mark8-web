'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { confirmDelete, Loading, MediaField, PageHeader, Section, Toggle } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { errorText } from '@/lib/admin';
import { slugify } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAsync } from '@/lib/use-async';
import { cn } from '@/lib/utils';

type Cat = {
  id: string;
  parent_id: string | null;
  slug: string;
  path: string;
  name: string;
  gender: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

/** Men / Women → departments → categories. Drives the Shop tab and every listing. */
export default function Categories() {
  const cats = useAsync(async () => {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order');
    if (error) throw error;
    return data as Cat[];
  }, []);
  const [selected, setSelected] = useState<string | null>(null);
  const all = useMemo(() => cats.data ?? [], [cats.data]);
  const current = all.find((c) => c.id === selected) ?? null;
  const children = (pid: string | null) => all.filter((c) => c.parent_id === pid).sort((a, b) => a.sort_order - b.sort_order);

  const add = async (parent: Cat | null) => {
    const name = window.prompt(parent ? `New category inside ${parent.name}:` : 'New top-level group (e.g. Kids):')?.trim();
    if (!name) return;
    const slug = slugify(name);
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        slug,
        path: parent ? `${parent.path}/${slug}` : slug,
        parent_id: parent?.id ?? null,
        gender: parent?.gender ?? null,
        sort_order: children(parent?.id ?? null).length,
      })
      .select('*')
      .single();
    if (error) return toast.error(errorText(error));
    cats.setData([...all, data as Cat]);
    setSelected(data.id);
  };

  const patch = async (c: Cat, p: Partial<Cat>) => {
    cats.setData(all.map((x) => (x.id === c.id ? { ...x, ...p } : x)));
    const { error } = await supabase.from('categories').update(p).eq('id', c.id);
    if (error) {
      toast.error(errorText(error));
      cats.reload();
    }
  };

  const move = async (c: Cat, d: number) => {
    const sibs = children(c.parent_id);
    const i = sibs.findIndex((s) => s.id === c.id);
    const j = i + d;
    if (j < 0 || j >= sibs.length) return;
    const other = sibs[j];
    await Promise.all([patch(c, { sort_order: other.sort_order }), patch(other, { sort_order: c.sort_order })]);
  };

  const remove = async (c: Cat) => {
    if (children(c.id).length) return toast.error('Remove or move the categories inside it first.');
    if (!confirmDelete(`the category “${c.name}”`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', c.id);
    if (error) return toast.error(errorText(error));
    cats.setData(all.filter((x) => x.id !== c.id));
    setSelected(null);
  };

  const Node = ({ c, depth }: { c: Cat; depth: number }) => (
    <>
      <button
        onClick={() => setSelected(c.id)}
        className={cn('flex w-full items-center gap-2 rounded-lg py-1.5 pr-2 text-left text-sm transition hover:bg-muted', selected === c.id && 'bg-muted font-medium', !c.is_active && 'text-muted-foreground line-through')}
        style={{ paddingLeft: 8 + depth * 18 }}
      >
        {children(c.id).length ? <ChevronRight className="size-3.5 text-muted-foreground" /> : <span className="w-3.5" />}
        {c.name}
      </button>
      {children(c.id).map((k) => (
        <Node key={k.id} c={k} depth={depth + 1} />
      ))}
    </>
  );

  if (cats.loading) return <Loading />;

  return (
    <>
      <PageHeader title="Categories" subtitle="The Shop tab, filters and listings all follow this tree." actions={<Button className="h-9 gap-1.5" onClick={() => add(null)}><Plus className="size-4" /> Top-level group</Button>} />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Section>
          <div className="max-h-[70vh] overflow-y-auto">
            {children(null).map((c) => (
              <Node key={c.id} c={c} depth={0} />
            ))}
          </div>
        </Section>

        {current ? (
          <Section
            title={current.name}
            description={current.path.split('/').join(' › ')}
            actions={
              <div className="flex gap-1.5">
                <Button variant="outline" size="icon" onClick={() => move(current, -1)} aria-label="Move up"><ArrowUp /></Button>
                <Button variant="outline" size="icon" onClick={() => move(current, 1)} aria-label="Move down"><ArrowDown /></Button>
                <Button variant="outline" className="gap-1.5" onClick={() => add(current)}><Plus className="size-4" /> Inside</Button>
                <Button variant="destructive" size="icon" onClick={() => remove(current)} aria-label="Delete"><Trash2 /></Button>
              </div>
            }
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-medium">Name</span>
                  <Input key={current.id} defaultValue={current.name} onBlur={(e) => e.target.value.trim() && e.target.value !== current.name && patch(current, { name: e.target.value.trim() })} />
                </label>
                <Toggle label="Visible" checked={current.is_active} onChange={(v) => patch(current, { is_active: v })} hint="Hidden categories disappear from the app and website." />
                <p className="text-xs text-muted-foreground">The web address ({current.path}) is fixed so existing links keep working.</p>
              </div>
              <MediaField label="Tile image" value={current.image_url} onChange={(url) => patch(current, { image_url: url || null })} folder="categories" aspect="aspect-[4/5]" />
            </div>
          </Section>
        ) : (
          <Section>
            <p className="py-10 text-center text-sm text-muted-foreground">Pick a category to edit its name, image and visibility.</p>
          </Section>
        )}
      </div>
    </>
  );
}
