'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/graphics/Icon';
import { Mono, Tile, Sk, CheckSvg } from '@/components/ui/atoms';
import { EmptyApps } from '@/components/ui/EmptyStates';
import { useAuth } from '@/components/providers/AuthProvider';
import { useData } from '@/components/providers/DataProvider';
import { usePop } from '@/components/providers/PopProvider';
import { useAppActions } from '@/components/modals/useAppActions';
import { ST, KEYS } from '@/lib/status';
import type { Application, Status } from '@/lib/types';
import { DAY, diffDays, fmtD, fmtDT } from '@/lib/dates';
import { firstName, greeting, refId } from '@/lib/utils';

const PERIODS: Record<number, string> = { 30: 'Last 30 days', 90: 'Last 90 days', 0: 'All time' };
const GOAL = 20;

export function OverviewSkeleton() {
  const boxes = ['bal', 'tiles', 'chart', 'lim', 'cards', 'table'];
  return (
    <>
      <div className="page-h"><div><Sk w="340px" h={38} /><div style={{ height: 10 }} /><Sk w="300px" h={16} /></div></div>
      <div className="ov">
        {boxes.map((k) => (
          <div className={`bento c-${k}`} key={k} style={{ minHeight: k === 'bal' || k === 'table' ? 320 : 170 }}>
            <Sk w="40%" h={14} /><div style={{ height: 16 }} /><Sk w="60%" h={34} /><div style={{ height: 16 }} /><Sk w="100%" h={70} style={{ borderRadius: 16 }} />
          </div>
        ))}
      </div>
    </>
  );
}

