'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/graphics/Icon';
import { Mono, Pill, Sk } from '@/components/ui/atoms';
import { EmptyApps, EmptySearch } from '@/components/ui/EmptyStates';
import { useData } from '@/components/providers/DataProvider';
import { usePop } from '@/components/providers/PopProvider';
import { useAppActions } from '@/components/modals/useAppActions';
import { ST, SOURCES, KEYS, TRANS as TRANS_MAP } from '@/lib/status';
import type { Application, Status } from '@/lib/types';
import { fmtD, isoOff } from '@/lib/dates';
import { flags } from '@/lib/flags';

const LIMIT = 8;

export function ListSkeleton() {
  return (
    <>
      <div className="page-h"><div><Sk w="200px" h={40} /><div style={{ height: 12 }} /><Sk w="240px" h={18} /></div></div>
      <div className="fbar"><Sk w="100%" h={46} style={{ flex: 1 }} /></div>
      <div id="listBody">{Array.from({ length: 5 }, (_, i) => <SkRow key={i} />)}</div>
    </>
  );
}
const SkRow = () => (
  <div className="lrow">
    <div className="lr-id"><Sk w="44px" h={44} style={{ borderRadius: 15, flex: 'none' }} /><div style={{ display: 'grid', gap: 8, flex: 1 }}><Sk w="55%" h={16} /><Sk w="78%" h={13} /></div></div>
    <Sk w="100px" h={28} style={{ borderRadius: 99 }} /><Sk w="70%" h={14} /><Sk w="64px" h={14} /><div />
  </div>
);

export function ApplicationsList() {
  const { apps, ready } = useData();
  const { menu } = usePop();
  const { openAppForm, confirmDelete } = useAppActions();
  const searchRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status | ''>('');
  const [source, setSource] = useState('');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (flags.focusSearch) { flags.focusSearch = false; searchRef.current?.focus(); }
  }, []);
  useEffect(() => { setOffset(0); }, [status, source, q, from, to]);

  const anyFilter = !!(status || source || q || from || to);
  const dateLabel = !from && !to ? 'Any date' : from && to ? `${fmtD(from)} to ${fmtD(to)}` : from ? `From ${fmtD(from)}` : `Until ${fmtD(to)}`;

  const rowsAll = useMemo(() => {
    const query = q.trim().toLowerCase();
    return apps.filter((a) =>
      (!status || a.status === status) &&
      (!source || a.source === source) &&
      (!query || `${a.company} ${a.title} ${a.location ?? ''} ${a.notes ?? ''}`.toLowerCase().includes(query)) &&
      (!from || (a.applied_at && a.applied_at >= from)) &&
      (!to || (a.applied_at && a.applied_at <= to)),
    ).sort((a, b) => (b.applied_at ?? '').localeCompare(a.applied_at ?? '') || b.created_at.localeCompare(a.created_at));
  }, [apps, status, source, q, from, to]);

  const total = rowsAll.length;
  const rows = rowsAll.slice(offset, offset + LIMIT);
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const curPage = Math.floor(offset / LIMIT) + 1;

  const clearFilters = () => { setStatus(''); setSource(''); setQ(''); setFrom(''); setTo(''); };

  const statusFilterMenu = (anchor: HTMLElement) =>
    menu(anchor, [{ value: '', icon: 'layers', label: 'All statuses' }, ...KEYS.map((k) => ({ value: k, status: k, label: ST[k].label }))],
      { selected: status, title: 'Status', onSelect: (v) => setStatus(v as Status | '') });
  const sourceOptions = useMemo(() => [...new Set(apps.map((a) => a.source).filter(Boolean).concat(SOURCES))] as string[], [apps]);
  const sourceFilterMenu = (anchor: HTMLElement) =>
    menu(anchor, [{ value: '', icon: 'globe', label: 'All sources' }, ...sourceOptions.map((s) => ({ value: s, icon: 'globe' as const, label: s }))],
      { selected: source, title: 'Source', onSelect: setSource });
  const dateFilterPop = (anchor: HTMLElement) => {
    const { popover } = pop;
    popover(anchor, (close) => <DatePop from={from} to={to} onApply={(f, t) => { setFrom(f); setTo(t); close(); }} />, { align: 'start' });
  };
  const pop = usePop();

  if (!ready) return <ListSkeleton />;

  return (
    <>
      <div className="page-h">
        <div><h1>All applications</h1><p className="sub">{apps.length} {apps.length === 1 ? 'application' : 'applications'} in total.</p></div>
        <div className="page-tools"><button className="btn primary" onClick={() => openAppForm()}><Icon name="plus" size={18} />New application</button></div>
      </div>
      <div className="fbar" role="search">
        <label className="search"><Icon name="search" size={18} /><input ref={searchRef} type="search" placeholder="Search company, role or notes" aria-label="Search applications" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <button className={`dd${status ? ' on' : ''}`} onClick={(e) => statusFilterMenu(e.currentTarget)} aria-haspopup="listbox" aria-expanded="false">
          <Icon name={status || 'layers'} size={18} /><span>{status ? ST[status].label : 'All statuses'}</span><Icon name="chevD" size={16} />
        </button>
        <button className={`dd${source ? ' on' : ''}`} onClick={(e) => sourceFilterMenu(e.currentTarget)} aria-haspopup="listbox" aria-expanded="false">
          <Icon name="globe" size={18} /><span>{source || 'All sources'}</span><Icon name="chevD" size={16} />
        </button>
        <button className={`dd${from || to ? ' on' : ''}`} onClick={(e) => dateFilterPop(e.currentTarget)} aria-haspopup="dialog" aria-expanded="false">
          <Icon name="calendar" size={18} /><span>{dateLabel}</span><Icon name="chevD" size={16} />
        </button>
        {anyFilter && <button className="btn plain" onClick={clearFilters}>Clear</button>}
      </div>

      {!apps.length ? (
        <EmptyApps onAdd={() => openAppForm()} />
      ) : !total ? (
        <EmptySearch onClear={clearFilters} />
      ) : (
        <>
          <div className="lhead" aria-hidden="true"><span>Application</span><span>Status</span><span>Source</span><span>Applied</span><span /></div>
          <div id="listBody">
            {rows.map((a, i) => (
              <Row key={a.id} app={a} index={i} onDelete={() => confirmDelete(a)} />
            ))}
          </div>
          <nav className="pager" aria-label="Pagination">
            <span>Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}</span>
            {pages > 1 && (
              <div className="pg">
                <button disabled={curPage === 1} aria-label="Previous page" onClick={() => setOffset((curPage - 2) * LIMIT)}><Icon name="chevL" size={18} /></button>
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={p === curPage ? 'on' : ''} aria-current={p === curPage ? 'page' : undefined} aria-label={`Page ${p}`} onClick={() => setOffset((p - 1) * LIMIT)}>{p}</button>
                ))}
                <button disabled={curPage === pages} aria-label="Next page" onClick={() => setOffset(curPage * LIMIT)}><Icon name="chevR" size={18} /></button>
              </div>
            )}
          </nav>
        </>
      )}
    </>
  );
}

