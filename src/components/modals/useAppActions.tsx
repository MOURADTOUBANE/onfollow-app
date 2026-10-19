'use client';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import { ApiError } from '@/lib/api';
import type { Application, ApplicationInput, FollowUp } from '@/lib/types';
import { SOURCES } from '@/lib/status';
import { fmtD, isoOff } from '@/lib/dates';
import { validate, type FieldErrors } from '@/lib/validation';
import { useModal } from '../providers/ModalProvider';
import { usePop } from '../providers/PopProvider';
import { useToast } from '../providers/ToastProvider';
import { useData } from '../providers/DataProvider';
import { Icon } from '../graphics/Icon';
import { BusyDots } from '../ui/atoms';
import { Field } from '../ui/forms';

/**
 * Every "open a dialog" action of the app in one hook:
 *   const { openAppForm, confirmDelete, openFollowUp, reschedule } = useAppActions();
 * The API calls themselves happen in DataProvider (-> src/lib/api).
 */
export function useAppActions() {
  const modal = useModal();
  const pop = usePop();
  return useMemo(() => ({
    /** Create (no argument) or edit (pass the application). */
    openAppForm(app?: Application, onSaved?: (a: Application) => void) {
      modal.open({ title: app ? 'Edit application' : 'New application', render: (close) => <AppForm app={app} close={close} onSaved={onSaved} /> });
    },
    confirmDelete(app: Application, onDone?: () => void) {
      modal.open({ title: 'Delete this application?', size: 'sm', render: (close) => <DeleteBody app={app} close={close} onDone={onDone} /> });
    },
    openFollowUp(app: Application, onDone?: () => void) {
      modal.open({ title: 'Add a follow-up', size: 'sm', render: (close) => <FollowUpBody app={app} close={close} onDone={onDone} /> });
    },
    reschedule(anchor: HTMLElement, fu: FollowUp, onDone?: () => void) {
      pop.popover(anchor, (close) => <ReschedulePop fu={fu} close={close} onDone={onDone} />, { align: 'end' });
    },
  }), [modal, pop]);
}

