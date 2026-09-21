'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Session } from '@supabase/supabase-js';
import {
  BadgePercent,
  Boxes,
  FolderTree,
  Globe,
  Home,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Settings,
  Shirt,
  Users,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders/', label: 'Orders', icon: Package },
  { href: '/admin/products/', label: 'Products', icon: Shirt },
  { href: '/admin/categories/', label: 'Categories', icon: FolderTree },
  { href: '/admin/collections/', label: 'Collections', icon: Boxes },
  { href: '/admin/homepage/', label: 'App homepage', icon: Home },
  { href: '/admin/banners/', label: 'Offer banners', icon: BadgePercent },
  { href: '/admin/website/', label: 'Website', icon: Globe },
  { href: '/admin/reviews/', label: 'Reviews', icon: MessageSquare },
  { href: '/admin/customers/', label: 'Customers', icon: Users },
  { href: '/admin/settings/', label: 'Store settings', icon: Settings },
];

type State = 'loading' | 'signed-out' | 'forbidden' | 'ok';

/**
 * Admin gate. Sign-in is Google (the same accounts as the app); access is
 * decided by the database (`is_admin()`), and every write is re-checked there.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>('loading');
  const [session, setSession] = useState<Session | null>(null);
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [unseen, setUnseen] = useState(0);

  useEffect(() => {
    const check = async (s: Session | null) => {
      setSession(s);
      if (!s) return setState('signed-out');
      const { data } = await supabase.rpc('is_admin');
      setState(data ? 'ok' : 'forbidden');
    };
    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => check(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    if (pathname.startsWith('/admin/orders')) setUnseen(0);
  }, [pathname]);

  // Live "new order" alerts while the panel is open (realtime on public.orders).
  useEffect(() => {
    if (state !== 'ok') return;
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission().catch(() => {});
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const o = payload.new as { id: string; order_number: string; total: number; payment_method: string; shipping_address: { full_name?: string; city?: string } };
        const who = o.shipping_address?.full_name ?? 'a customer';
        const total = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(o.total));
        const text = `${who}${o.shipping_address?.city ? `, ${o.shipping_address.city}` : ''} · ${total} · ${o.payment_method === 'cod' ? 'COD' : o.payment_method.toUpperCase()}`;
        const open = () => router.push(`/admin/order/?id=${o.id}`);
        toast.success(`New order ${o.order_number}`, { description: `Placed by ${text}`, duration: 15000, action: { label: 'Open', onClick: open } });
        setUnseen((n) => n + 1);
        window.dispatchEvent(new Event('mark8:new-order'));
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
          const n = new Notification(`New order ${o.order_number}`, { body: `Placed by ${text}`, icon: '/brand/monogram.png' });
          n.onclick = () => {
            window.focus();
            open();
          };
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [state, router]);

  const signIn = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/admin/`, queryParams: { prompt: 'select_account' } },
    });
  const signOut = () => supabase.auth.signOut();

  if (state === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state !== 'ok') {
    return (
      <div className="grid min-h-screen place-items-center px-5">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/wordmark.png" alt="MARK8" className="mx-auto h-5 w-auto" />
          <h1 className="mt-6 text-lg font-semibold">Admin</h1>
          {state === 'signed-out' ? (
            <>
              <p className="mt-1 text-sm text-muted-foreground">Sign in with your MARK8 admin Google account.</p>
              <Button className="mt-6 h-10 w-full" onClick={signIn}>
                Continue with Google
              </Button>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                {session?.user.email} doesn’t have admin access. Ask the super admin to grant it.
              </p>
              <Button variant="outline" className="mt-6 h-10 w-full" onClick={signOut}>
                Sign out
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  const nav = (
    <nav className="space-y-0.5">
      {NAV.map((n) => {
        const on = n.href === '/admin/' ? pathname === '/admin' || pathname === '/admin/' : pathname.startsWith(n.href.replace(/\/$/, ''));
        return (
          <Link
            key={n.href}
            href={n.href}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
              on ? 'bg-foreground text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <n.icon className="size-4" strokeWidth={1.75} />
            {n.label}
            {n.href === '/admin/orders/' && unseen > 0 ? (
              <span className="ml-auto rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white">{unseen}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden h-screen flex-col border-r border-border bg-white p-4 md:sticky md:top-0 md:flex">
        <Link href="/admin/" className="mb-6 flex items-center gap-2 px-2 pt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/wordmark.png" alt="MARK8" className="h-4 w-auto" />
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Admin</span>
        </Link>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <div className="mt-4 border-t border-border pt-4">
          <p className="truncate px-2 text-xs text-muted-foreground">{session?.user.email}</p>
          <div className="mt-2 flex gap-1">
            <Link href="/" className="flex-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">
              View website ↗
            </Link>
            <button onClick={signOut} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="Sign out">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-white/90 px-4 py-3 backdrop-blur md:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/wordmark.png" alt="MARK8" className="h-4 w-auto" />
        <button onClick={() => setMenu((m) => !m)} aria-label="Menu" className="rounded-lg p-2 hover:bg-muted">
          {menu ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>
      {menu && (
        <div className="border-b border-border bg-white p-3 md:hidden">
          {nav}
          <button onClick={signOut} className="mt-2 w-full rounded-xl px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted">
            Sign out
          </button>
        </div>
      )}

      <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
