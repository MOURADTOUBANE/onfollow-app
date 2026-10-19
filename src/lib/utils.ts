export const initials = (n?: string) => (n || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
export const firstName = (n?: string) => (n || '').split(/\s+/)[0] || 'there';
/** APP_000012 style reference shown in the overview table */
export const refId = (id: number) => 'APP_' + String(id).padStart(6, '0');
export const cx = (...a: Array<string | false | null | undefined>) => a.filter(Boolean).join(' ');
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
