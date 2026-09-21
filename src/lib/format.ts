export const inr = (v: number) =>
  '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });

export const offPct = (price: number, mrp: number) => (mrp > price ? Math.round((1 - price / mrp) * 100) : 0);

export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(iso).toLocaleDateString('en-IN', opts);

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Unsplash placeholders get sized by their CDN; Supabase Storage URLs are served as uploaded. */
export function img(url: string | null | undefined, w: number, h?: number) {
  if (!url) return '';
  if (url.includes('images.unsplash.com')) {
    return `${url.split('?')[0]}?w=${w}${h ? `&h=${h}` : ''}&fit=crop&auto=format&q=75`;
  }
  return url;
}
