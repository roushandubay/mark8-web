import { supabase } from './supabase';
import type { Banner, ProductCard, StoreSettings } from './types';

/** Public reads for the storefront pages. */

const CARD =
  'id, slug, name, label, gender, price, mrp, discount_pct, rating_avg, rating_count, image_url, colors, stock, category_path, category_name';

type Row = Record<string, unknown>;
const toCard = (r: Row): ProductCard => ({
  id: r.id as string,
  slug: r.slug as string,
  name: r.name as string,
  label: (r.label as string) ?? null,
  gender: r.gender as string,
  price: Number(r.price),
  mrp: Number(r.mrp),
  discountPct: r.discount_pct as number,
  rating: Number(r.rating_avg),
  ratingCount: r.rating_count as number,
  image: (r.image_url as string) ?? null,
  colors: (r.colors as string[]) ?? [],
  stock: r.stock as number,
  categoryPath: r.category_path as string,
  categoryName: r.category_name as string,
});

export async function getProducts(
  opts: { collection?: string; path?: string; gender?: string; search?: string; limit?: number } = {},
) {
  let q = opts.collection
    ? supabase.from('collection_product_cards').select(CARD).eq('collection_slug', opts.collection).order('sort_order')
    : supabase.from('product_cards').select(CARD).order('sold_count', { ascending: false });
  if (opts.path) q = q.or(`category_path.eq.${opts.path},category_path.like.${opts.path}/%`);
  if (opts.gender) q = q.in('gender', [opts.gender, 'unisex']);
  if (opts.search) for (const t of opts.search.toLowerCase().split(/\s+/).filter(Boolean)) q = q.like('search_text', `%${t}%`);
  const { data, error } = await q.limit(opts.limit ?? 24);
  if (error) throw error;
  return (data as Row[]).map(toCard);
}

export type ProductDetail = ProductCard & {
  description: string;
  material: string | null;
  fit: string | null;
  care: string | null;
  images: string[];
  variants: {
    color_name: string;
    color_hex: string;
    size_label: string;
    size_in: string | null;
    size_uk: string | null;
    size_us: string | null;
    size_order: number;
    stock: number;
  }[];
};

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  const [{ data: card }, { data: detail }] = await Promise.all([
    supabase.from('product_cards').select(CARD).eq('slug', slug).maybeSingle(),
    supabase
      .from('products')
      .select(
        'description, material, fit, care, product_images(url, sort_order), product_variants(color_name, color_hex, size_label, size_in, size_uk, size_us, size_order, stock)',
      )
      .eq('slug', slug)
      .maybeSingle(),
  ]);
  if (!card || !detail) return null;
  const images = ((detail.product_images ?? []) as { url: string; sort_order: number }[])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => i.url);
  const variants = ((detail.product_variants ?? []) as ProductDetail['variants']).sort((a, b) => a.size_order - b.size_order);
  return {
    ...toCard(card as Row),
    description: detail.description as string,
    material: detail.material as string | null,
    fit: detail.fit as string | null,
    care: detail.care as string | null,
    images,
    variants,
  };
}

export async function getWebBanners(): Promise<Banner[]> {
  const { data, error } = await supabase.from('banners').select('*').eq('show_on_web', true).order('sort_order');
  if (error) throw error;
  return data as Banner[];
}

export async function getSettings(): Promise<StoreSettings | null> {
  const { data } = await supabase.from('store_settings').select('*').eq('id', 1).maybeSingle();
  return (data as StoreSettings) ?? null;
}

export async function getCollections(kind?: string) {
  let q = supabase.from('collections').select('slug, name, kind, image_url').order('sort_order');
  if (kind) q = q.eq('kind', kind);
  const { data } = await q;
  return (data ?? []) as { slug: string; name: string; kind: string; image_url: string | null }[];
}
