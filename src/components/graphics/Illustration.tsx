import { ILLUSTRATIONS, type IllustrationName } from './illustration-data';

/** Geometric violet/white line-art used for empty states, verification, 404, error and onboarding. */
export function Illustration({ name }: { name: IllustrationName }) {
  const il = ILLUSTRATIONS[name];
  return (
    <svg className={il.cls} viewBox={il.viewBox} role="img" aria-label={il.label} dangerouslySetInnerHTML={{ __html: il.inner }} />
  );
}
