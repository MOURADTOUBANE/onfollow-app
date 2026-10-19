'use client';
import { use } from 'react';
import { ApplicationDetail } from '@/components/features/detail/ApplicationDetail';
import { NotFoundView } from '@/components/features/auth/StandaloneScreens';
import { useData } from '@/components/providers/DataProvider';

export default function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { apps, ready } = useData();
  const n = Number(id);
  // Once the list is loaded, an unknown id means it was deleted or never existed.
  if (ready && !apps.some((a) => a.id === n)) return <NotFoundView />;
  return <div className="enter"><ApplicationDetail id={n} /></div>;
}
