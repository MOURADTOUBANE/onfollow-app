'use client';
import { Board } from '@/components/features/board/Board';
import { useTrackView } from '@/components/providers/NavProvider';

export default function BoardPage() { useTrackView('board'); return <div className="enter"><Board /></div>; }
