export interface ProductCard {
  id: string;
  slug: string;
  name: string;
  label: string | null;
  gender: string;
  price: number;
  mrp: number;
  discountPct: number;
  rating: number;
  ratingCount: number;
  image: string | null;
  colors: string[];
  stock: number;
  categoryPath: string;
  categoryName: string;
}

export interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  cta: string | null;
  link_collection: string | null;
  link_path: string | null;
  link_url: string | null;
  desktop_media_url: string | null;
  desktop_media_type: 'image' | 'video';
  mobile_media_url: string | null;
  mobile_media_type: 'image' | 'video';
  poster_url: string | null;
  text_color: 'light' | 'dark';
  show_on_web: boolean;
  show_on_app: boolean;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

export interface SiteContent {
  hero_eyebrow?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_image?: string;
  hero_video?: string;
  hero_word_left?: string;
  hero_word_right?: string;
  hero_overlay?: 'brand' | 'dark';
  lookbook_title?: string;
  lookbook_subtitle?: string;
  apk_url?: string;
  app_version?: string;
  features?: { title: string; body: string }[];
  privacy?: string;
  terms?: string;
}

export interface StoreSettings {
  free_shipping_from: number;
  shipping_fee: number;
  delivery_days_min: number;
  delivery_days_max: number;
  return_days: number;
  support_email: string | null;
  support_phone: string | null;
  site: SiteContent;
}
