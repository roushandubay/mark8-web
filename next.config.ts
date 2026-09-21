import type { NextConfig } from 'next';

/**
 * Static export: the whole site (storefront pages and /admin) is plain files on
 * Netlify's CDN. All data is read live from Supabase in the browser, so edits
 * in the admin panel show up without a rebuild.
 */
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
