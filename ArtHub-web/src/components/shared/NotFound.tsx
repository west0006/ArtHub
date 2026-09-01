import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export const NotFound: React.FC<{ message?: string }> = ({
  message = '您访问的页面不存在',
}) => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="card-quark max-w-md w-full text-center p-8">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-xl font-semibold text-[var(--main-text)] mb-2">
          404
        </h2>
        <p className="text-sm text-[var(--com-text)] mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="default" onClick={() => router.back()}>
            返回上一页
          </Button>
          <Button variant="primary" onClick={() => router.push('/dashboard')}>
            回到首页
          </Button>
        </div>
      </div>
    </div>
  );
};