const TRANS = (a: Application) => TRANS_MAP[a.status];

function Row({ app, index, onDelete }: { app: Application; index: number; onDelete: () => void }) {
  const { move } = useData();
  const { menu } = usePop();
  const { openFollowUp } = useAppActions();
  const moveMenu = (anchor: HTMLElement) => menu(anchor, TRANS(app).map((k) => ({ value: k, status: k, label: ST[k].label, hint: ST[k].desc })), {
    align: 'end', title: `Move ${app.company} to`, onSelect: (v) => void move(app.id, v as Status),
  });
  return (
    <article className="lrow stg" style={{ '--i': index } as React.CSSProperties}>
      <div className="lr-id"><Mono name={app.company} size={44} /><div className="lr-t"><Link className="lr-co" href={`/applications/${app.id}`}>{app.company}</Link><span className="lr-ti">{app.title}</span></div></div>
      <div className="lr-st"><Pill k={app.status} /></div>
      <div className="lr-src"><Icon name="globe" size={16} /><span>{app.source || 'No source'}</span></div>
      <div className="lr-date">{app.applied_at ? fmtD(app.applied_at) : 'Not applied'}</div>
      <div className="lr-act">
        <button className="btn-icon" onClick={(e) => moveMenu(e.currentTarget)} aria-label={`Change status of ${app.company}`} aria-haspopup="listbox" aria-expanded="false"><Icon name="status_changed" size={18} /></button>
        <button className="btn-icon" onClick={() => openFollowUp(app)} aria-label={`Add a follow-up for ${app.company}`}><Icon name="bell" size={18} /></button>
        <button className="btn-icon danger" onClick={onDelete} aria-label={`Delete ${app.company}`}><Icon name="trash" size={18} /></button>
      </div>
    </article>
  );
}

function DatePop({ from, to, onApply }: { from: string; to: string; onApply: (f: string, t: string) => void }) {
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);
  const preset = (n: number) => n === 0 ? onApply('', '') : onApply(isoOff(-n), isoOff(0));
  return (
    <>
      <h4>Applied between</h4>
      <div className="presets">
        {([['Last 7 days', 7], ['Last 30 days', 30], ['Last 90 days', 90], ['Any date', 0]] as const).map(([l, n]) => (
          <button key={l} className="chip" onClick={() => preset(n)}>{l}</button>
        ))}
      </div>
      <div className="pop-row">
        <div className="field"><label htmlFor="d-from">From</label><input className="input" id="d-from" type="date" value={f} onChange={(e) => setF(e.target.value)} /></div>
        <div className="field"><label htmlFor="d-to">To</label><input className="input" id="d-to" type="date" value={t} onChange={(e) => setT(e.target.value)} /></div>
      </div>
      <button className="btn primary block" onClick={() => onApply(f, t)}>Apply range</button>
    </>
  );
}
