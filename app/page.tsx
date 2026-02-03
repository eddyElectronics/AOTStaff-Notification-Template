'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen minimal-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto"></div>
          <p className="mt-4 text-zinc-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen minimal-bg flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        {/* User Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-200 rounded-full flex items-center justify-center">
              <span className="text-zinc-600 font-medium">
                {session.user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900">{session.user?.name}</p>
              <p className="text-xs text-zinc-500">{session.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            ออกจากระบบ
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-zinc-900 mb-2">
            AOTStaff Notification Push
          </h1>
          <p className="text-zinc-500">
            สร้างและจัดการ notification template พร้อมส่งข้อความแบบ bulk
          </p>
        </div>

        {/* Template Creator Card */}
        <Link href="/template-creator">
          <div className="minimal-card rounded-xl p-6 cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="bg-zinc-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-medium text-zinc-900">
                  สร้าง Template
                </h2>
                <p className="text-sm text-zinc-500">เริ่มสร้าง notification template</p>
              </div>
              <svg className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
