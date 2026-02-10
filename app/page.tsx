'use client';

import Link from 'next/link';
import Image from 'next/image';
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

  // Console log user profile after login
  useEffect(() => {
    if (status === 'authenticated' && session) {
      console.log('=== User Profile from Azure Entra ID ===');
      console.log('Session:', JSON.stringify(session, null, 2));
      console.log('User Name:', session.user?.name);
      console.log('User Email:', session.user?.email);
      console.log('Employee ID:', session.user?.employeeId);
      console.log('Is Authorized:', session.isAuthorized);
      console.log('Is Admin:', session.isAdmin);
      console.log('=========================================');

      // Check authorization
      if (session.isAuthorized === false) {
        alert('คุณไม่มีสิทธิ์ใช้งานระบบนี้ กรุณาติดต่อผู้ดูแลระบบ');
        signOut({ callbackUrl: '/login' });
      }
    }
  }, [status, session]);

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
            <div className="w-10 h-10 bg-zinc-200 rounded-full flex items-center justify-center overflow-hidden">
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-zinc-600 font-medium">
                  {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
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
          <div className="minimal-card rounded-xl p-6 cursor-pointer group mb-4">
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

        {/* Admin: User Management Card */}
        {session.isAdmin && (
          <Link href="/admin/users">
            <div className="minimal-card rounded-xl p-6 cursor-pointer group border-2 border-amber-200 bg-amber-50">
              <div className="flex items-center gap-4">
                <div className="bg-amber-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-medium text-zinc-900">
                    จัดการผู้ใช้งาน
                  </h2>
                  <p className="text-sm text-zinc-500">เพิ่ม/ลบ ผู้ใช้งานและกำหนดสิทธิ์ Admin</p>
                </div>
                <svg className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
