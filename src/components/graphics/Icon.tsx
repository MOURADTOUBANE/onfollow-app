import { ICONS, type IconName } from './icon-data';

/** Custom duotone icon set (24px grid). Markup lives in icon-data.ts (static, trusted strings). */
export function Icon({ name, size = 20, className = '' }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={`ic ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ICONS[name] ?? '' }}
    />
  );
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="11" fill="var(--violet)" />
      <path d="M8.5 21.5 13 15.5l4 3.5 6-8" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="23.5" cy="10.5" r="2.4" fill="#fff" />
    </svg>
  );
}
