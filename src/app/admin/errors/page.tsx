'use client';

import { toast } from 'sonner';

import { Empty, Loading, PageHeader } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { errorText } from '@/lib/admin';
import { fmtDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAsync } from '@/lib/use-async';

type Row = { id: number; created_at: string; message: string; stack: string | null; fatal: boolean; platform: string | null; update_id: string | null };

/** Errors reported by the app — send these to the developer when something breaks. */
export default function AppErrors() {
  const rows = useAsync(async () => {
    const { data, error } = await supabase.from('app_errors').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return (data ?? []) as Row[];
  }, []);

  const clear = async () => {
    if (!window.confirm('Clear all error reports?')) return;
    const { error } = await supabase.from('app_errors').delete().gt('id', 0);
    if (error) return toast.error(errorText(error));
    rows.reload();
  };

  return (
    <>
      <PageHeader
        title="App errors"
        subtitle="Crashes and errors reported by the app, newest first."
        actions={
          <Button variant="outline" className="h-9 px-4" onClick={clear}>
            Clear all
          </Button>
        }
      />
      {rows.loading ? (
        <Loading />
      ) : rows.error ? (
        <p className="text-sm text-red-700">{errorText(rows.error)} — run RUN-THIS-2.sql in Supabase first.</p>
      ) : !rows.data?.length ? (
        <Empty>No errors reported</Empty>
      ) : (
        <ul className="space-y-3">
          {rows.data.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-white p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {r.fatal ? <span className="rounded-full bg-red-50 px-2 py-0.5 font-semibold text-red-700">Crash</span> : null}
                <span>{fmtDate(r.created_at, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
                <span>· {r.platform}</span>
                <span>· update {r.update_id ?? '—'}</span>
              </div>
              <p className="mt-2 break-words text-sm font-medium">{r.message}</p>
              {r.stack ? (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground">Details</summary>
                  <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-[11px] text-muted-foreground">{r.stack}</pre>
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
