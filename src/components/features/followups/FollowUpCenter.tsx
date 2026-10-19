'use client';
import { useMemo, useState } from 'react';
import { Sk } from '@/components/ui/atoms';
import { EmptyFollowUps } from '@/components/ui/EmptyStates';
import { FollowUpRow } from '@/components/features/detail/ApplicationDetail';
import { useData } from '@/components/providers/DataProvider';
import { useAppActions } from '@/components/modals/useAppActions';
import { diffDays, isoOff, parseD } from '@/lib/dates';
import type { FollowUp } from '@/lib/types';

export function FollowUpsSkeleton() {
  return (
    <>
      <div className="page-h"><div><Sk w="220px" h={40} /><div style={{ height: 12 }} /><Sk w="300px" h={18} /></div></div>
      <div className="week">{Array.from({ length: 9 }, (_, i) => <Sk key={i} w="100%" h={88} style={{ borderRadius: 20 }} />)}</div>
      <div className="card" style={{ padding: '14px 20px' }}>
        {Array.from({ length: 4 }, (_, i) => <div key={i} style={{ padding: '12px 0', display: 'grid', gap: 8 }}><Sk w="50%" h={16} /><Sk w="30%" h={12} /></div>)}
      </div>
    </>
  );
}

type Filter = 'all' | 'overdue' | 'later' | string; // string = a specific YYYY-MM-DD

export function FollowUpCenter() {
  const { apps, followUps, ready, updateFollowUp } = useData();
  const { reschedule } = useAppActions();
  const [filter, setFilter] = useState<Filter>('all');

  const open = useMemo(() => followUps.filter((f) => f.status === 'open').sort((a, b) => a.due_at.localeCompare(b.due_at)), [followUps]);
  const overdue = open.filter((f) => diffDays(f.due_at) < 0);
  const days = Array.from({ length: 7 }, (_, i) => isoOff(i));
  const byDay = (d: string) => open.filter((f) => f.due_at === d);
  const later = open.filter((f) => diffDays(f.due_at) > 6);
  const finished = useMemo(() => followUps.filter((f) => f.status !== 'open').sort((a, b) => b.due_at.localeCompare(a.due_at)), [followUps]);

  if (!ready) return <FollowUpsSkeleton />;
  if (!open.length) return (<><Header sub="Nothing waiting on you." /><EmptyFollowUps /></>);

  const nToday = byDay(days[0]).length;
  const sub = overdue.length || nToday
    ? `${overdue.length ? overdue.length + ' overdue' : ''}${overdue.length && nToday ? ', ' : ''}${nToday ? nToday + ' due today' : ''}. The rest are on the calendar below.`
    : `${open.length} on the calendar. Nothing is due yet.`;

  const appOf = (f: FollowUp) => apps.find((a) => a.id === f.application_id);
  const appInfo = (f: FollowUp) => {
    const a = appOf(f);
    return a ? { company: a.company, title: a.title, href: `/applications/${a.id}` } : undefined;
  };

  const List = ({ title, items }: { title: string; items: FollowUp[] }) => items.length ? (
    <section className="fu-group">
      <h3>{title}<span>{items.length}</span></h3>
      <div className="card fu-list stagger">
        {items.map((f, i) => <div key={f.id} className="stg" style={{ '--i': i } as React.CSSProperties}><FollowUpRow fu={f} updateFollowUp={updateFollowUp} reschedule={reschedule} appInfo={appInfo(f)} /></div>)}
      </div>
    </section>
  ) : null;

  let groups: React.ReactNode;
  if (filter === 'overdue') groups = <List title="Overdue" items={overdue} />;
  else if (filter === 'later') groups = <List title="Later" items={later} />;
  else if (filter !== 'all') groups = <List title={diffDays(filter) === 0 ? 'Today' : parseD(filter).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} items={byDay(filter)} />;
  else groups = (
    <>
      <List title="Overdue" items={overdue} />
      <List title="Today" items={byDay(days[0])} />
      <List title="Next 7 days" items={open.filter((f) => { const n = diffDays(f.due_at); return n >= 1 && n <= 6; })} />
      <List title="Later" items={later} />
    </>
  );
  const hasGroups = filter === 'overdue' ? overdue.length : filter === 'later' ? later.length : filter !== 'all' ? byDay(filter).length : open.length;

  const Chip = ({ f, small, big, n, overdueStyle }: { f: string; small: string; big: number | string; n: number; overdueStyle?: boolean }) => (
    <button className={`wk${overdueStyle ? ' overdue' : ''}${filter === f ? ' on' : ''}`} aria-pressed={filter === f} aria-label={`${small} ${big}, ${n} ${n === 1 ? 'follow-up' : 'follow-ups'}`}
      onClick={() => setFilter((cur) => (cur === f && f !== 'all' ? 'all' : f))}>
      <small>{small}</small><b>{big}</b><i>{Array.from({ length: Math.min(n, 3) }, (_, idx) => <s key={idx} />)}</i>
    </button>
  );

  return (
    <>
      <Header sub={sub} />
      <div className="week" role="group" aria-label="Filter by due date">
        <Chip f="overdue" small="Overdue" big={overdue.length} n={overdue.length} overdueStyle={overdue.length > 0} />
        {days.map((d, i) => {
          const dt = parseD(d);
          return <Chip key={d} f={d} small={i === 0 ? 'Today' : dt.toLocaleDateString('en-US', { weekday: 'short' })} big={dt.getDate()} n={byDay(d).length} />;
        })}
        <Chip f="later" small="Later" big={later.length} n={later.length} />
      </div>
      {hasGroups ? groups : (
        <div className="empty" style={{ padding: 28 }}>
          <p>Nothing due here.</p>
          <div className="row-btn"><button className="btn ghost" onClick={() => setFilter('all')}>Show all follow-ups</button></div>
        </div>
      )}
      {finished.length > 0 && (
        <details className="fu-group" style={{ marginTop: 8 }}>
          <summary className="done-sum">Done and cancelled ({finished.length})</summary>
          <div className="card fu-list" style={{ marginTop: 8 }}>
            {finished.map((f) => <FollowUpRow key={f.id} fu={f} updateFollowUp={updateFollowUp} reschedule={reschedule} appInfo={appInfo(f)} />)}
          </div>
        </details>
      )}
    </>
  );
}

const Header = ({ sub }: { sub: string }) => (
  <div className="page-h"><div><h1>Follow-ups</h1><p className="sub">{sub}</p></div></div>
);
