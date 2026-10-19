'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/graphics/Icon';
import { Mono, Pill, CheckSvg, Sk, BusyDots, DueBadge } from '@/components/ui/atoms';
import { useData } from '@/components/providers/DataProvider';
import { usePop } from '@/components/providers/PopProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { useAppActions } from '@/components/modals/useAppActions';
import { useNav } from '@/components/providers/NavProvider';
import { burstFrom } from '@/lib/confetti';
import { ApiError, api } from '@/lib/api';
import { CLOSED, MAIN, ST, TRANS, listWords } from '@/lib/status';
import type { AppEvent, Application, EventType, FollowUp, Status } from '@/lib/types';
import { absT, fmtD, isoOff, rel } from '@/lib/dates';
import { FIELD_LABEL } from '@/lib/status';

export function DetailSkeleton() {
  return (
    <>
      <div style={{ height: 38 }} />
      <div className="card">
        <div className="d-head">
          <div className="d-id"><Sk w="60px" h={60} style={{ borderRadius: 20 }} /><div style={{ display: 'grid', gap: 10, flex: 1 }}><Sk w="50%" h={30} /><Sk w="70%" h={18} /></div></div>
          <Sk w="150px" h={44} style={{ borderRadius: 99 }} />
        </div>
        <div style={{ padding: '22px 24px', borderTop: '1px solid var(--line)' }}><Sk w="100%" h={32} /></div>
      </div>
      <div className="d-grid">
        <div className="d-col">
          <div className="sk-card" style={{ padding: 24 }}>{[80, 60, 70].map((w, i) => <div key={i}><Sk w={w + '%'} h={16} /><div style={{ height: 14 }} /></div>)}</div>
          <div className="sk-card" style={{ height: 180 }} />
        </div>
        <div className="sk-card" style={{ height: 320 }} />
      </div>
    </>
  );
}

const CHK_ICONS = { application_created: 'application_created', edited: 'edited', status_changed: 'status_changed', follow_up_created: 'follow_up_created' } as const satisfies Record<EventType, EventType>;

