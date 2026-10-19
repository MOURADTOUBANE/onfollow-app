'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { Icon, Logo } from '../graphics/Icon';
import { useAuth } from '../providers/AuthProvider';
import { useData } from '../providers/DataProvider';
import { useNav, type View } from '../providers/NavProvider';
import { usePop } from '../providers/PopProvider';
import { useTheme } from '../providers/ThemeProvider';
import { useAppActions } from '../modals/useAppActions';
import { diffDays } from '@/lib/dates';
import { initials } from '@/lib/utils';
import { flags } from '@/lib/flags';

export const TABS: { k: View; label: string }[] = [
  { k: 'overview', label: 'Overview' }, { k: 'board', label: 'Board' }, { k: 'list', label: 'List' }, { k: 'followups', label: 'Follow-ups' },
];

/** Number of open follow-ups that are due today or overdue (shown as the red badge). */
export function useAttention() {
  const { followUps } = useData();
  return followUps.filter((f) => f.status === 'open' && diffDays(f.due_at) <= 0).length;
}
export function useActiveView(): View {
  const pathname = usePathname();
  const { lastView } = useNav();
  return pathname.startsWith('/applications') ? lastView : (pathname.split('/')[1] as View);
}

/** Theme switcher (shared by the top bar and the rail). */
function useInfoMenu() {
  const { menu } = usePop();
  const { mode, setMode } = useTheme();
  return (anchor: HTMLElement) => {
    menu(anchor, [
      { value: 'theme-light', icon: 'sun', label: 'Light theme' },
      { value: 'theme-dark', icon: 'moon', label: 'Dark theme' },
      { value: 'theme-system', icon: 'layers', label: 'Match my device' },
    ], {
      align: 'end', title: 'Theme', selected: 'theme-' + mode,
      onSelect: (v) => {
        if (v.startsWith('theme-')) setMode(v.slice(6) as 'light' | 'dark' | 'system');
      },
    });
  };
}

/** Top bar: brand pill, main navigation pill, search/notifications/help pill and the account pill. */
export function Dock() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { menu } = usePop();
  const infoMenu = useInfoMenu();
  const active = useActiveView();
  const attention = useAttention();
  const navRef = useRef<HTMLElement>(null);

  // slide the violet "glider" under the active tab
  const place = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    const on = nav.querySelector<HTMLElement>('.tab.on');
    const g = nav.querySelector<HTMLElement>('.tab-glider');
    if (on && g) { g.style.setProperty('--x', on.offsetLeft + 'px'); g.style.setProperty('--w', on.offsetWidth + 'px'); g.style.opacity = '1'; }
    else if (g) g.style.opacity = '0';
  }, []);
  useLayoutEffect(place, [active, attention, place]);
  useEffect(() => {
    window.addEventListener('resize', place);
    void document.fonts?.ready.then(place);
    return () => window.removeEventListener('resize', place);
  }, [place]);

  const goSearch = () => { flags.focusSearch = true; router.push('/list'); };

  const userMenu = (anchor: HTMLElement) =>
    menu(anchor, [{ value: 'logout', icon: 'logout', label: 'Log out' }], { align: 'end', title: user?.email, onSelect: () => void logout() });

  return (
    <header id="dock">
      <div className="topbar">
        <Link className="pill-w brand-pill" href="/overview" aria-label="JobTracker, go to overview">
          <Logo size={34} /><span className="brand-t">JobTracker</span>
        </Link>
        <nav ref={navRef} className="pill-w nav-pill" aria-label="Main">
          {TABS.map((t) => (
            <Link key={t.k} className={`tab${active === t.k ? ' on' : ''}`} href={`/${t.k}`} aria-current={active === t.k ? 'page' : undefined}>
              {t.label}
              {t.k === 'followups' && attention > 0 && <b className="tab-n" aria-label={`${attention} need attention`}>{attention}</b>}
            </Link>
          ))}
          <span className="tab-glider" aria-hidden="true" />
        </nav>
        <div className="right">
          <div className="pill-w icons-pill">
            <button className="ib" onClick={goSearch} aria-label="Search applications"><Icon name="search" size={19} /></button>
            <Link className="ib" id="bellBtn" href="/followups" aria-label="Follow-ups">
              <Icon name="bell" size={19} />{attention > 0 && <i className="dot" />}
            </Link>
            <button className="ib" onClick={(e) => infoMenu(e.currentTarget)} aria-label="Theme" aria-haspopup="menu" aria-expanded="false"><Icon name="info" size={19} /></button>
          </div>
          <button className="pill-w user-pill" onClick={(e) => userMenu(e.currentTarget)} aria-label="Account menu" aria-haspopup="menu" aria-expanded="false">
            <span className="avatar" aria-hidden="true">{initials(user?.name)}</span>
            <span className="u-t"><b>{user?.name}</b><span>{user?.email}</span></span>
            <Icon name="chevD" size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

/** Vertical icon rail: theme toggle, quick links, new application, help and log out. */
export function Rail() {
  const active = useActiveView();
  const { effective, setMode } = useTheme();
  const { logout } = useAuth();
  const { openAppForm } = useAppActions();
  const infoMenu = useInfoMenu();
  const links: { k: View; label: string; icon: 'grid' | 'board' | 'list' | 'bell' }[] = [
    { k: 'overview', label: 'Overview', icon: 'grid' }, { k: 'board', label: 'Board', icon: 'board' },
    { k: 'list', label: 'List', icon: 'list' }, { k: 'followups', label: 'Follow-ups', icon: 'bell' },
  ];
  return (
    <aside id="rail">
      <div className="rail-g" role="group" aria-label="Theme">
        {(['light', 'dark'] as const).map((m) => (
          <button key={m} className={`rb${effective === m ? ' on' : ''}`} aria-pressed={effective === m} aria-label={`${m === 'light' ? 'Light' : 'Dark'} theme`} onClick={() => setMode(m)}>
            <Icon name={m === 'light' ? 'sun' : 'moon'} size={20} />
          </button>
        ))}
      </div>
      <nav className="rail-g" aria-label="Quick links">
        {links.map((l) => (
          <Link key={l.k} className={`rb${active === l.k ? ' on' : ''}`} href={`/${l.k}`} aria-label={l.label} title={l.label} aria-current={active === l.k ? 'page' : undefined}>
            <Icon name={l.icon} size={20} />
          </Link>
        ))}
        <button className="rb" onClick={() => openAppForm()} aria-label="New application" title="New application"><Icon name="plus" size={20} /></button>
      </nav>
      <div className="rail-g">
        <button className="rb" aria-label="Theme" aria-haspopup="menu" aria-expanded="false" onClick={(e) => infoMenu(e.currentTarget)}><Icon name="info" size={20} /></button>
        <button className="rb" onClick={() => void logout()} aria-label="Log out" title="Log out"><Icon name="logout" size={20} /></button>
      </div>
    </aside>
  );
}
