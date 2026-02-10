'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  title: string;
  subtitle?: string;
  backUrl?: string;
  backLabel?: string;
}

export default function Header({ title, subtitle, backUrl = '/', backLabel = 'ย้อนกลับ' }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <div className="flex items-center justify-between mb-8">
      {/* Left side - Profile and Back button */}
      <div className="flex items-center gap-4">
        {/* Profile */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-200 rounded-full flex items-center justify-center overflow-hidden">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="Profile"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-zinc-600 font-medium">
                {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">{session?.user?.name || 'User'}</p>
            <p className="text-xs text-zinc-500">{session?.user?.employeeId || ''}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-zinc-300"></div>

        {/* Back button */}
        <Link
          href={backUrl}
          className="inline-flex items-center justify-center gap-2 minimal-btn-outline py-2 px-4 rounded-lg font-medium transition-all text-zinc-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </Link>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
          {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
        </div>
      </div>

      {/* Right side - Logout button */}
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        ออกจากระบบ
      </button>
    </div>
  );
}