export function ApplicationDetail({ id }: { id: number }) {
  const { apps, followUps, updateApp, deleteApp, move, createFollowUp, updateFollowUp } = useData();
  const { lastView } = useNav();
  const { menu } = usePop();
  const toast = useToast();
  const { confirmDelete, reschedule } = useAppActions();

  const app = apps.find((a) => a.id === id);
  const [events, setEvents] = useState<AppEvent[] | null>(null);
  const [freshEventId, setFreshEventId] = useState<number | null>(null);

  // TODO(API): GET /applications/{id} returns the application AND its timeline together; we already
  // have the application from the shared cache, so we only need the events here.
  useEffect(() => {
    let alive = true;
    setEvents(null);
    api.applications.get(id).then((r) => { if (alive) setEvents(r.events); }).catch(() => { if (alive) setEvents([]); });
    return () => { alive = false; };
  }, [id]);

  const pushLocalEvent = (type: EventType, data: AppEvent['data']) => {
    setEvents((l) => {
      const ev: AppEvent = { id: Date.now(), application_id: id, type, created_at: new Date().toISOString(), data };
      setFreshEventId(ev.id);
      return [ev, ...(l ?? [])];
    });
  };

  if (!app) return <DetailSkeleton />;

  const myFollowUps = followUps.filter((f) => f.application_id === id);
  const crumb = ({ overview: 'Overview', board: 'Pipeline', list: 'All applications', followups: 'Follow-ups' } as Record<string, string>)[lastView] ?? 'Overview';

  async function onMove(to: Status) {
    const from = app!.status;
    try {
      await move(app!.id, to);
      pushLocalEvent('status_changed', { from, to });
      toast(<>Moved <b>{app!.company}</b> to {ST[to].label}</>);
      if (to === 'offer') requestAnimationFrame(() => burstFrom(document.getElementById('stPill')));
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) toast(<>Can&apos;t move <b>{ST[from].label}</b> to <b>{ST[to].label}</b>.</>, { type: 'err' });
      else toast('Could not update the status. Try again.', { type: 'err' });
    }
  }
  const statusMenu = (anchor: HTMLElement) =>
    menu(anchor, TRANS[app!.status].map((k) => ({ value: k, status: k, label: ST[k].label, hint: ST[k].desc })), {
      title: `Move from ${ST[app!.status].label} to`,
      foot: `Only steps your pipeline allows are listed.`,
      onSelect: (v) => void onMove(v as Status),
    });

  return (
    <>
      <Link className="crumb" href={`/${lastView === 'board' ? 'board' : lastView}`}><Icon name="chevL" size={18} />{crumb}</Link>
      <div className="card">
        <DetailHead app={app} onStatusClick={statusMenu} onDelete={() => confirmDelete(app, () => history.back())} onFieldSaved={(fields) => pushLocalEvent('edited', { fields })} updateApp={updateApp} deleteApp={deleteApp} />
        <StatusTrack app={app} events={events} />
      </div>
      <div className="d-grid">
        <div className="d-col">
          <DetailsCard app={app} onFieldSaved={(fields) => pushLocalEvent('edited', { fields })} updateApp={updateApp} />
          <NotesCard app={app} updateApp={updateApp} onSaved={() => pushLocalEvent('edited', { fields: ['notes'] })} />
          <FollowUpsCard app={app} items={myFollowUps} createFollowUp={createFollowUp} updateFollowUp={updateFollowUp} reschedule={reschedule} onCreated={(t, d) => pushLocalEvent('follow_up_created', { title: t, due: d })} />
        </div>
        <div className="d-col">
          <section className="card sect sticky stg" style={{ '--i': 2 } as React.CSSProperties} aria-label="Activity">
            <div className="sect-h"><h3>Activity</h3></div>
            <ol className="tl">
              {events === null ? <Sk w="100%" h={80} /> : events.map((e, i) => (
                <TimelineEntry key={e.id ?? `${e.type}-${e.created_at}-${i}`} e={e} fresh={e.id === freshEventId} />
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ head + track */
function DetailHead({ app, onStatusClick, onDelete, onFieldSaved, updateApp }: {
  app: Application; onStatusClick: (a: HTMLElement) => void; onDelete: () => void; onFieldSaved: (fields: string[]) => void;
  updateApp: (id: number, patch: Partial<Application>) => Promise<Application>; deleteApp: (id: number) => Promise<void>;
}) {
  const { openAppForm } = useAppActions();
  return (
    <div className="d-head">
      <div className="d-id">
        <Mono name={app.company} size={60} />
        <div style={{ minWidth: 0 }}>
          <h1><InlineEdit value={app.company} field="company" appId={app.id} label="company name" updateApp={updateApp} onSaved={onFieldSaved} /></h1>
          <h2><InlineEdit value={app.title} field="title" appId={app.id} label="job title" updateApp={updateApp} onSaved={onFieldSaved} /></h2>
        </div>
      </div>
      <div className="d-tools">
        <button className={`pill big st-${app.status}`} id="stPill" onClick={(e) => onStatusClick(e.currentTarget)} aria-haspopup="listbox" aria-expanded="false" aria-label={`Status: ${ST[app.status].label}. Change status`}>
          <Icon name={app.status} size={18} /><span>{ST[app.status].label}</span><Icon name="chevD" size={16} />
        </button>
        <button className="btn ghost" onClick={() => openAppForm(app)}><Icon name="edited" size={18} />Edit details</button>
        <button className="btn-icon danger" onClick={onDelete} aria-label="Delete application"><Icon name="trash" size={20} /></button>
      </div>
    </div>
  );
}

/** Click-to-edit company / job title. Enter or blur saves, Escape cancels. */
function InlineEdit({ value, field, appId, label, updateApp, onSaved }: {
  value: string; field: 'company' | 'title'; appId: number; label: string;
  updateApp: (id: number, patch: Partial<Application>) => Promise<Application>; onSaved: (fields: string[]) => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (editing) { ref.current?.focus(); ref.current?.select(); } }, [editing]);
  useEffect(() => { setV(value); }, [value]);

  async function finish(save: boolean) {
    setEditing(false);
    const trimmed = v.trim();
    if (save && trimmed && trimmed !== value) {
      try { await updateApp(appId, { [field]: trimmed } as Partial<Application>); toast('Saved'); onSaved([field]); }
      catch { setV(value); toast('Could not save. Try again.', { type: 'err' }); }
    } else setV(value);
    requestAnimationFrame(() => btnRef.current?.focus());
  }

  if (editing) {
    return (
      <input ref={ref} className="inline-input" value={v} maxLength={255} aria-label={label}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => void finish(true)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void finish(true); } if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); void finish(false); } }} />
    );
  }
  return (
    <button ref={btnRef} type="button" className="inline" onClick={() => setEditing(true)} aria-label={`Edit ${label}`}>
      {value}<Icon name="edited" size={label === 'company name' ? 16 : 15} />
    </button>
  );
}

