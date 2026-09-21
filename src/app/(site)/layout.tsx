'use client';

import { usePathname } from 'next/navigation';

import { DownloadDialog } from '@/components/site/download-dialog';
import { Footer } from '@/components/site/footer';
import { Header } from '@/components/site/header';
import { SiteProvider } from '@/components/site/site-data';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const home = usePathname() === '/';
  return (
    <SiteProvider>
      <Header overHero={home} />
      <main className={home ? '' : 'pt-16 md:pt-20'}>{children}</main>
      <Footer />
      <DownloadDialog />
    </SiteProvider>
  );
}
