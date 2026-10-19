'use client';
import { ApplicationsList } from '@/components/features/list/ApplicationsList';
import { useTrackView } from '@/components/providers/NavProvider';

export default function ListPage() { useTrackView('list'); return <div className="enter"><ApplicationsList /></div>; }
