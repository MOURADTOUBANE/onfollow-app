import Link from 'next/link';
import { Illustration } from '../graphics/Illustration';
import { Icon } from '../graphics/Icon';

/** No applications at all yet. */
export function EmptyApps({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="empty">
      <Illustration name="empty" />
      <h2>No applications yet</h2>
      <p>Save the first role you&apos;re eyeing. It lands in Saved, and the board takes it from there.</p>
      <div className="row-btn">
        <button className="btn primary" onClick={onAdd}><Icon name="plus" size={18} />Add application</button>
      </div>
    </div>
  );
}

/** Filters/search produced zero rows. */
export function EmptySearch({ onClear }: { onClear: () => void }) {
  return (
    <div className="empty">
      <Illustration name="search" />
      <h2>Nothing matches these filters</h2>
      <p>Try a shorter search, or remove a filter to see more applications.</p>
      <div className="row-btn"><button className="btn primary" onClick={onClear}>Clear filters</button></div>
    </div>
  );
}

export function EmptyFollowUps() {
  return (
    <div className="empty">
      <Illustration name="bell" />
      <h2>You&apos;re all caught up</h2>
      <p>No follow-ups are waiting. Add one from any application to keep its next step in view.</p>
      <div className="row-btn"><Link className="btn primary" href="/board">Go to your board</Link></div>
    </div>
  );
}

export const SkLine = ({ w, h = 14, style }: { w: string; h?: number; style?: React.CSSProperties }) => (
  <div className="sk" style={{ width: w, height: h, ...style }} />
);
