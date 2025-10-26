'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/supabase/auth-helpers';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      setTimeout(() => {
        if (authenticated) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      }, 1000);
      setChecking(false);
    };
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Trade Nest
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Trade Anomaly Detection Platform
        </p>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <p className="text-gray-700 mb-4">
            Redirecting to dashboard...
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Dashboard
            </Link>
            <span className="text-gray-400">•</span>
            <Link href="/detect" className="text-blue-600 hover:underline">
              Detection
            </Link>
            <span className="text-gray-400">•</span>
            <Link href="/setup" className="text-blue-600 hover:underline">
              Setup
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}