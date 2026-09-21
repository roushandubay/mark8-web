import { supabase } from './supabase';

/**
 * Admin helpers. Every call runs as the signed-in admin; the database checks
 * `is_admin()` on each write, so nothing here is trusted on its own.
 */

export const MAX_UPLOAD_MB = 50; // Supabase free-tier per-file limit

/** Uploads a file to the public `media` bucket and returns its URL. */
export async function uploadMedia(file: File, folder: string): Promise<string> {
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    throw new Error(`File is over ${MAX_UPLOAD_MB} MB — please compress it first.`);
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('media').upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
}

export const mediaTypeOf = (file: File): 'image' | 'video' => (file.type.startsWith('video') ? 'video' : 'image');

export function errorText(e: unknown) {
  const msg = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : String(e);
  if (/row-level security|permission|forbidden/i.test(msg)) return 'You don’t have permission to do that.';
  if (/duplicate key/i.test(msg)) return 'That already exists — use a different name or slug.';
  if (/foreign key/i.test(msg)) return 'It’s still in use elsewhere, so it can’t be removed.';
  return msg;
}

/** Size presets used by the variant editor — IN / UK / US. */
export const SIZE_PRESETS: Record<string, { label: string; in: string; uk: string; us: string }[]> = {
  'Men · apparel': [
    { label: 'S', in: 'S', uk: '36', us: '36' },
    { label: 'M', in: 'M', uk: '38', us: '38' },
    { label: 'L', in: 'L', uk: '40', us: '40' },
    { label: 'XL', in: 'XL', uk: '42', us: '42' },
    { label: 'XXL', in: 'XXL', uk: '44', us: '44' },
  ],
  'Women · apparel': [
    { label: 'XS', in: 'XS', uk: '6', us: '2' },
    { label: 'S', in: 'S', uk: '8', us: '4' },
    { label: 'M', in: 'M', uk: '10', us: '6' },
    { label: 'L', in: 'L', uk: '12', us: '8' },
    { label: 'XL', in: 'XL', uk: '14', us: '10' },
  ],
  'Waist (28–36)': ['28', '30', '32', '34', '36'].map((s) => ({ label: s, in: s, uk: s, us: s })),
  'Men · shoes (UK 6–11)': [6, 7, 8, 9, 10, 11].map((s) => ({ label: String(s), in: String(s), uk: String(s), us: String(s + 1) })),
  'Women · shoes (UK 3–7)': [3, 4, 5, 6, 7].map((s) => ({ label: String(s), in: String(s), uk: String(s), us: String(s + 2) })),
  'One size': [{ label: 'One Size', in: 'One Size', uk: 'One Size', us: 'One Size' }],
};

export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'return_requested',
  'returned',
  'refunded',
] as const;

export const statusLabel = (s: string) => s.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
