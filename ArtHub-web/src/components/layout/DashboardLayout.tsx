'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getUserProfile } from '@/lib/api/auth';

const menuItems = [
  { label: '仪表盘', path: '/dashboard', icon: '📊' },
  { label: '订单管理', path: '/orders', icon: '📋' },
  { label: '日历排期', path: '/calendar', icon: '📅' },
  { label: '素材库', path: '/materials', icon: '🖼️' },
  { label: '收入统计', path: '/income', icon: '💰' },
  { label: 'AI 助手', path: '/ai', icon: '🤖' },
  { label: '导入订单', path: '/import', icon: '📥' },
  { label: '设置', path: '/settings', icon: '⚙️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    getUserProfile()
      .then((res) => setUser(res))
      .catch(() => {
        localStorage.clear();
        router.push('/auth/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--page-back)]">
        <p className="text-[var(--com-text)]">加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--page-back)]">
      {/* 侧边栏 */}
      <aside className="w-64 bg-[var(--page-back)] border-r border-[var(--border-top-light)] p-4 hidden md:flex flex-col">
        <div className="text-xl font-bold mb-6 text-[var(--main-color)] px-2">艺栈</div>
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname?.startsWith(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--main-color-light)] text-[var(--main-color)]'
                    : 'text-[var(--com-text)] hover:bg-[var(--extra-light)] hover:text-[var(--main-text)]'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="pt-4 border-t border-[var(--border-top-light)]">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-[var(--main-color-light)] flex items-center justify-center text-sm font-medium">
              {user?.nickname?.charAt(0) || '?'}
            </div>
            <span className="text-sm text-[var(--com-text)]">{user?.nickname}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 rounded-md text-sm text-[var(--com-color-warn)] hover:bg-[var(--extra-light)]"
          >
            🚪 退出登录
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <header className="bg-[var(--page-back)] border-b border-[var(--border-top-light)] p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--main-text)]">
            {menuItems.find((i) => pathname?.startsWith(i.path))?.label || '艺栈'}
          </h2>
          <div className="md:hidden">{/* 移动端菜单按钮（后续扩展） */}</div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}