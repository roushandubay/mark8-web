'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { confirmDelete, Field, Loading, PageHeader, Section, Select, Toggle } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { errorText, SIZE_PRESETS, uploadMedia } from '@/lib/admin';
import { img, slugify } from '@/lib/format';
import { supabase } from '@/lib/supabase';

type ProductForm = {
  name: string;
  slug: string;
  description: string;
  label_id: string;
  category_id: string;
  gender: string;
  price: string;
  mrp: string;
  material: string;
  fit: string;
  care: string;
  occasion: string;
  tags: string;
  is_active: boolean;
};

type ImageRow = { id?: string; url: string };
type VariantRow = {
  id?: string;
  sku?: string;
  color_name: string;
  color_hex: string;
  size_label: string;
  size_in: string;
  size_uk: string;
  size_us: string;
  stock: string;
  price_override: string;
  is_active: boolean;
};

const EMPTY: ProductForm = {
  name: '',
  slug: '',
  description: '',
  label_id: '',
  category_id: '',
  gender: 'women',
  price: '',
  mrp: '',
  material: '',
  fit: '',
  care: '',
  occasion: '',
  tags: '',
  is_active: true,
};

function Editor() {
  const id = useSearchParams().get('id') ?? 'new';
  const isNew = id === 'new';
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProductForm>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [images, setImages] = useState<ImageRow[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [removedVariants, setRemovedVariants] = useState<string[]>([]);
  const [cats, setCats] = useState<{ id: string; path: string; name: string; gender: string | null }[]>([]);
  const [labels, setLabels] = useState<{ id: string; name: string }[]>([]);
  const [collections, setCollections] = useState<{ id: string; name: string; kind: string }[]>([]);
  const [inCollections, setInCollections] = useState<Set<string>>(new Set());
  const [origCollections, setOrigCollections] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const [c, l, col] = await Promise.all([
        supabase.from('categories').select('id, path, name, gender').order('path'),
        supabase.from('labels').select('id, name').order('name'),
        supabase.from('collections').select('id, name, kind').order('sort_order'),
      ]);
      setCats(c.data ?? []);
      setLabels(l.data ?? []);
      setCollections(col.data ?? []);
      if (!isNew) {
        const { data: p, error } = await supabase
          .from('products')
          .select('*, product_images(id, url, sort_order), product_variants(*), collection_products(collection_id)')
          .eq('id', id)
          .single();
        if (error || !p) {
          toast.error('Product not found');
          return router.replace('/admin/products/');
        }
        setForm({
          name: p.name,
          slug: p.slug,
          description: p.description ?? '',
          label_id: p.label_id ?? '',
          category_id: p.category_id,
          gender: p.gender,
          price: String(p.price),
          mrp: String(p.mrp),
          material: p.material ?? '',
          fit: p.fit ?? '',
          care: p.care ?? '',
          occasion: p.occasion ?? '',
          tags: (p.tags ?? []).join(', '),
          is_active: p.is_active,
        });
        setImages([...(p.product_images as { id: string; url: string; sort_order: number }[])].sort((a, b) => a.sort_order - b.sort_order).map(({ id, url }) => ({ id, url })));
        setVariants(
          [...(p.product_variants as (VariantRow & { size_order: number; stock: number; price_override: number | null })[])]
            .sort((a, b) => a.color_name.localeCompare(b.color_name) || a.size_order - b.size_order)
            .map((v) => ({
              id: v.id,
              sku: v.sku,
              color_name: v.color_name,
              color_hex: v.color_hex,
              size_label: v.size_label,
              size_in: v.size_in ?? '',
              size_uk: v.size_uk ?? '',
              size_us: v.size_us ?? '',
              stock: String(v.stock),
              price_override: v.price_override != null ? String(v.price_override) : '',
              is_active: v.is_active,
            })),
        );
        const set = new Set((p.collection_products as { collection_id: string }[]).map((c) => c.collection_id));
        setInCollections(set);
        setOrigCollections(new Set(set));
      }
      setLoading(false);
    })();
  }, [id, isNew, router]);

  const set = <K extends keyof ProductForm>(k: K, v: ProductForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const leafCats = useMemo(() => cats.filter((c) => !cats.some((d) => d.path.startsWith(c.path + '/'))), [cats]);

  const colours = useMemo(() => {
    const m = new Map<string, string>();
    variants.forEach((v) => m.set(v.color_name, v.color_hex));
    return [...m];
  }, [variants]);

  /* images */
  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        const url = await uploadMedia(f, 'products');
        setImages((xs) => [...xs, { url }]);
      }
      toast.success('Photos added');
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };
  const moveImage = (i: number, d: number) =>
    setImages((xs) => {
      const j = i + d;
      if (j < 0 || j >= xs.length) return xs;
      const copy = [...xs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  const removeImage = (i: number) =>
    setImages((xs) => {
      const r = xs[i];
      if (r.id) setRemovedImages((ids) => [...ids, r.id!]);
      return xs.filter((_, n) => n !== i);
    });

  /* variants */
  const setVariant = (i: number, patch: Partial<VariantRow>) => setVariants((vs) => vs.map((v, n) => (n === i ? { ...v, ...patch } : v)));
  const removeVariant = (i: number) =>
    setVariants((vs) => {
      const r = vs[i];
      if (r.id) setRemovedVariants((ids) => [...ids, r.id!]);
      return vs.filter((_, n) => n !== i);
    });
  const addColour = () => {
    const name = window.prompt('Colour name (e.g. Black, Olive):')?.trim();
    if (!name) return;
    const template = variants.filter((v) => v.color_name === colours[0]?.[0]);
    const sizes = template.length ? template : [{ size_label: 'One Size', size_in: 'One Size', size_uk: 'One Size', size_us: 'One Size' } as VariantRow];
    setVariants((vs) => [
      ...vs,
      ...sizes.map((s) => ({ color_name: name, color_hex: '#1d1e20', size_label: s.size_label, size_in: s.size_in, size_uk: s.size_uk, size_us: s.size_us, stock: '0', price_override: '', is_active: true })),
    ]);
  };
  const applyPreset = (colour: string, preset: string) => {
    const sizes = SIZE_PRESETS[preset];
    if (!sizes) return;
    const hex = variants.find((v) => v.color_name === colour)?.color_hex ?? '#1d1e20';
    setVariants((vs) => {
      const others = vs.filter((v) => v.color_name !== colour);
      vs.filter((v) => v.color_name === colour && v.id).forEach((v) => setRemovedVariants((ids) => [...ids, v.id!]));
      return [...others, ...sizes.map((s) => ({ color_name: colour, color_hex: hex, size_label: s.label, size_in: s.in, size_uk: s.uk, size_us: s.us, stock: '10', price_override: '', is_active: true }))];
    });
  };
  const renameColour = (from: string, to: string) => setVariants((vs) => vs.map((v) => (v.color_name === from ? { ...v, color_name: to } : v)));
  const recolour = (name: string, hex: string) => setVariants((vs) => vs.map((v) => (v.color_name === name ? { ...v, color_hex: hex } : v)));

  /* save */
  const save = async () => {
    const price = Number(form.price);
    const mrp = Number(form.mrp || form.price);
    if (!form.name.trim()) return toast.error('Give the product a name');
    if (!form.category_id) return toast.error('Choose a category');
    if (!(price >= 0) || !(mrp >= price)) return toast.error('Price must be a number, and MRP can’t be below the price');
    if (!variants.length) return toast.error('Add at least one colour and size');

    setSaving(true);
    try {
      const row = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description,
        label_id: form.label_id || null,
        category_id: form.category_id,
        gender: form.gender,
        price,
        mrp,
        material: form.material || null,
        fit: form.fit || null,
        care: form.care || null,
        occasion: form.occasion || null,
        tags: form.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      };
      const res = isNew
        ? await supabase.from('products').insert(row).select('id').single()
        : await supabase.from('products').update(row).eq('id', id).select('id').single();
      if (res.error) throw res.error;
      const pid = res.data.id as string;

      if (removedImages.length) {
        const r = await supabase.from('product_images').delete().in('id', removedImages);
        if (r.error) throw r.error;
      }
      for (const [n, im] of images.entries()) {
        const r = im.id
          ? await supabase.from('product_images').update({ url: im.url, sort_order: n }).eq('id', im.id)
          : await supabase.from('product_images').insert({ product_id: pid, url: im.url, sort_order: n });
        if (r.error) throw r.error;
      }

      if (removedVariants.length) {
        const r = await supabase.from('product_variants').delete().in('id', removedVariants);
        if (r.error) throw r.error;
      }
      const orderIn = (colour: string) => variants.filter((v) => v.color_name === colour);
      for (const v of variants) {
        const data = {
          product_id: pid,
          color_name: v.color_name.trim(),
          color_hex: v.color_hex,
          size_label: v.size_label.trim(),
          size_in: v.size_in || v.size_label,
          size_uk: v.size_uk || v.size_label,
          size_us: v.size_us || v.size_label,
          size_order: orderIn(v.color_name).indexOf(v),
          stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
          price_override: v.price_override ? Number(v.price_override) : null,
          is_active: v.is_active,
          sku: v.sku || `M8-${row.slug}-${slugify(v.color_name)}-${slugify(v.size_label)}`.toUpperCase().slice(0, 60),
        };
        const r = v.id ? await supabase.from('product_variants').update(data).eq('id', v.id) : await supabase.from('product_variants').insert(data);
        if (r.error) throw r.error;
      }

      const add = [...inCollections].filter((c) => !origCollections.has(c));
      const drop = [...origCollections].filter((c) => !inCollections.has(c));
      if (add.length) {
        const r = await supabase.from('collection_products').insert(add.map((collection_id) => ({ collection_id, product_id: pid, sort_order: 999 })));
        if (r.error) throw r.error;
      }
      if (drop.length) {
        const r = await supabase.from('collection_products').delete().eq('product_id', pid).in('collection_id', drop);
        if (r.error) throw r.error;
      }

      toast.success(isNew ? 'Product created' : 'Saved — live in the app now');
      if (isNew) router.replace(`/admin/product/?id=${pid}`);
      else window.location.reload();
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete(`“${form.name}”`)) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return toast.error(errorText(error) + ' Tip: hide it instead.');
    toast.success('Product deleted');
    router.replace('/admin/products/');
  };

  const newLabel = async () => {
    const name = window.prompt('New house label (e.g. MARK8 Studio):')?.trim();
    if (!name) return;
    const { data, error } = await supabase.from('labels').insert({ name, slug: slugify(name) }).select('id, name').single();
    if (error) return toast.error(errorText(error));
    setLabels((ls) => [...ls, data]);
    set('label_id', data.id);
  };

  if (loading) return <Loading />;

  return (
    <>
      <Link href="/admin/products/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Products
      </Link>
      <PageHeader
        title={isNew ? 'New product' : form.name || 'Product'}
        actions={
          <>
            {!isNew && (
              <Button variant="destructive" className="h-9" onClick={remove}>
                Delete
              </Button>
            )}
            <Button className="h-9 px-4" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null} Save
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Section title="Details">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name" className="md:col-span-2">
                <Input
                  value={form.name}
                  onChange={(e) => {
                    set('name', e.target.value);
                    if (!slugTouched) set('slug', slugify(e.target.value));
                  }}
                  placeholder="Oversized Cotton T-Shirt"
                />
              </Field>
              <Field label="Web address (slug)" hint="Used in links. Changing it breaks old links.">
                <Input
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set('slug', slugify(e.target.value));
                  }}
                />
              </Field>
              <Field label="House label">
                <div className="flex gap-2">
                  <Select value={form.label_id} onChange={(v) => set('label_id', v)} placeholder="None" options={labels.map((l) => ({ value: l.id, label: l.name }))} />
                  <Button variant="outline" className="h-9" onClick={newLabel}>
                    New
                  </Button>
                </div>
              </Field>
              <Field label="Category">
                <Select
                  value={form.category_id}
                  onChange={(v) => {
                    set('category_id', v);
                    const g = cats.find((c) => c.id === v)?.gender;
                    if (g) set('gender', g);
                  }}
                  placeholder="Choose…"
                  options={leafCats.map((c) => ({ value: c.id, label: c.path.split('/').join(' › ') }))}
                />
              </Field>
              <Field label="For">
                <Select value={form.gender} onChange={(v) => set('gender', v)} options={[{ value: 'women', label: 'Women' }, { value: 'men', label: 'Men' }, { value: 'unisex', label: 'Unisex' }]} />
              </Field>
              <Field label="Description" className="md:col-span-2">
                <Textarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
              </Field>
              <Field label="Material">
                <Input value={form.material} onChange={(e) => set('material', e.target.value)} placeholder="100% cotton" />
              </Field>
              <Field label="Fit">
                <Input value={form.fit} onChange={(e) => set('fit', e.target.value)} placeholder="Oversized" />
              </Field>
              <Field label="Care">
                <Input value={form.care} onChange={(e) => set('care', e.target.value)} placeholder="Machine wash cold" />
              </Field>
              <Field label="Occasion">
                <Input value={form.occasion} onChange={(e) => set('occasion', e.target.value)} placeholder="Casual" />
              </Field>
              <Field label="Search tags" hint="Comma separated — help people find it (e.g. streetwear, linen, summer)." className="md:col-span-2">
                <Input value={form.tags} onChange={(e) => set('tags', e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section
            title="Photos"
            description="First photo is the cover. Drag order with the arrows."
            actions={
              <Button variant="outline" className="h-9 gap-1.5" onClick={() => fileInput.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />} Add photos
              </Button>
            }
          >
            <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
            {images.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {images.map((im, i) => (
                  <div key={im.url + i} className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img(im.url, 400)} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    {i === 0 && <span className="absolute left-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold">Cover</span>}
                    <div className="absolute inset-x-2 bottom-2 flex justify-between opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                      <div className="flex gap-1">
                        <button onClick={() => moveImage(i, -1)} className="grid size-7 place-items-center rounded-md bg-white/90" aria-label="Move earlier">
                          <ArrowUp className="size-3.5 -rotate-90" />
                        </button>
                        <button onClick={() => moveImage(i, 1)} className="grid size-7 place-items-center rounded-md bg-white/90" aria-label="Move later">
                          <ArrowDown className="size-3.5 -rotate-90" />
                        </button>
                      </div>
                      <button onClick={() => removeImage(i)} className="grid size-7 place-items-center rounded-md bg-white/90 text-destructive" aria-label="Remove photo">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <button onClick={() => fileInput.current?.click()} className="grid w-full place-items-center rounded-xl border border-dashed border-border py-12 text-sm text-muted-foreground hover:text-foreground">
                Upload product photos
              </button>
            )}
          </Section>

          <Section
            title="Colours, sizes & stock"
            description="Each colour has its own sizes (India / UK / US) and stock. Set stock to 0 to show a size as sold out."
            actions={
              <Button variant="outline" className="h-9 gap-1.5" onClick={addColour}>
                <Plus className="size-4" /> Add colour
              </Button>
            }
          >
            {!colours.length && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">Start with a size set:</span>
                {Object.keys(SIZE_PRESETS).map((p) => (
                  <Button key={p} variant="outline" className="h-8" onClick={() => applyPreset('Black', p)}>
                    {p}
                  </Button>
                ))}
              </div>
            )}
            <div className="space-y-6">
              {colours.map(([colour, hex]) => (
                <div key={colour} className="rounded-xl border border-border">
                  <div className="flex flex-wrap items-center gap-3 border-b border-border p-3">
                    <input type="color" value={hex} onChange={(e) => recolour(colour, e.target.value)} className="size-8 cursor-pointer rounded-md border border-border" aria-label="Colour swatch" />
                    <Input defaultValue={colour} onBlur={(e) => e.target.value.trim() && e.target.value !== colour && renameColour(colour, e.target.value.trim())} className="w-40" />
                    <Select value="" onChange={(p) => applyPreset(colour, p)} placeholder="Replace sizes with…" options={Object.keys(SIZE_PRESETS).map((p) => ({ value: p, label: p }))} className="w-52" />
                    <Button
                      variant="ghost"
                      className="ml-auto h-8 gap-1.5"
                      onClick={() =>
                        setVariants((vs) => [
                          ...vs,
                          { color_name: colour, color_hex: hex, size_label: '', size_in: '', size_uk: '', size_us: '', stock: '0', price_override: '', is_active: true },
                        ])
                      }
                    >
                      <Plus className="size-3.5" /> Size
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 font-medium">Size</th>
                          <th className="px-3 py-2 font-medium">IN</th>
                          <th className="px-3 py-2 font-medium">UK</th>
                          <th className="px-3 py-2 font-medium">US</th>
                          <th className="px-3 py-2 font-medium">Stock</th>
                          <th className="px-3 py-2 font-medium">Own price</th>
                          <th className="px-3 py-2 font-medium">On sale</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((v, i) =>
                          v.color_name !== colour ? null : (
                            <tr key={v.id ?? `new-${i}`} className="border-t border-border">
                              {(['size_label', 'size_in', 'size_uk', 'size_us'] as const).map((k) => (
                                <td key={k} className="px-2 py-1.5">
                                  <Input value={v[k]} onChange={(e) => setVariant(i, { [k]: e.target.value })} className="h-8 w-20" />
                                </td>
                              ))}
                              <td className="px-2 py-1.5">
                                <Input type="number" min={0} value={v.stock} onChange={(e) => setVariant(i, { stock: e.target.value })} className="h-8 w-20" />
                              </td>
                              <td className="px-2 py-1.5">
                                <Input type="number" min={0} placeholder="—" value={v.price_override} onChange={(e) => setVariant(i, { price_override: e.target.value })} className="h-8 w-24" />
                              </td>
                              <td className="px-2 py-1.5">
                                <input type="checkbox" checked={v.is_active} onChange={(e) => setVariant(i, { is_active: e.target.checked })} className="size-4 accent-foreground" aria-label="On sale" />
                              </td>
                              <td className="px-2 py-1.5">
                                <button onClick={() => removeVariant(i)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="Remove size">
                                  <Trash2 className="size-3.5" />
                                </button>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Price">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Selling price ₹">
                <Input type="number" min={0} value={form.price} onChange={(e) => set('price', e.target.value)} />
              </Field>
              <Field label="MRP ₹">
                <Input type="number" min={0} value={form.mrp} onChange={(e) => set('mrp', e.target.value)} />
              </Field>
            </div>
            {Number(form.mrp) > Number(form.price) && Number(form.price) > 0 ? (
              <p className="mt-3 text-sm text-sale">Shows as {Math.round((1 - Number(form.price) / Number(form.mrp)) * 100)}% off</p>
            ) : null}
            <p className="mt-3 text-xs text-muted-foreground">Prices include GST. The checkout always recalculates from these numbers.</p>
          </Section>

          <Section title="Visibility">
            <Toggle label="Live in app & website" checked={form.is_active} onChange={(v) => set('is_active', v)} hint="Hidden products stay in past orders." />
          </Section>

          <Section title="Collections" description="Best sellers, new arrivals, styles…">
            <div className="space-y-1.5">
              {collections.map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-sm hover:bg-muted">
                  <input
                    type="checkbox"
                    className="size-4 accent-foreground"
                    checked={inCollections.has(c.id)}
                    onChange={(e) =>
                      setInCollections((s) => {
                        const n = new Set(s);
                        if (e.target.checked) n.add(c.id);
                        else n.delete(c.id);
                        return n;
                      })
                    }
                  />
                  {c.name}
                  <span className="ml-auto text-xs text-muted-foreground">{c.kind}</span>
                </label>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}

export default function ProductEditorPage() {
  return (
    <Suspense>
      <Editor />
    </Suspense>
  );
}
