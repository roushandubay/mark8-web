'use client';

import { AppCta, AppWall, Banners, Features, Hero, Lookbook, ProductSection } from '@/components/site/home-sections';

export default function Home() {
  return (
    <>
      <Hero />
      <Banners />
      <ProductSection title="New arrivals" collection="new-arrivals" href="/products/?collection=new-arrivals&title=New%20Arrivals" />
      <Lookbook />
      <ProductSection title="Best sellers" collection="best-sellers" href="/products/?collection=best-sellers&title=Best%20Sellers" />
      <AppWall />
      <Features />
      <AppCta />
    </>
  );
}
