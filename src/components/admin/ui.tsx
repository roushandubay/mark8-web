'use client';

import { useRef, useState, type ReactNode } from 'react';
import { ImagePlus, Link2, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { errorText, mediaTypeOf, uploadMedia } from '@/lib/admin';
import { cn } from '@/lib/utils';

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Section({ title, description, children, actions }: { title?: string; description?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 md:p-6">
      {title ? (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">{title}</h2>
            {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-[13px] font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function Select({ value, onChange, options, className, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn('h-9 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus:ring-3 focus:ring-ring/30', className)}
    >
      {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={(v) => onChange(v)} aria-label={label} />
    </div>
  );
}

export function StatusPill({ on, onLabel = 'Live', offLabel = 'Hidden' }: { on: boolean; onLabel?: string; offLabel?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', on ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground')}>
      {on ? onLabel : offLabel}
    </span>
  );
}

/**
 * Photo / video picker: upload from the computer (goes to Supabase Storage) or
 * paste a URL. Shows a live preview of what the app and website will show.
 */
export function MediaField({
  label,
  value,
  onChange,
  folder,
  accept = 'image/*',
  kind,
  onKind,
  aspect = 'aspect-video',
  hint,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (url: string) => void;
  folder: string;
  accept?: string;
  kind?: 'image' | 'video';
  onKind?: (k: 'image' | 'video') => void;
  aspect?: string;
  hint?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const isVideo = kind === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(value ?? '');

  const pick = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadMedia(file, folder);
      onKind?.(mediaTypeOf(file));
      onChange(url);
      toast.success('Uploaded');
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-[13px] font-medium">{label}</p>
      <div className={cn('relative overflow-hidden rounded-xl border border-dashed border-border bg-muted/60', aspect)}>
        {value ? (
          isVideo ? (
            <video src={value} className="absolute inset-0 h-full w-full object-cover" muted loop autoPlay playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="absolute inset-0 grid place-items-center text-muted-foreground transition hover:text-foreground"
          >
            <span className="flex flex-col items-center gap-2 text-xs">
              <ImagePlus className="size-6" strokeWidth={1.5} />
              Click to upload
            </span>
          </button>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-white/70">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => input.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium hover:bg-border">
          <Upload className="size-3.5" /> {value ? 'Replace' : 'Upload'}
        </button>
        <button type="button" onClick={() => setShowUrl((s) => !s)} className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium hover:bg-border">
          <Link2 className="size-3.5" /> URL
        </button>
        {value ? (
          <button type="button" onClick={() => onChange('')} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10">
            <Trash2 className="size-3.5" /> Remove
          </button>
        ) : null}
      </div>
      {showUrl && <Input className="mt-2" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="https://…" />}
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
      <input ref={input} type="file" accept={accept} hidden onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}

export function Loading() {
  return (
    <div className="grid place-items-center py-24 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">{children}</div>;
}

export const confirmDelete = (what: string) => window.confirm(`Delete ${what}? This can’t be undone.`);
