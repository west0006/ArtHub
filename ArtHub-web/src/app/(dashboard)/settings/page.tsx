'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile } from '@/lib/api/auth';
import request from '@/lib/request';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({ old: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    getUserProfile()
      .then((res) => setUser(res))
      .catch(() => router.push('/auth/login'))
      .finally(() => setLoading(false));
  }, [router]);

  const handlePasswordChange = async () => {
    if (!passwordData.old || !passwordData.new || !passwordData.confirm) {
      setPasswordError('请填写所有密码字段');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      setPasswordError('新密码与确认密码不一致');
      return;
    }
    if (passwordData.new.length < 6) {
      setPasswordError('新密码至少 6 位');
      return;
    }
    setChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      await request.put('/auth/profile', {
        oldPassword: passwordData.old,
        newPassword: passwordData.new,
      });
      setPasswordSuccess('密码修改成功');
      setPasswordData({ old: '', new: '', confirm: '' });
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || '修改失败');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/auth/login');
  };

  if (loading) return <div className="flex justify-center items-center h-64"><p className="text-gray-500">加载中...</p></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">设置</h1>

      {/* 个人资料卡片 */}
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-lg font-medium mb-4">个人资料</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">昵称：</span>{user?.nickname || '-'}</div>
          <div><span className="text-gray-500">邮箱：</span>{user?.email || '-'}</div>
          <div><span className="text-gray-500">角色：</span>{user?.role === 0 ? '普通用户' : user?.role === 1 ? '画师' : '管理员'}</div>
          <div><span className="text-gray-500">注册时间：</span>{user?.createTime ? new Date(user.createTime).toLocaleDateString() : '-'}</div>
        </div>
      </div>

      {/* 修改密码 */}
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-lg font-medium mb-4">修改密码</h2>
        <div className="space-y-3 max-w-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700">当前密码</label>
            <input
              type="password"
              value={passwordData.old}
              onChange={(e) => setPasswordData({ ...passwordData, old: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">新密码</label>
            <input
              type="password"
              value={passwordData.new}
              onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">确认新密码</label>
            <input
              type="password"
              value={passwordData.confirm}
              onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded p-2"
            />
          </div>
          {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
          {passwordSuccess && <p className="text-green-600 text-sm">{passwordSuccess}</p>}
          <button
            onClick={handlePasswordChange}
            disabled={changingPassword}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {changingPassword ? '修改中...' : '保存密码'}
          </button>
        </div>
      </div>

      {/* 退出登录 */}
      <div className="bg-white rounded shadow p-6">
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
        >
          退出登录
        </button>
      </div>
    </div>
  );
}