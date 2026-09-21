'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, RotateCcw, Ruler, Truck } from 'lucide-react';

import { LiquidButton } from '@/components/ui/liquid-glass-button';
import { Marquee } from '@/components/ui/3d-testimonails';
import StackSpread from '@/components/ui/stack-spread';
import { getProducts, getWebBanners } from '@/lib/data';
import { img, inr } from '@/lib/format';
import type { Banner } from '@/lib/types';
import { useAsync } from '@/lib/use-async';
import { cn } from '@/lib/utils';
import { ProductCard, ProductCardSkeleton } from './product-card';
import { useSite } from './site-data';

/* ───────────────────────── hero ───────────────────────── */

/**
 * Full-screen fashion video (set in Admin → Website) under a soft brand or
 * dark wash, the MARK8 wordmark spanning the width, and two quiet words pinned
 * left and right. The logo drifts and fades as you scroll into the page.
 */
export function Hero() {
  const { settings, setDownloadOpen } = useSite();
  const site = settings?.site;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const videoY = useTransform(scrollYProgress, [0, 1], ['0%', '16%']);
  const logoY = useTransform(scrollYProgress, [0, 1], ['0%', '-35%']);
  const logoScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const fade = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const video = site?.hero_video?.trim();
  const poster = site?.hero_image ? img(site.hero_image, 2000, 1300) : undefined;
  const wash =
    site?.hero_overlay === 'dark'
      ? 'bg-gradient-to-b from-black/45 via-black/25 to-black/65'
      : 'bg-gradient-to-br from-[#2d069d]/55 via-[#1d1e20]/25 to-[#7649f8]/45';
  const ready = settings !== undefined;

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-[#1d1e20]">
      <motion.div style={{ y: videoY }} className="absolute inset-0 scale-[1.04]">
        {video ? (
          <video
            key={video}
            className="h-full w-full object-cover"
            src={video}
            poster={poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
        ) : poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="h-full w-full object-cover" />
        ) : null}
      </motion.div>
      <div className={cn('absolute inset-0', wash)} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      {/* The mark, edge to edge */}
      <motion.div style={{ y: logoY, scale: logoScale, opacity: fade }} className="absolute inset-0 z-10 grid place-items-center px-[4vw]">
        <motion.img
          src="/brand/wordmark-light.png"
          alt="MARK8"
          initial={{ opacity: 0, scale: 1.06, filter: 'blur(12px)' }}
          animate={ready ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : {}}
          transition={{ duration: 1.2, ease: [0.2, 0.9, 0.1, 1] }}
          className="w-full max-w-[1500px] select-none drop-shadow-[0_10px_40px_rgba(0,0,0,0.25)]"
          draggable={false}
        />
      </motion.div>

      {/* Two quiet words, left and right */}
      <motion.div style={{ opacity: fade }} className="pointer-events-none absolute inset-x-0 top-1/2 z-10 mx-auto hidden max-w-[1500px] -translate-y-1/2 justify-between px-[4vw] md:flex">
        <HeroWord side="left" text={site?.hero_word_left} ready={ready} />
        <HeroWord side="right" text={site?.hero_word_right} ready={ready} />
      </motion.div>

      <motion.div style={{ opacity: fade }} className="absolute inset-x-0 bottom-0 z-20 mx-auto max-w-7xl px-5 pb-10 md:px-8 md:pb-14">
        <div className="mb-6 flex justify-between text-[11px] font-medium uppercase tracking-[0.3em] text-white/80 md:hidden">
          <span>{site?.hero_word_left}</span>
          <span>{site?.hero_word_right}</span>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={ready ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="flex flex-col items-center gap-5 text-center"
        >
          {site?.hero_subtitle ? <p className="max-w-lg text-sm text-white/80 md:text-base">{site.hero_subtitle}</p> : null}
          <div className="flex flex-wrap justify-center gap-3">
            <LiquidButton variant="light" size="xl" onClick={() => setDownloadOpen(true)}>
              Download the app
            </LiquidButton>
            <LiquidButton asChild variant="light" size="xl">
              <Link href="/products/?collection=new-arrivals&title=New%20Arrivals">
                Shop new in <ArrowRight className="size-4" />
              </Link>
            </LiquidButton>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function HeroWord({ side, text, ready }: { side: 'left' | 'right'; text?: string; ready: boolean }) {
  if (!text) return <span />;
  return (
    <motion.span
      initial={{ opacity: 0, x: side === 'left' ? -24 : 24 }}
      animate={ready ? { opacity: 1, x: 0 } : {}}
      transition={{ delay: 0.5, duration: 0.9, ease: [0.2, 0.9, 0.1, 1] }}
      className={cn(
        'text-xs font-medium uppercase tracking-[0.35em] text-white/85 [writing-mode:vertical-rl]',
        side === 'left' && 'rotate-180',
      )}
    >
      {text}
    </motion.span>
  );
}

/* ───────────────────────── live product wall (3D marquee) ───────────────────────── */

/** Tilted wall of real products scrolling in columns — "what's in the app right now". */
export function AppWall() {
  const { setDownloadOpen } = useSite();
  const { data } = useAsync(() => getProducts({ limit: 24 }), []);
  const items = (data ?? []).filter((p) => p.image);
  if (items.length < 8) return null;
  const cols = [0, 1, 2, 3].map((c) => items.filter((_, i) => i % 4 === c));

  return (
    <section className="mx-auto max-w-7xl px-5 pt-16 md:px-8 md:pt-24">
      <div className="grid items-center gap-10 overflow-hidden rounded-[32px] bg-white md:grid-cols-[1fr_1.2fr]">
        <div className="p-8 md:p-14">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Live in the app</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">Everything you see here is in stock now.</h2>
          <p className="mt-4 text-muted-foreground">Fresh pieces land every week. Save them, pick your size in IN, UK or US, and check out in a couple of taps.</p>
          <LiquidButton variant="primary" size="xl" className="mt-8" onClick={() => setDownloadOpen(true)}>
            Get the app
          </LiquidButton>
        </div>

        <div className="relative flex h-[460px] items-center justify-center overflow-hidden [perspective:300px] md:h-[600px]">
          <div
            className="flex flex-row items-center gap-4"
            style={{ transform: 'translateX(-60px) translateY(0px) translateZ(-100px) rotateX(20deg) rotateY(-10deg) rotateZ(20deg)' }}
          >
            {cols.map((col, n) => (
              <Marquee key={n} vertical pauseOnHover reverse={n % 2 === 1} repeat={3} className="[--duration:45s]" ariaLabel="Products in the app">
                {col.map((p) => (
                  <Link
                    key={p.id}
                    href={`/product/?slug=${p.slug}`}
                    className="block w-40 overflow-hidden rounded-2xl bg-background shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)] transition hover:-translate-y-1 md:w-48"
                  >
                    <div className="relative aspect-[4/5] bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img(p.image, 400, 500)} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="truncate text-[13px] font-medium">{p.name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {p.categoryName} · {inr(p.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </Marquee>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-white" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-white" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-white" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/5 bg-gradient-to-l from-white" />
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── offer banners ───────────────────────── */

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const read = () => setMobile(mq.matches);
    read();
    mq.addEventListener('change', read);
    return () => mq.removeEventListener('change', read);
  }, []);
  return mobile;
}

function bannerHref(b: Banner) {
  if (b.link_url) return b.link_url;
  if (b.link_collection) return `/products/?collection=${encodeURIComponent(b.link_collection)}&title=${encodeURIComponent(b.title ?? 'Offers')}`;
  if (b.link_path) return `/products/?path=${encodeURIComponent(b.link_path)}&title=${encodeURIComponent(b.title ?? 'Offers')}`;
  return null;
}

/** Offer banners: desktop and mobile artwork (image or video) set separately in the admin panel. */
export function Banners() {
  const { data } = useAsync(getWebBanners, []);
  const mobile = useIsMobile();
  const [i, setI] = useState(0);
  const banners = (data ?? []).filter((b) => (mobile ? b.mobile_media_url || b.desktop_media_url : b.desktop_media_url || b.mobile_media_url));

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % banners.length), 6000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (!banners.length) return null;
  const go = (d: number) => setI((n) => (n + d + banners.length) % banners.length);

  return (
    <section className="mx-auto max-w-7xl px-5 pt-16 md:px-8 md:pt-24" aria-roledescription="carousel" aria-label="Offers">
      <div className="relative overflow-hidden rounded-3xl bg-muted">
        <div className="flex transition-transform duration-700 ease-[cubic-bezier(0.2,0.9,0.1,1)]" style={{ transform: `translateX(-${i * 100}%)` }}>
          {banners.map((b, n) => {
            const url = mobile ? b.mobile_media_url || b.desktop_media_url : b.desktop_media_url || b.mobile_media_url;
            const type = mobile ? (b.mobile_media_url ? b.mobile_media_type : b.desktop_media_type) : b.desktop_media_url ? b.desktop_media_type : b.mobile_media_type;
            const href = bannerHref(b);
            const ink = b.text_color === 'dark' ? 'text-foreground' : 'text-white';
            const inner = (
              <div className="relative aspect-[4/5] w-full md:aspect-[21/9]">
                {type === 'video' ? (
                  <video className="absolute inset-0 h-full w-full object-cover" src={url!} poster={b.poster_url ?? undefined} autoPlay muted loop playsInline aria-hidden="true" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img(url, mobile ? 900 : 2200, mobile ? 1125 : 943)} alt={b.title ?? 'Offer'} className="absolute inset-0 h-full w-full object-cover" loading={n === 0 ? 'eager' : 'lazy'} />
                )}
                {b.text_color === 'light' && <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent md:bg-gradient-to-r md:from-black/50 md:via-black/10" />}
                <div className={cn('absolute inset-x-0 bottom-0 p-7 md:inset-y-0 md:flex md:max-w-lg md:flex-col md:justify-center md:p-14', ink)}>
                  {b.title ? <h3 className="text-3xl font-semibold tracking-tight md:text-5xl">{b.title}</h3> : null}
                  {b.subtitle ? <p className="mt-3 text-sm opacity-90 md:text-lg">{b.subtitle}</p> : null}
                  {b.cta && href ? (
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                      {b.cta} <ArrowRight className="size-4" />
                    </span>
                  ) : null}
                </div>
              </div>
            );
            return (
              <div key={b.id} className="w-full shrink-0" aria-hidden={n !== i}>
                {href ? (
                  <a href={href} tabIndex={n === i ? 0 : -1} target={b.link_url ? '_blank' : undefined} rel={b.link_url ? 'noreferrer' : undefined}>
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </div>
            );
          })}
        </div>

        {banners.length > 1 && (
          <>
            <div className="absolute bottom-4 right-5 flex gap-1.5 md:bottom-6 md:right-8">
              {banners.map((b, n) => (
                <button
                  key={b.id}
                  onClick={() => setI(n)}
                  aria-label={`Show offer ${n + 1}`}
                  className={cn('h-1.5 rounded-full bg-white/60 transition-all', n === i ? 'w-6 bg-white' : 'w-1.5')}
                />
              ))}
            </div>
            <div className="absolute right-5 top-5 hidden gap-2 md:flex">
              <LiquidButton variant="light" size="icon" onClick={() => go(-1)} aria-label="Previous offer">
                <ChevronLeft />
              </LiquidButton>
              <LiquidButton variant="light" size="icon" onClick={() => go(1)} aria-label="Next offer">
                <ChevronRight />
              </LiquidButton>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ───────────────────────── live products ───────────────────────── */

export function ProductSection({ title, collection, href }: { title: string; collection: string; href: string }) {
  const { data, loading } = useAsync(() => getProducts({ collection, limit: 8 }), [collection]);
  if (!loading && !data?.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-5 pt-16 md:px-8 md:pt-24">
      <div className="mb-6 flex items-end justify-between">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          className="text-2xl font-semibold tracking-tight md:text-4xl"
        >
          {title}
        </motion.h2>
        <Link href={href} className="text-sm text-muted-foreground transition hover:text-foreground">
          View all
        </Link>
      </div>
      {/* Swipe row on phones, grid on desktop */}
      <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0">
        {(data ?? Array.from({ length: 4 }, () => null)).slice(0, 8).map((p, n) => (
          <motion.div
            key={p?.id ?? n}
            className="w-[62%] shrink-0 snap-start sm:w-[40%] md:w-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: (n % 4) * 0.06, duration: 0.5 }}
          >
            {p ? <ProductCard product={p} priority={n < 4} /> : <ProductCardSkeleton />}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── lookbook (stack spread) ───────────────────────── */

export function Lookbook() {
  const { settings } = useSite();
  const { data } = useAsync(() => getProducts({ collection: 'trending', limit: 8 }), []);
  const images = (data ?? [])
    .filter((p) => p.image)
    .map((p) => ({ src: img(p.image, 700), alt: p.name, href: `/product/?slug=${p.slug}` }));
  if (images.length < 4) return null;
  return (
    <div className="mt-16 md:mt-24">
      <StackSpread
        images={images}
        title={settings?.site.lookbook_title || 'Dressed with intent.'}
        dimmed="with"
        subtitle={settings?.site.lookbook_subtitle || 'Pieces from the new season, chosen to be worn together.'}
        bgColor="#e9e9ed"
        textColor="#1d1e20"
        cardRadius={14}
      />
    </div>
  );
}

/* ───────────────────────── promise + app ───────────────────────── */

const ICONS = [Truck, RotateCcw, Ruler];

export function Features() {
  const { settings } = useSite();
  const items = settings?.site.features ?? [];
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-5 pt-16 md:px-8 md:pt-24">
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((f, n) => {
          const Icon = ICONS[n % ICONS.length];
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: n * 0.08 }}
              className="rounded-3xl bg-white p-7"
            >
              <Icon className="size-5" strokeWidth={1.6} />
              <p className="mt-5 font-semibold">{f.title}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export function AppCta() {
  const { setDownloadOpen } = useSite();
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
      <div className="relative overflow-hidden rounded-[32px] bg-foreground px-7 py-14 text-white md:px-16 md:py-20">
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-[#9775fa]/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-96 rounded-full bg-[#7649f8]/30 blur-3xl" />
        <div className="relative max-w-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/monogram-light.png" alt="" className="h-8 w-auto" />
          <h2 className="mt-8 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">The whole collection, in your pocket.</h2>
          <p className="mt-4 text-white/75">Sign in with Google, save what you love, and check out in a couple of taps.</p>
          <LiquidButton variant="light" size="xl" className="mt-8" onClick={() => setDownloadOpen(true)}>
            Download the app
          </LiquidButton>
        </div>
      </div>
    </section>
  );
}
