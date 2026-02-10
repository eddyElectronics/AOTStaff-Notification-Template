'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/app/components/Header';

interface User {
  Id: number;
  EmployeeId: string;
  IsAdmin: boolean;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string | null;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      if (!session.isAuthorized) {
        alert('คุณไม่มีสิทธิ์ใช้งานระบบนี้');
        signOut({ callbackUrl: '/login' });
        return;
      }
      if (!session.isAdmin) {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ ต้องเป็น Admin เท่านั้น');
        router.push('/');
        return;
      }
      fetchUsers();
    }
  }, [status, session, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeId.trim()) {
      alert('กรุณากรอก Employee ID');
      return;
    }

    setAdding(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: newEmployeeId.trim(), isAdmin: false }),
      });

      if (response.ok) {
        setNewEmployeeId('');
        fetchUsers();
        alert('เพิ่มผู้ใช้งานสำเร็จ');
      } else {
        alert('เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveUser = async (employeeId: string) => {
    if (!confirm(`ต้องการลบสิทธิ์ของ ${employeeId} หรือไม่?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?employeeId=${employeeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUsers();
        alert('ลบสิทธิ์ผู้ใช้งานสำเร็จ');
      } else {
        alert('เกิดข้อผิดพลาดในการลบสิทธิ์');
      }
    } catch (error) {
      console.error('Error removing user:', error);
      alert('เกิดข้อผิดพลาดในการลบสิทธิ์');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen minimal-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto"></div>
          <p className="mt-4 text-zinc-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!session || !session.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen minimal-bg p-8 text-black">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Header 
          title="จัดการผู้ใช้งาน" 
          subtitle="เพิ่ม/ลบ ผู้ใช้งาน" 
          backUrl="/" 
          backLabel="หน้าหลัก" 
        />

        {/* Add User Form */}
        <div className="minimal-card rounded-xl p-6 mb-6">
          <h2 className="text-lg font-medium text-zinc-900 mb-4">เพิ่มผู้ใช้งานใหม่</h2>
          <form onSubmit={handleAddUser} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-zinc-600 mb-2">Employee ID</label>
              <input
                type="text"
                value={newEmployeeId}
                onChange={(e) => setNewEmployeeId(e.target.value)}
                placeholder="เช่น 484074"
                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="px-6 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              {adding ? 'กำลังเพิ่ม...' : 'เพิ่มผู้ใช้งาน'}
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="minimal-card rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-zinc-700">Employee ID</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-zinc-700">Admin</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-zinc-700">สถานะ</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-zinc-700">วันที่เพิ่ม</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-zinc-700">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    ไม่มีผู้ใช้งานในระบบ
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.Id} className={!user.IsActive ? 'bg-zinc-50 opacity-60' : ''}>
                    <td className="px-6 py-4 text-sm text-zinc-900 font-medium">
                      {user.EmployeeId}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.IsAdmin ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.IsActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-zinc-500">
                      {new Date(user.CreatedAt).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleRemoveUser(user.EmployeeId)}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          disabled={user.EmployeeId === session.user?.employeeId}
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
