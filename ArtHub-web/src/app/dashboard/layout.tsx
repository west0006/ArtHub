import DashboardLayout from '@/components/layout/DashboardLayout';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <DashboardLayout>{children}</DashboardLayout>
    </ErrorBoundary>
  );
}