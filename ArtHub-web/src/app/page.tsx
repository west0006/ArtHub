import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--page-back)]">
      <div className="card-quark max-w-md w-full text-center p-8">
        <h1 className="text-3xl font-bold text-[var(--main-color)] mb-4">艺栈</h1>
        <p className="text-[var(--com-text)] mb-8">灵感·订单·素材·AI</p>
        <Link
          href="/auth/login"
          className="btn-quark btn-quark-primary inline-block px-6 py-2"
        >
          登录
        </Link>
      </div>
    </main>
  );
}