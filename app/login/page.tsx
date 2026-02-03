'use client';

import { signIn } from 'next-auth/react';

export default function LoginPage() {
  return (
    <div className="min-h-screen minimal-bg flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        {/* Logo/Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-900 rounded-2xl mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold text-zinc-900 mb-2">
            AOTStaff Notification Push
          </h1>
          <p className="text-zinc-500">
            กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ
          </p>
        </div>

        {/* Login Card */}
        <div className="minimal-card rounded-xl p-8">
          <button
            onClick={() => signIn('azure-ad', { callbackUrl: '/' })}
            className="w-full minimal-btn py-4 px-6 rounded-lg font-medium transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
              <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
            </svg>
            เข้าสู่ระบบด้วย Microsoft
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              ใช้บัญชี AOT Organization เพื่อเข้าสู่ระบบ
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-400">
            © 2026 Airports of Thailand Public Company Limited
          </p>
        </div>
      </div>
    </div>
  );
}
