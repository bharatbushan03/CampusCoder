'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminOverview() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <p className="text-slate-400">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}