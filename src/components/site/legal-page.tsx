'use client';

import { useSite } from './site-data';

/** Privacy / terms text, edited in Admin → Website. */
export function LegalPage({ title, field }: { title: string; field: 'privacy' | 'terms' }) {
  const { settings } = useSite();
  const text = settings?.site[field];
  return (
    <article className="mx-auto max-w-2xl px-5 py-14 md:py-20">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      {settings === undefined ? (
        <div className="mt-8 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : (
        <div className="mt-8 space-y-4 leading-relaxed text-muted-foreground">
          {(text ?? '').split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          {settings?.support_email ? (
            <p>
              Contact: <a className="text-foreground underline" href={`mailto:${settings.support_email}`}>{settings.support_email}</a>
            </p>
          ) : null}
        </div>
      )}
    </article>
  );
}