function StatusTrack({ app, events }: { app: Application; events: AppEvent[] | null }) {
  const changes = (events ?? []).filter((e) => e.type === 'status_changed');
  const reached = Math.max(0, ...changes.map((e) => MAIN.indexOf(e.data.to as Status)));
  const closed = CLOSED.includes(app.status);
  const cur = closed ? -1 : MAIN.indexOf(app.status);
  return (
    <>
      <ol className="track" aria-label="Pipeline progress">
        {MAIN.map((k, i) => {
          const state = closed ? (i <= reached ? 'done' : 'todo') : i < cur ? 'done' : i === cur ? 'cur' : 'todo';
          return (
            <li key={k} className={`tr ${state} st-${k}`} aria-current={state === 'cur' ? 'step' : undefined}>
              <span className="tr-dot">{state === 'done' ? <Icon name="check" size={15} /> : <Icon name={k} size={16} />}</span>
              <span>{ST[k].label}<span className="sr">{state === 'done' ? ', reached' : state === 'cur' ? ', current stage' : ''}</span></span>
            </li>
          );
        })}
      </ol>
      {closed && (
        <div className={`closed-note st-${app.status}`}>
          <Icon name={app.status} size={18} /><span>Closed as {ST[app.status].label.toLowerCase()}. {ST[app.status].desc}.</span>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ details + notes */
function DetailsCard({ app, onFieldSaved, updateApp }: { app: Application; onFieldSaved: (fields: string[]) => void; updateApp: (id: number, patch: Partial<Application>) => Promise<Application> }) {
  const { openAppForm } = useAppActions();
  let host = '';
  try { host = app.canonical_url ? new URL(app.canonical_url).hostname.replace(/^www\./, '') : ''; } catch { /* ignore */ }
  const Fact = ({ icon, label, value }: { icon: React.ComponentProps<typeof Icon>['name']; label: string; value: React.ReactNode }) => (
    <div className="fact"><Icon name={icon} size={20} /><div><dt>{label}</dt><dd>{value ?? <span className="none">Not set</span>}</dd></div></div>
  );
  return (
    <section className="card sect stg" style={{ '--i': 1 } as React.CSSProperties}>
      <div className="sect-h"><h3>Details</h3><button className="btn plain sm" onClick={() => openAppForm(app, () => onFieldSaved(['details']))}><Icon name="edited" size={16} />Edit</button></div>
      <dl className="facts" style={{ margin: 0 }}>
        <Fact icon="globe" label="Source" value={app.source} />
        <Fact icon="calendar" label="Applied" value={app.applied_at ? fmtD(app.applied_at, true) : null} />
        <Fact icon="pin" label="Location" value={app.location} />
        <Fact icon="coin" label="Salary" value={app.salary_text} />
        <div className="fact" style={{ gridColumn: '1/-1' }}>
          <Icon name="link" size={20} />
          <div style={{ minWidth: 0 }}>
            <dt>Job posting</dt>
            <dd>{app.canonical_url ? <a href={app.canonical_url} target="_blank" rel="noopener noreferrer">{host || app.canonical_url}<Icon name="external" size={14} /><span className="sr"> (opens in a new tab)</span></a> : <span className="none">Not set</span>}</dd>
          </div>
        </div>
      </dl>
    </section>
  );
}

function NotesCard({ app, updateApp, onSaved }: { app: Application; updateApp: (id: number, patch: Partial<Application>) => Promise<Application>; onSaved: () => void }) {
  const [v, setV] = useState(app.notes ?? '');
  const [savedFlash, setSavedFlash] = useState(false);
  useEffect(() => { setV(app.notes ?? ''); }, [app.id, app.notes]);

  async function onBlur() {
    if (v === (app.notes ?? '')) return;
    try {
      await updateApp(app.id, { notes: v || null }); // TODO(API): PATCH /applications/{id}  body: { notes }
      setSavedFlash(true);
      onSaved();
      setTimeout(() => setSavedFlash(false), 2200);
    } catch { /* keep the draft in the textarea, no destructive rollback */ }
  }
  return (
    <section className="card sect stg" style={{ '--i': 2 } as React.CSSProperties}>
      <div className="sect-h"><h3>Notes</h3><span className={`saved-note${savedFlash ? ' on' : ''}`}><Icon name="check" size={14} />Saved</span></div>
      <label className="sr" htmlFor="notes">Notes</label>
      <textarea className="input" id="notes" rows={5} maxLength={10000} placeholder="Prep notes, names, salary thoughts. Anything you'll want later." value={v} onChange={(e) => setV(e.target.value)} onBlur={onBlur} />
      <div className="notes-meta"><span>Saves when you click away.</span><span>{v.length.toLocaleString('en-US')} / 10,000</span></div>
    </section>
  );
}

/* ------------------------------------------------------------------ follow-ups */
function FollowUpsCard({ app, items, createFollowUp, updateFollowUp, reschedule, onCreated }: {
  app: Application; items: FollowUp[];
  createFollowUp: (appId: number, title: string, dueAt: string) => Promise<FollowUp>;
  updateFollowUp: (id: number, patch: { status?: FollowUp['status']; due_at?: string }) => Promise<FollowUp>;
  reschedule: (anchor: HTMLElement, fu: FollowUp, onDone?: () => void) => void;
  onCreated: (title: string, due: string) => void;
}) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState(isoOff(3));
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);

  const open = items.filter((f) => f.status === 'open').sort((a, b) => a.due_at.localeCompare(b.due_at));
  const closed = items.filter((f) => f.status !== 'open');

  async function save() {
    if (!title.trim()) { setShake(true); setTimeout(() => setShake(false), 500); return; }
    if (!dueAt) return;
    setBusy(true);
    try {
      await createFollowUp(app.id, title.trim(), dueAt); // TODO(API): POST /applications/{id}/actions
      toast('Follow-up added');
      onCreated(title.trim(), dueAt);
      setTitle(''); setDueAt(isoOff(3)); setAdding(false);
    } catch { toast('Could not add the follow-up.', { type: 'err' }); } finally { setBusy(false); }
  }

  return (
    <section className="card sect stg" style={{ '--i': 3 } as React.CSSProperties}>
      <div className="sect-h"><h3>Follow-ups</h3><button className="btn soft sm" aria-expanded={adding} onClick={() => setAdding((s) => !s)}><Icon name="plus" size={16} />Add follow-up</button></div>
      <div className={`fu-add${adding ? ' on' : ''}`}>
        <input className={`input${shake ? ' shake' : ''}`} placeholder="What's the next step?" aria-label="Follow-up title" maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="input" type="date" aria-label="Due date" value={dueAt} min={isoOff(0)} onChange={(e) => setDueAt(e.target.value)} />
        <button className="btn primary" onClick={save} disabled={busy}>{busy ? <BusyDots /> : 'Add'}</button>
      </div>
      {open.length ? open.map((f) => <FollowUpRow key={f.id} fu={f} updateFollowUp={updateFollowUp} reschedule={reschedule} />) : <p className="none-txt">No open follow-ups. Add one so the next step never slips.</p>}
      {closed.length > 0 && (
        <details>
          <summary className="done-sum"><Icon name="chevR" size={16} />Done and cancelled ({closed.length})</summary>
          {closed.map((f) => <FollowUpRow key={f.id} fu={f} updateFollowUp={updateFollowUp} reschedule={reschedule} />)}
        </details>
      )}
    </section>
  );
}

/** Shared by the detail page and the follow-up center. `appInfo` shows the mini company chip when set. */
export function FollowUpRow({ fu, updateFollowUp, reschedule, appInfo }: {
  fu: FollowUp; updateFollowUp: (id: number, patch: { status?: FollowUp['status']; due_at?: string }) => Promise<FollowUp>;
  reschedule: (anchor: HTMLElement, fu: FollowUp, onDone?: () => void) => void;
  appInfo?: { company: string; title: string; href: string };
}) {
  const toast = useToast();
  const [checked, setChecked] = useState(fu.status === 'done');
  const [leaving, setLeaving] = useState(false);
  const finished = fu.status !== 'open';

  async function complete() {
    if (checked) return;
    setChecked(true);
    try {
      await updateFollowUp(fu.id, { status: 'done' }); // TODO(API): PATCH /actions/{id}  body: { status: 'done' }
      toast('Follow-up completed');
    } catch { setChecked(false); toast('Could not complete the follow-up.', { type: 'err' }); return; }
    setTimeout(() => setLeaving(true), 750);
  }
  async function cancel() {
    try {
      await updateFollowUp(fu.id, { status: 'cancelled' }); // TODO(API): PATCH /actions/{id}  body: { status: 'cancelled' }
      toast('Follow-up cancelled', { type: 'info' });
      setLeaving(true);
    } catch { toast('Could not cancel the follow-up.', { type: 'err' }); }
  }

  if (leaving) return null; // row unmounts once the "done" animation had time to play

  return (
    <div className={`fu${checked ? ' finished' : ''}${fu.status === 'cancelled' ? ' cancelled' : ''}`}>
      <button className="chk" role="checkbox" aria-checked={fu.status === 'done'} aria-label={`Mark done: ${fu.title}`} disabled={finished} onClick={complete}><CheckSvg /></button>
      <div className="fu-main">
        <span className="fu-t">{fu.title}</span>
        <div className="fu-m">
          {fu.status === 'open' ? <DueBadge date={fu.due_at} /> : <span className="due d0">{fu.status === 'done' ? 'Done' : 'Cancelled'}</span>}
          <span className="hint">{fmtD(fu.due_at, true)}</span>
        </div>
      </div>
      {appInfo && (
        <Link className="fu-app" href={appInfo.href}>
          <Mono name={appInfo.company} size={32} />
          <div style={{ minWidth: 0 }}><strong>{appInfo.company}</strong><span>{appInfo.title}</span></div>
        </Link>
      )}
      <div className="fu-act">
        {fu.status === 'open' && (
          <>
            <button className="btn-icon" onClick={(e) => reschedule(e.currentTarget, fu)} aria-label={`Reschedule: ${fu.title}`} aria-haspopup="dialog" aria-expanded="false"><Icon name="calendar" size={18} /></button>
            <button className="btn-icon danger" onClick={cancel} aria-label={`Cancel: ${fu.title}`}><Icon name="x" size={18} /></button>
          </>
        )}
      </div>
    </div>
  );
}
/* ------------------------------------------------------------------ timeline */
function TimelineEntry({ e, fresh }: { e: AppEvent; fresh: boolean }) {
  let title = ''; let body: React.ReactNode = null;
  if (e.type === 'application_created') title = 'Application created';
  else if (e.type === 'edited') { title = 'Details edited'; body = <div className="ev-x">Changed {listWords((e.data.fields ?? []).map((f) => FIELD_LABEL[f] ?? f))}</div>; }
  else if (e.type === 'status_changed') { title = 'Status changed'; body = <div className="ft">{e.data.from && <Pill k={e.data.from} />}<Icon name="arrowR" size={16} />{e.data.to && <Pill k={e.data.to} />}</div>; }
  else if (e.type === 'follow_up_created') { title = 'Follow-up added'; body = <div className="ev-x">{e.data.title}, due {e.data.due && fmtD(e.data.due, true)}</div>; }
  return (
    <li className={fresh ? 'fresh' : ''}>
      <span className={`ev-ic ${e.type}${e.type === 'status_changed' && e.data.to ? ' st-' + e.data.to : ''}`}><Icon name={CHK_ICONS[e.type]} size={20} /></span>
      <div className="ev-b"><div className="ev-t">{title}</div>{body}<div className="ev-s" title={absT(new Date(e.created_at).getTime())}>{rel(new Date(e.created_at).getTime())}</div></div>
    </li>
  );
}

