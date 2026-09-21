'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Empty, Loading, PageHeader, Select } from '@/components/admin/ui';
import { Input } from '@/components/ui/input';
import { errorText } from '@/lib/admin';
import { fmtDate, inr } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAsync } from '@/lib/use-async';

type P = { id: string; full_name: string | null; email: string | null; role: string; shop_for: string | null; created_at: string };

/** Customer list, order totals, and — for the super admin — who else can use this panel. */
export default function Customers() {
  const [q, setQ] = useState('');
  const me = useAsync(async () => (await supabase.rpc('is_super_admin')).data as boolean, []);
  const people = useAsync(async () => {
    let query = supabase.from('profiles').select('id, full_name, email, role, shop_for, created_at').order('created_at', { ascending: false }).limit(300);
    if (q.trim()) query = query.or(`full_name.ilike.%${q.trim()}%,email.ilike.%${q.trim()}%`);
    const { data, error } = await query;
    if (error) throw error;
    const { data: orders } = await supabase.from('orders').select('user_id, total, status');
    const totals = new Map<string, { n: number; spent: number }>();
    (orders ?? []).forEach((o) => {
      if (o.status === 'cancelled') return;
      const t = totals.get(o.user_id) ?? { n: 0, spent: 0 };
      t.n += 1;
      t.spent += Number(o.total);
      totals.set(o.user_id, t);
    });
    return (data as P[]).map((p) => ({ ...p, ...(totals.get(p.id) ?? { n: 0, spent: 0 }) }));
  }, [q]);

  const setRole = async (p: P, role: string) => {
    if (!window.confirm(`Make ${p.email ?? p.full_name} ${role === 'customer' ? 'a regular customer' : `an ${role.replace('_', ' ')}`}?`)) return;
    const { error } = await supabase.from('profiles').update({ role }).eq('id', p.id);
    if (error) return toast.error(errorText(error));
    toast.success('Access updated');
    people.reload();
  };

  return (
    <>
      <PageHeader title="Customers" subtitle="Everyone who has signed in to the app." actions={<Input placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} className="w-56" />} />
      {people.loading ? (
        <Loading />
      ) : !people.data?.length ? (
        <Empty>No customers yet.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium">Spent</th>
                <th className="px-4 py-3 font-medium">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {people.data.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.email ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(p.created_at)}</td>
                  <td className="px-4 py-3">{p.n}</td>
                  <td className="px-4 py-3">{inr(p.spent)}</td>
                  <td className="px-4 py-3">
                    {me.data ? (
                      <Select
                        value={p.role}
                        onChange={(v) => v !== p.role && setRole(p, v)}
                        options={[
                          { value: 'customer', label: 'Customer' },
                          { value: 'admin', label: 'Admin' },
                          { value: 'super_admin', label: 'Super admin' },
                        ]}
                        className="h-8 w-36"
                      />
                    ) : (
                      <span className="capitalize text-muted-foreground">{p.role.replace('_', ' ')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