export function Overview() {
  const { user } = useAuth();
  const { apps, followUps, ready } = useData();
  const { openAppForm, openFollowUp, confirmDelete } = useAppActions();
  const { menu } = usePop();
  const [days, setDays] = useState(30);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<Status | ''>('');
  const [sel, setSel] = useState<Set<number>>(new Set());
  const chartBoxRef = useRef<HTMLDivElement>(null);
  const [chartW, setChartW] = useState(560);

  useEffect(() => {
    const el = chartBoxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setChartW(Math.max(300, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!ready) return <OverviewSkeleton />;

  const head = (
    <div className="page-h"><div><h1>{greeting()}, {firstName(user?.name)}</h1><p className="sub">Stay on top of your applications, follow-ups and interviews.</p></div></div>
  );
  if (!apps.length) return (<>{head}<EmptyApps onAdd={() => openAppForm()} /></>);

  const now = Date.now();
  const cut = days ? now - days * DAY : 0;
  const cur = apps.filter((a) => !days || new Date(a.created_at).getTime() >= cut).length;
  const prev = days ? apps.filter((a) => { const t = new Date(a.created_at).getTime(); return t < cut && t >= now - 2 * days * DAY; }).length : 0;
  const diff = cur - prev;
  const openFollowUps = followUps.filter((f) => f.status === 'open');
  const n = openFollowUps.filter((f) => diffDays(f.due_at) <= 0).length;
  const monthKey = new Date().toISOString().slice(0, 7);
  const sentThisMonth = apps.filter((a) => a.applied_at && a.applied_at.slice(0, 7) === monthKey).length;
  const appliedApps = apps.filter((a) => a.applied_at);
  const offers = apps.filter((a) => a.status === 'offer').length;
  const interviews = apps.filter((a) => a.status === 'interview').length;
  const sentInPeriod = apps.filter((a) => a.applied_at && (!days || a.applied_at >= new Date(cut).toISOString().slice(0, 10))).length;
  const respondedCount = apps.filter((a) => ['screening', 'interview', 'offer', 'rejected'].includes(a.status) && a.applied_at).length;
  const rate = appliedApps.length ? Math.round((respondedCount / appliedApps.length) * 100) : 0;

  const pct = Math.min(100, Math.round((sentThisMonth / GOAL) * 100));

  const stages: Status[] = ['applied', 'screening', 'interview'];
  const cards = apps.filter((a) => ['interview', 'offer'].includes(a.status)).sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5);

  const query = q.trim().toLowerCase();
  const rows = apps.filter((a) => (!status || a.status === status) && (!query || `${a.company} ${a.title} ${refId(a.id)}`.toLowerCase().includes(query)))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5);

  const toggleSel = (id: number) => setSel((s) => { const n2 = new Set(s); n2.has(id) ? n2.delete(id) : n2.add(id); return n2; });
  const allChecked = rows.length > 0 && rows.every((a) => sel.has(a.id));
  const toggleAll = () => setSel((s) => { const n2 = new Set(s); const every = rows.every((a) => s.has(a.id)); rows.forEach((a) => (every ? n2.delete(a.id) : n2.add(a.id))); return n2; });

  const periodMenu = (anchor: HTMLElement) =>
    menu(anchor, Object.entries(PERIODS).map(([v, l]) => ({ value: v, icon: 'calendar' as const, label: l })), { selected: String(days), title: 'Period', onSelect: (v) => setDays(+v) });
  const statusMenu = (anchor: HTMLElement) =>
    menu(anchor, [{ value: '', icon: 'layers', label: 'All statuses' }, ...KEYS.map((k) => ({ value: k, status: k, label: ST[k].label }))],
      { align: 'end', selected: status, title: 'Status', onSelect: (v) => setStatus(v as Status | '') });
  const rowMenu = (anchor: HTMLElement, a: Application) =>
    menu(anchor, [
      { value: 'open', icon: 'external', label: 'Open application' },
      { value: 'fu', icon: 'bell', label: 'Add follow-up' },
      { divider: true },
      { value: 'del', icon: 'trash', label: 'Delete', danger: true },
    ], { align: 'end', title: a.company, onSelect: (v) => onRowAction(v, a) });

  function onRowAction(v: string, a: Application) {
    if (v === 'open') location.href = `/applications/${a.id}`;
    else if (v === 'fu') openFollowUp(a);
    else if (v === 'del') confirmDelete(a, () => setSel((s) => { const n2 = new Set(s); n2.delete(a.id); return n2; }));
  }

  const dl = (positive: boolean, txt: string) => <span className={`delta${positive ? '' : ' flat'}`}>{positive && <Icon name="arrowUp" size={12} />}{txt}</span>;

  return (
    <>
      {head}
      <div className="ov">
        <section className="bento c-bal stg" style={{ '--i': 0 } as React.CSSProperties} aria-label="Total applications">
          <div className="bento-h"><h3>Total applications</h3><button className="dd sm" onClick={(e) => periodMenu(e.currentTarget)} aria-haspopup="listbox" aria-expanded="false"><Icon name="calendar" size={15} /><span>{PERIODS[days]}</span><Icon name="chevD" size={14} /></button></div>
          <div className="big">{cur}</div>
          {days ? <div className="delta-row">{dl(diff > 0, (diff > 0 ? '+' : '') + diff)}<span>{diff > 0 ? `${diff} more than` : diff < 0 ? `${-diff} fewer than` : 'Same as'} the period before</span></div> : <div className="delta-row"><span>Every application you&apos;ve saved</span></div>}
          <div className="act-row">
            <button className="btn primary" onClick={() => openAppForm()}><Icon name="plus" size={18} />New application</button>
            <Link className="btn gray" href="/board"><Icon name="board" size={18} />Open board</Link>
          </div>
          <div className="wallets">
            <div className="wl-h"><b>Pipeline</b><i /><span>3 stages in play</span></div>
            <div className="wl-grid">
              {stages.map((k) => {
                const c = apps.filter((a) => a.status === k).length;
                const soon = openFollowUps.filter((f) => { const a = apps.find((x) => x.id === f.application_id); return a && a.status === k && diffDays(f.due_at) <= 7; }).length;
                return (
                  <div className="wl" key={k}>
                    <div className="wl-top"><Tile k={k} size={22} /><span>{ST[k].label}</span></div>
                    <div className="wl-v">{c}</div>
                    <small>{soon ? `${soon} ${soon === 1 ? 'follow-up' : 'follow-ups'} due soon` : 'Nothing due soon'}</small>
                    <span className={`stt ${c ? 'on' : 'off'}`}>{c ? 'Active' : 'Empty'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="c-tiles stg" style={{ '--i': 1 } as React.CSSProperties} aria-label="Key numbers">
          <StatTile hero label="Offers" icon="offer" value={offers} delta={dl(true, offers ? '+' + offers : 'None new')} />
          <StatTile label="Interviews" icon="interview" value={interviews} delta={dl(true, interviews ? '+' + interviews : 'None new')} />
          <StatTile label="Sent" icon="applied" value={sentInPeriod} delta={dl(true, sentInPeriod ? '+' + sentInPeriod : 'None new')} foot={days ? 'This week' : 'All time'} />
          <StatTile label="Reply rate" icon="screening" value={rate + '%'} delta={dl(true, `${respondedCount} of ${appliedApps.length}`)} foot="Replied" />
        </section>

        <section className="bento c-chart stg" style={{ '--i': 2 } as React.CSSProperties} aria-label="Applications per week">
          <div className="bento-h"><h3 className="lg">Applications</h3></div>
          <p className="chart-sub">See how many you added each week, and how many have closed.</p>
          <div className="chart-top"><span>Active and closed</span><div className="legend"><span><i className="lg1" />Active</span><span><i className="lg2" />Closed</span></div></div>
          <div ref={chartBoxRef}><WeeklyBarsChart apps={apps} width={chartW} /></div>
        </section>

        <section className="bento c-lim stg" style={{ '--i': 3 } as React.CSSProperties} aria-label="Monthly goal">
          <div className="bento-h"><h3 className="lg">Monthly goal</h3>{n > 0 && <Link className="delta" style={{ background: 'var(--d3-bg)', color: 'var(--d3-fg)' }} href="/followups">{n} to follow up</Link>}</div>
          <div className="prog" role="progressbar" aria-valuemin={0} aria-valuemax={GOAL} aria-valuenow={sentThisMonth} aria-label="Applications sent this month"><i style={{ '--p': pct + '%' } as React.CSSProperties} /></div>
          <div className="prog-l"><span><b>{sentThisMonth}</b> sent this month</span><span>{GOAL} goal</span></div>
        </section>

        <section className="bento c-cards stg" style={{ '--i': 4 } as React.CSSProperties} aria-label="Active interviews">
          <div className="bento-h"><h3 className="lg">Active interviews</h3><button className="btn soft sm" onClick={() => openAppForm()}><Icon name="plus" size={15} />Add new</button></div>
          <div className="pcards">
            {cards.length ? cards.map((a, i) => <InterviewCard key={a.id} app={a} alt={i % 2 === 1} />) : <div className="pc-empty">No interviews or offers yet. Drag a card to Interview on the board and it shows up here.</div>}
          </div>
        </section>

        <section className="bento c-table stg" style={{ '--i': 5 } as React.CSSProperties} aria-label="Recent applications">
          <div className="tb-h">
            <h3>Recent activity</h3>
            <div className="tb-tools">
              <label className="pill-search"><Icon name="search" size={17} /><input type="search" placeholder="Search" aria-label="Search recent applications" value={q} onChange={(e) => setQ(e.target.value)} /></label>
              <button className="btn ghost tb-filter" onClick={(e) => statusMenu(e.currentTarget)} aria-haspopup="listbox" aria-expanded="false"><Icon name="filter" size={17} /><span>{status ? ST[status].label : 'Filter'}</span></button>
            </div>
          </div>
          <div className="tb" role="table" aria-label="Recent applications">
            <div className="tb-row tb-head" role="row">
              <button className="cbx" role="checkbox" aria-checked={allChecked} aria-label="Select all rows" onClick={toggleAll}><CheckSvg /></button>
              <span className="hide-m">ID</span><span>Application</span><span className="hide-r">Role</span><span className="hide-m">Salary</span><span>Status</span><span className="hide-s">Last activity</span><span />
            </div>
            <div>
              {rows.length ? rows.map((a) => (
                <div className={`tb-row stg${sel.has(a.id) ? ' sel' : ''}`} key={a.id} role="row">
                  <button className="cbx" role="checkbox" aria-checked={sel.has(a.id)} aria-label={`Select ${a.company}`} onClick={() => toggleSel(a.id)}><CheckSvg /></button>
                  <span className="c-id hide-m">{refId(a.id)}</span>
                  <div className="c-co"><Mono name={a.company} size={32} /><Link href={`/applications/${a.id}`}>{a.company}</Link></div>
                  <span className="c-role hide-r">{a.title}</span>
                  <span className="c-sal hide-m">{a.salary_text || 'Not set'}</span>
                  <span className={`c-st st-${a.status}`}><Icon name={a.status} size={16} />{ST[a.status].label}</span>
                  <span className="c-dt hide-s">{fmtDT(new Date(a.updated_at).getTime())}</span>
                  <button className="btn-icon" onClick={(e) => rowMenu(e.currentTarget, a)} aria-label={`Actions for ${a.company}`} aria-haspopup="menu" aria-expanded="false"><Icon name="dots" size={18} /></button>
                </div>
              )) : (
                <div className="tb-empty">Nothing matches. <button className="link" onClick={() => { setQ(''); setStatus(''); }}>Clear search and filter</button></div>
              )}
            </div>
          </div>
          <div className="tb-foot"><span>{sel.size ? `${sel.size} selected` : `Showing ${rows.length} of ${apps.length} applications`}</span><Link className="link" href="/list">View all applications</Link></div>
        </section>
      </div>
    </>
  );
}

function StatTile({ label, icon, value, delta, foot = 'This week', hero }: { label: string; icon: Parameters<typeof Icon>[0]['name']; value: React.ReactNode; delta: React.ReactNode; foot?: string; hero?: boolean }) {
  return (
    <div className={`tl2${hero ? ' hero' : ''}`}>
      <div className="tl2-h"><span>{label}</span><span className="tl2-ic"><Icon name={icon} size={16} /></span></div>
      <div className="big">{value}</div>
      <div className="tl2-f">{delta}<span>{foot}</span></div>
    </div>
  );
}

function InterviewCard({ app, alt }: { app: Application; alt: boolean }) {
  return (
    <article className={`pcard${alt ? ' v' : ''}`} aria-label={`${app.company}, ${ST[app.status].label}`}>
      <div className="pcard-top">
        <div className="pcard-l"><Icon name={app.status} size={20} /><span className="act">{app.status === 'offer' ? 'Offer' : 'Active'}</span></div>
        <span className="rings" aria-hidden="true"><i /><i /></span>
      </div>
      <div className="pcard-name">{app.company}<small>{app.title}</small></div>
      <div className="pcard-f">
        <div><span>Source</span><b>{app.source || 'None'}</b></div>
        <div><span>Applied</span><b>{app.applied_at ? fmtD(app.applied_at) : 'Not yet'}</b></div>
        <div><span>Salary</span><b>{app.salary_text || 'Not set'}</b></div>
      </div>
      <Link href={`/applications/${app.id}`} aria-label={`Open ${app.company}`} />
    </article>
  );
}

/** Hatched-bar SVG chart (solid = active, hatched = closed), sized to its container's width. */
function WeeklyBarsChart({ apps, width }: { apps: Application[]; width: number }) {
  const rows = useMemo(() => {
    const now = Date.now();
    const N = 9;
    const out = Array.from({ length: N }, (_, i) => ({ w: N - 1 - i, a: 0, c: 0, label: '' }));
    apps.forEach((app) => {
      const w = Math.floor((now - new Date(app.created_at).getTime()) / (7 * DAY));
      if (w >= 0 && w < N) {
        const r = out[N - 1 - w];
        (['rejected', 'withdrawn', 'archived'] as Status[]).includes(app.status) ? r.c++ : r.a++;
      }
    });
    out.forEach((r) => { r.label = new Date(now - (r.w * 7 + 6) * DAY).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); });
    return out;
  }, [apps]);

  const W = Math.max(300, Math.round(width)), H = 262, L = 32, R = 6, T = 10, B = 30;
  const iw = W - L - R, ih = H - T - B, n = rows.length;
  const mx = Math.max(4, ...rows.map((r) => r.a + r.c));
  const step = mx <= 8 ? 2 : mx <= 20 ? 5 : 10;
  const top = Math.ceil(mx / step) * step;
  const y = (v: number) => T + ih - (v / top) * ih;
  const bw = Math.min(34, (iw / n) * 0.56);
  const showLabelEvery = iw / n < 48 ? 2 : 1;

  const gridLines = [];
  for (let v = 0; v <= top; v += step) gridLines.push(
    <g key={v}>
      <line className="grid" x1={L} x2={W - R} y1={y(v)} y2={y(v)} />
      <text x={L - 8} y={y(v) + 4} textAnchor="end">{v}</text>
    </g>,
  );

  return (
    <svg className="bars" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Applications added per week over the last 9 weeks. Solid bars are still active, hatched bars are closed.`}>
      <defs>
        <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="7" height="7" fill="var(--v100)" /><rect width="3.2" height="7" fill="var(--violet)" />
        </pattern>
      </defs>
      {gridLines}
      {rows.map((r, i) => {
        const cx = L + (iw * (i + 0.5)) / n;
        const h1 = (r.a / top) * ih, h2 = (r.c / top) * ih, gap = r.a && r.c ? 3 : 0;
        return (
          <g className="bar" key={i} style={{ '--i': i } as React.CSSProperties}>
            <title>Week of {r.label}: {r.a + r.c} sent, {r.c} closed</title>
            {r.a > 0 && <rect className="b1" x={cx - bw / 2} y={y(0) - h1} width={bw} height={Math.max(h1, 5)} rx={7} />}
            {r.c > 0 && <rect className="b2" x={cx - bw / 2} y={y(0) - h1 - gap - h2} width={bw} height={Math.max(h2, 5)} rx={7} />}
            {i % showLabelEvery === 0 && <text x={cx} y={H - 8} textAnchor="middle">{r.label}</text>}
          </g>
        );
      })}
    </svg>
  );
}
