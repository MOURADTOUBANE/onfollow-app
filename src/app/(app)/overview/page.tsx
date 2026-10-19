'use client';
import { Overview } from '@/components/features/overview/Overview';
import { useTrackView } from '@/components/providers/NavProvider';

export default function OverviewPage() { useTrackView('overview'); return <div className="enter"><Overview /></div>; }
