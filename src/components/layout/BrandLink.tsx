'use client';
import Link from 'next/link';
import { Logo } from '../graphics/Icon';
import { useAuth } from '../providers/AuthProvider';

export function BrandLink() {
  const { user } = useAuth();
  return (
    <Link className="brand" href={user ? '/overview' : '/login'}>
      <Logo size={32} />
      <span>JobTracker</span>
    </Link>
  );
}