/* ------------------------------------------------------------------ create / edit */
function AppForm({ app, close, onSaved }: { app?: Application; close: () => void; onSaved?: (a: Application) => void }) {
  const data = useData();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [v, setV] = useState({
    company: app?.company ?? '', title: app?.title ?? '', canonical_url: app?.canonical_url ?? '', source: app?.source ?? '',
    applied_at: app?.applied_at ?? '', location: app?.location ?? '', salary_text: app?.salary_text ?? '', notes: app?.notes ?? '',
  });
  const [errs, setErrs] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const on = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));
  const focusFirstError = () => requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('.field.bad input,.field.bad textarea')?.focus());

  async function submit(e: FormEvent) {
    e.preventDefault();
    const err = validate(v);
    setErrs(err);
    if (Object.keys(err).length) { focusFirstError(); return; }
    const n = (s: string) => s.trim() || null;
    const input: ApplicationInput = {
      company: v.company.trim(), title: v.title.trim(), canonical_url: n(v.canonical_url), source: n(v.source),
      applied_at: n(v.applied_at), location: n(v.location), salary_text: n(v.salary_text), notes: n(v.notes),
    };
    setBusy(true);
    try {
      if (app) {
        // Only send what changed, so the backend logs an accurate "edited" event.
        const patch: Partial<ApplicationInput> = {};
        (Object.keys(input) as (keyof ApplicationInput)[]).forEach((k) => { if (input[k] !== (app[k] ?? null)) (patch as Record<string, unknown>)[k] = input[k]; });
        const saved = await data.updateApp(app.id, patch); // TODO(API): PATCH /applications/{id}
        close(); toast('Changes saved'); onSaved?.(saved);
      } else {
        const saved = await data.createApp(input); // TODO(API): POST /applications
        close();
        toast(<>Added <b>{saved.company}</b> to Saved</>, { action: { label: 'Open', href: `/applications/${saved.id}` } });
        onSaved?.(saved);
      }
    } catch (ex) {
      setBusy(false);
      // TODO(API): Laravel 422 => { errors: { company: ['...'] } }. Shown under the matching field.
      if (ex instanceof ApiError && ex.errors) {
        setErrs(Object.fromEntries(Object.entries(ex.errors).map(([k, m]) => [k, m[0]])));
        focusFirstError();
      } else toast('Could not save. Try again.', { type: 'err' });
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate style={{ display: 'grid', gap: 18 }}>
      <div className="two">
        <Field id="f-company" label="Company" error={errs.company}>
          <input className="input" id="f-company" value={v.company} onChange={on('company')} placeholder="Lumen Health" maxLength={255} autoComplete="off" aria-invalid={!!errs.company} />
        </Field>
        <Field id="f-title" label="Job title" error={errs.title}>
          <input className="input" id="f-title" value={v.title} onChange={on('title')} placeholder="Senior Frontend Engineer" maxLength={255} autoComplete="off" aria-invalid={!!errs.title} />
        </Field>
      </div>
      <Field id="f-canonical_url" label="Job link" optional error={errs.canonical_url}>
        <input className="input" id="f-canonical_url" type="url" inputMode="url" value={v.canonical_url} onChange={on('canonical_url')} placeholder="https://company.com/careers/role" autoComplete="off" />
      </Field>
      <div className="two">
        <Field id="f-source" label="Source" optional error={errs.source}>
          <input className="input" id="f-source" value={v.source} onChange={on('source')} placeholder="Where you found it" maxLength={100} />
          <div className="chips">
            {SOURCES.map((s) => (
              <button type="button" key={s} className={`chip${v.source.trim() === s ? ' on' : ''}`} onClick={() => setV((x) => ({ ...x, source: s }))}>{s}</button>
            ))}
          </div>
        </Field>
        <Field id="f-applied_at" label="Applied on" optional error={errs.applied_at}>
          <input className="input" id="f-applied_at" type="date" value={v.applied_at} onChange={on('applied_at')} max={isoOff(0)} />
        </Field>
      </div>
      <div className="two">
        <Field id="f-location" label="Location" optional error={errs.location}>
          <input className="input" id="f-location" value={v.location} onChange={on('location')} placeholder="Remote, Berlin…" maxLength={255} />
        </Field>
        <Field id="f-salary_text" label="Salary" optional error={errs.salary_text}>
          <input className="input" id="f-salary_text" value={v.salary_text} onChange={on('salary_text')} placeholder="€60–70k" maxLength={255} />
        </Field>
      </div>
      <Field id="f-notes" label="Notes" optional error={errs.notes}>
        <textarea className="input" id="f-notes" rows={4} maxLength={10000} value={v.notes} onChange={on('notes')} placeholder="Anything you'll want to remember" />
      </Field>
      <div className="modal-f">
        <button type="button" className="btn ghost" onClick={close}>Cancel</button>
        <button type="submit" className="btn primary" disabled={busy}>{busy ? <BusyDots /> : app ? 'Save changes' : 'Add application'}</button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ delete */
function DeleteBody({ app, close, onDone }: { app: Application; close: () => void; onDone?: () => void }) {
  const data = useData();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const nFu = data.followUps.filter((f) => f.application_id === app.id).length;
  async function go() {
    setBusy(true);
    try {
      await data.deleteApp(app.id); // TODO(API): DELETE /applications/{id}  (confirmation is UI-only, the backend does not ask)
      close();
      toast(<>Deleted <b>{app.company}</b></>, { type: 'info' });
      onDone?.();
    } catch { setBusy(false); toast('Could not delete. Try again.', { type: 'err' }); }
  }
  return (
    <>
      <div className="danger-ic"><Icon name="trash" size={26} /></div>
      <p style={{ color: 'var(--ink-2)' }}>
        <strong style={{ color: 'var(--ink)' }}>{app.company}, {app.title}</strong> will be removed for good, along with its timeline and {nFu} {nFu === 1 ? 'follow-up' : 'follow-ups'}. This can&apos;t be undone.
      </p>
      <div className="modal-f">
        <button className="btn ghost" data-autofocus onClick={close}>Keep it</button>
        <button className="btn danger" onClick={go} disabled={busy}>{busy ? <BusyDots /> : 'Delete application'}</button>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ follow-up */
function FollowUpBody({ app, close, onDone }: { app: Application; close: () => void; onDone?: () => void }) {
  const data = useData();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState(isoOff(3));
  const [errs, setErrs] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const err: FieldErrors = {};
    if (!title.trim()) err.title = 'Describe the next step.';
    if (!dueAt) err.due = 'Pick a due date.';
    setErrs(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    try {
      await data.createFollowUp(app.id, title.trim(), dueAt); // TODO(API): POST /applications/{id}/actions
      close(); toast('Follow-up added'); onDone?.();
    } catch { setBusy(false); toast('Could not add the follow-up.', { type: 'err' }); }
  }
  return (
    <>
      <p style={{ color: 'var(--ink-2)' }}>For <strong style={{ color: 'var(--ink)' }}>{app.company}</strong>, {app.title}</p>
      <form onSubmit={submit} noValidate style={{ display: 'grid', gap: 16 }}>
        <Field id="q-t" label="Next step" error={errs.title}>
          <input className="input" id="q-t" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} placeholder="Email the recruiter" autoComplete="off" />
        </Field>
        <Field id="q-d" label="Due on" error={errs.due}>
          <input className="input" id="q-d" type="date" value={dueAt} min={isoOff(0)} onChange={(e) => setDueAt(e.target.value)} />
        </Field>
        <div className="modal-f">
          <button type="button" className="btn ghost" onClick={close}>Cancel</button>
          <button className="btn primary" type="submit" disabled={busy}>{busy ? <BusyDots /> : 'Add follow-up'}</button>
        </div>
      </form>
    </>
  );
}

/* ------------------------------------------------------------------ reschedule */
function ReschedulePop({ fu, close, onDone }: { fu: FollowUp; close: () => void; onDone?: () => void }) {
  const data = useData();
  const toast = useToast();
  const [d, setD] = useState(fu.due_at);
  async function save(date: string) {
    if (!date) return;
    close();
    try {
      await data.updateFollowUp(fu.id, { due_at: date }); // TODO(API): PATCH /actions/{id}  body: { due_at }
      toast('Rescheduled to ' + fmtD(date, true));
      onDone?.();
    } catch { toast('Could not reschedule.', { type: 'err' }); }
  }
  return (
    <>
      <h4>Reschedule</h4>
      <div className="presets">
        {([['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7]] as const).map(([l, n]) => (
          <button key={l} className="chip" onClick={() => save(isoOff(n))}>{l}</button>
        ))}
      </div>
      <div className="field" style={{ marginBottom: 14 }}>
        <label htmlFor="rs-d">Or pick a date</label>
        <input className="input" id="rs-d" type="date" value={d} onChange={(e) => setD(e.target.value)} />
      </div>
      <button className="btn primary block" onClick={() => save(d)}>Save date</button>
    </>
  );
}
