'use client';
import { FollowUpCenter } from '@/components/features/followups/FollowUpCenter';
import { useTrackView } from '@/components/providers/NavProvider';

export default function FollowUpsPage() { useTrackView('followups'); return <div className="enter"><FollowUpCenter /></div>; }
