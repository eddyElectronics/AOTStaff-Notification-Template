'use client';

import { signOut, useSession } from 'next-auth/react';

export default function UnauthorizedPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen minimal-bg flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="minimal-card rounded-xl p-8">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-zinc-900 mb-4">
            ไม่มีสิทธิ์เข้าใช้งาน
          </h1>
          
          <p className="text-zinc-600 mb-6">
            บัญชีของคุณไม่มีสิทธิ์เข้าใช้งานระบบนี้
            <br />
            กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์การเข้าถึง
          </p>

          {session?.user && (
            <div className="bg-zinc-100 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-zinc-500 mb-1">ข้อมูลบัญชี:</p>
              <p className="text-sm text-zinc-700">
                <strong>ชื่อ:</strong> {session.user.name}
              </p>
              <p className="text-sm text-zinc-700">
                <strong>อีเมล:</strong> {session.user.email}
              </p>
              {session.user.employeeId && (
                <p className="text-sm text-zinc-700">
                  <strong>รหัสพนักงาน:</strong> {session.user.employeeId}
                </p>
              )}
            </div>
          )}

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full minimal-btn py-3 px-6 font-medium transition-all"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
}
