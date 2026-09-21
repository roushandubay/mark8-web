'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, ShieldCheck, Smartphone, X } from 'lucide-react';

import { LiquidButton } from '@/components/ui/liquid-glass-button';
import { WarpDialog, WarpDialogContent } from '@/components/ui/warp-dialog';
import { useSite } from './site-data';

/**
 * "Download the app" — opens with the warp animation from any Download button
 * on the site. The APK link and version come from the admin panel.
 */
export function DownloadDialog() {
  const { settings, downloadOpen, setDownloadOpen } = useSite();
  const apk = settings?.site.apk_url?.trim() || '';
  const version = settings?.site.app_version || '';
  const [qr, setQr] = useState<string>('');

  useEffect(() => {
    if (!apk) return;
    QRCode.toDataURL(apk, { margin: 1, width: 360, color: { dark: '#1d1e20', light: '#ffffff' } }).then(setQr).catch(() => setQr(''));
  }, [apk]);

  return (
    <WarpDialog open={downloadOpen} onOpenChange={setDownloadOpen}>
      <WarpDialogContent>
        <div className="relative w-[min(92vw,420px)] rounded-[28px] bg-white/85 p-7 text-center shadow-[0_30px_80px_-20px_rgba(118,73,248,0.45)] ring-1 ring-white/60 backdrop-blur-xl">
          <button
            onClick={() => setDownloadOpen(false)}
            aria-label="Close"
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/monogram.png" alt="MARK8" className="mx-auto h-9 w-auto" />
          <h2 className="mt-5 text-2xl font-semibold tracking-tight">Get the MARK8 app</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Shop the full collection, track orders and save your favourites.
            {version ? ` Android · v${version}` : ''}
          </p>

          {apk ? (
            <>
              {qr ? (
                <div className="mx-auto mt-6 hidden w-44 rounded-2xl bg-white p-3 ring-1 ring-border md:block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt="Scan to download the MARK8 app" className="h-auto w-full" />
                  <p className="mt-2 text-[11px] text-muted-foreground">Scan with your phone</p>
                </div>
              ) : null}
              <LiquidButton asChild variant="primary" size="xl" className="mt-6 w-full">
                <a href={apk} download>
                  <Download className="size-4" />
                  Download for Android
                </a>
              </LiquidButton>
              <ol className="mt-6 space-y-2 text-left text-[13px] text-muted-foreground">
                <li className="flex gap-2">
                  <Smartphone className="mt-0.5 size-4 shrink-0 text-foreground" />
                  Open the downloaded file on your Android phone.
                </li>
                <li className="flex gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" />
                  If asked, allow your browser to install apps, then tap Install.
                </li>
              </ol>
              <p className="mt-5 text-[12px] text-muted-foreground">iPhone app coming soon.</p>
            </>
          ) : (
            <p className="mt-6 rounded-2xl bg-muted px-4 py-3 text-sm">The app is almost ready — check back very soon.</p>
          )}
        </div>
      </WarpDialogContent>
    </WarpDialog>
  );
}
