'use client';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/graphics/Icon';
import { Mono, DueBadge, Sk } from '@/components/ui/atoms';
import { EmptyApps } from '@/components/ui/EmptyStates';
import { useData } from '@/components/providers/DataProvider';
import { usePop, type MenuItem } from '@/components/providers/PopProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useAppActions } from '@/components/modals/useAppActions';
import { useAutoFlip } from '@/lib/useFlip';
import { burstFrom } from '@/lib/confetti';
import { ApiError } from '@/lib/api';
import { CLOSED, MAIN, ST, TRANS, canMove, listWords } from '@/lib/status';
import type { Application, Status } from '@/lib/types';
import { diffDays, fmtD } from '@/lib/dates';

export function BoardSkeleton() {
  return (
    <>
      <div className="page-h"><div><Sk w="280px" h={38} /><div style={{ height: 12 }} /><Sk w="210px" h={18} /></div></div>
      <div className="board-wrap"><div className="board">
        {MAIN.map((k) => (
          <div className="col" key={k}>
            <div className="col-h"><Sk w="30px" h={30} style={{ borderRadius: 10 }} /><Sk w="90px" h={18} /></div>
            <div className="col-b">{[0, 1].map((i) => (
              <div className="sk-card" key={i}><Sk w="70%" h={18} /><Sk w="92%" h={14} /><Sk w="50%" h={12} /></div>
            ))}</div>
          </div>
        ))}
      </div></div>
    </>
  );
}

/** A drop target rejected because the transition is illegal. Cleared automatically. */
interface NopeState { status: Status; from: Status; to: Status }

