'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

import { getSettings } from '@/lib/data';
import type { StoreSettings } from '@/lib/types';
import { useAsync } from '@/lib/use-async';

/** Store settings + website copy (from the admin panel), and the download popup's open state. */
type Ctx = {
  settings: StoreSettings | null | undefined;
  downloadOpen: boolean;
  setDownloadOpen: (v: boolean) => void;
};

const SiteContext = createContext<Ctx | null>(null);

export function SiteProvider({ children }: { children: ReactNode }) {
  const { data: settings } = useAsync(getSettings, []);
  const [downloadOpen, setDownloadOpen] = useState(false);
  return <SiteContext.Provider value={{ settings, downloadOpen, setDownloadOpen }}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used inside <SiteProvider>');
  return ctx;
}