export function Board() {
  const { apps, followUps, ready, move } = useData();
  const toast = useToast();
  const { openAppForm } = useAppActions();
  const { menu } = usePop();
  const [q, setQ] = useState('');
  const [closedOpen, setClosedOpen] = useState(false);
  const [nope, setNope] = useState<NopeState | null>(null);
  const [dragApp, setDragApp] = useState<Application | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  useAutoFlip(boardRef);

  const dueSoonById = useMemo(() => {
    const m = new Map<number, string>();
    followUps.filter((f) => f.status === 'open').forEach((f) => {
      const cur = m.get(f.application_id);
      if (!cur || f.due_at < cur) m.set(f.application_id, f.due_at);
    });
    return m;
  }, [followUps]);

  const query = q.trim().toLowerCase();
  const matches = (a: Application) => !query || `${a.company} ${a.title} ${a.location ?? ''}`.toLowerCase().includes(query);
  const byStatus = (k: Status) => apps.filter((a) => a.status === k && matches(a))
    .sort((a, b) => (b.applied_at ?? '').localeCompare(a.applied_at ?? '') || b.created_at.localeCompare(a.created_at));

  const active = apps.filter((a) => !CLOSED.includes(a.status)).length;
  const n = followUps.filter((f) => f.status === 'open' && diffDays(f.due_at) <= 0).length;

  const cardMenuItems = (app: Application): MenuItem[] => TRANS[app.status].map((k) => ({ value: k, status: k, label: ST[k].label, hint: ST[k].desc }));

  async function doMove(app: Application, to: Status) {
    if (!canMove(app.status, to)) return;
    const from = app.status;
    const isOffer = to === 'offer';
    try {
      await move(app.id, to); // optimistic; DataProvider rolls back on 409
      toast(<>Moved <b>{app.company}</b> to {ST[to].label}</>);
      if (isOffer) requestAnimationFrame(() => burstFrom(document.querySelector(`.kcard[data-id="${app.id}"] .pcard, .kcard[data-id="${app.id}"]`)));
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) toast(<>Can&apos;t move <b>{ST[from].label}</b> to <b>{ST[to].label}</b>. Reload to see the allowed steps.</>, { type: 'err' });
      else toast('Could not update the status. Try again.', { type: 'err' });
    }
  }

  /* ---- native HTML5 drag and drop ---- */
  const dragRef = useRef<{ app: Application } | null>(null);
  function onDragStart(e: React.DragEvent, app: Application) {
    dragRef.current = { app };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(app.id));
    // Update React state on the next tick: re-rendering synchronously inside dragstart can cancel the native drag.
    setTimeout(() => setDragApp(app), 0);
  }
  function onDragEnd() {
    dragRef.current = null;
    setDragApp(null);
    setNope(null);
  }
  // dragover fires continuously on whatever is under the cursor, so it is the reliable place to decide
  // "legal target" vs "illegal target" (dragenter/dragleave bubble from children and flicker).
  function onColDragOver(e: React.DragEvent, k: Status) {
    const d = dragRef.current;
    if (!d) return;
    if (canMove(d.app.status, k)) {
      e.preventDefault(); e.dataTransfer.dropEffect = 'move';
      setNope((cur) => (cur ? null : cur));
    } else {
      e.dataTransfer.dropEffect = 'none';
      if (k !== d.app.status) setNope((cur) => (cur?.status === k ? cur : { status: k, from: d.app.status, to: k }));
    }
  }
  function onColDragLeave(e: React.DragEvent, k: Status) {
    // only clear when the pointer really left the column (not when it moved onto a child element)
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setNope((cur) => (cur?.status === k ? null : cur));
  }
  function onColDrop(e: React.DragEvent, k: Status) {
    e.preventDefault();
    const d = dragRef.current;
    setNope(null);
    if (!d || !canMove(d.app.status, k)) return;
    void doMove(d.app, k);
  }

  if (!ready) return <BoardSkeleton />;

  const col = (k: Status) => {
    const items = byStatus(k);
    const isOk = dragApp ? canMove(dragApp.status, k) : false;
    const isNo = dragApp ? !isOk && k !== dragApp.status : false;
    return (
      <section
        key={k} className={`col st-${k}${isOk ? ' ok' : ''}${isNo ? ' no' : ''}${nope?.status === k ? ' nope' : ''}`}
        data-status={k} aria-label={`${ST[k].label}, ${items.length} ${items.length === 1 ? 'application' : 'applications'}`}
        onDragOver={(e) => onColDragOver(e, k)} onDragLeave={(e) => onColDragLeave(e, k)} onDrop={(e) => onColDrop(e, k)}
      >
        <header className="col-h"><span className={`tile st-${k}`} style={{ '--sz': '30px' } as React.CSSProperties}><Icon name={k} size={17} /></span><h2>{ST[k].label}</h2><span className="col-n">{items.length}</span></header>
        <div className="col-b">
          {items.length ? items.map((a, i) => <KanbanCard key={a.id} app={a} index={i} dragging={dragApp?.id === a.id} dueAt={dueSoonById.get(a.id)} onMenu={(anchor) => menu(anchor, cardMenuItems(a), { align: 'end', title: `Move ${a.company} to`, onSelect: (v) => void doMove(a, v as Status) })} onDragStart={onDragStart} onDragEnd={onDragEnd} />) : <div className="col-empty">{query ? 'No matches' : 'Nothing here yet'}</div>}
        </div>
        <div className="col-nope" role="status">
          {nope?.status === k && (
            <>
              <b>Can&apos;t move {ST[nope.from].label} to {ST[nope.to].label}</b>
              <span>From {ST[nope.from].label} you can go to {listWords(TRANS[nope.from].map((x) => ST[x].label))}.</span>
            </>
          )}
        </div>
      </section>
    );
  };

  return (
    <>
      <div className="page-h">
        <div><h1>Your pipeline</h1><p className="sub">{active} active {active === 1 ? 'application' : 'applications'}. {n ? `${n} ${n === 1 ? 'follow-up needs' : 'follow-ups need'} you now.` : 'Nothing is overdue.'}</p></div>
        <div className="page-tools">
          <label className="search"><Icon name="search" size={18} /><input type="search" placeholder="Filter cards" aria-label="Filter cards" value={q} onChange={(e) => setQ(e.target.value)} /></label>
          <button className="btn primary" onClick={() => openAppForm()}><Icon name="plus" size={18} />New application</button>
        </div>
      </div>
      {!apps.length ? (
        <EmptyApps onAdd={() => openAppForm()} />
      ) : (
        <div ref={boardRef} className={dragApp ? 'drag-on' : ''}>
          <div className="board-wrap"><div className="board" id="board">{MAIN.map(col)}</div></div>
          <section className={`closed${closedOpen ? ' open' : ''}`} aria-label="Closed applications">
            <div className="closed-h">
              <button className="closed-toggle" aria-expanded={closedOpen} onClick={() => setClosedOpen((s) => !s)}>Closed applications<Icon name="chevD" size={16} /></button>
              <p>Rejected, withdrawn and archived</p>
            </div>
            <div className="closed-cols">{CLOSED.map(col)}</div>
          </section>
        </div>
      )}
    </>
  );
}

function KanbanCard({ app, index, dueAt, dragging, onMenu, onDragStart, onDragEnd }: {
  app: Application; index: number; dueAt?: string; dragging: boolean;
  onMenu: (anchor: HTMLElement) => void;
  onDragStart: (e: React.DragEvent, app: Application) => void;
  onDragEnd: () => void;
}) {
  return (
    <article
      className={`kcard stg${dragging ? ' dragging' : ''}`} draggable data-flip data-id={app.id} style={{ '--i': index } as React.CSSProperties}
      aria-label={`${app.company}, ${app.title}, ${ST[app.status].label}`}
      onDragStart={(e) => onDragStart(e, app)} onDragEnd={() => onDragEnd()}
    >
      <div className="kc-top">
        <Mono name={app.company} size={36} />
        <div className="kc-t"><strong>{app.company}</strong><span>{app.title}</span></div>
        <button className="btn-icon kc-more" onClick={(e) => onMenu(e.currentTarget)} aria-label={`Move ${app.company} to another status`} aria-haspopup="listbox" aria-expanded="false"><Icon name="dots" size={18} /></button>
      </div>
      <div className="kc-f">
        <span className="kc-date">
          <Icon name="calendar" size={14} />
          {app.applied_at ? <><span className="sr">Applied </span>{fmtD(app.applied_at)}</> : 'Not applied'}
        </span>
        {dueAt && <DueBadge date={dueAt} />}
      </div>
      <Link className="kc-link" href={`/applications/${app.id}`} draggable={false} aria-label={`Open ${app.company}`} />
    </article>
  );
}
