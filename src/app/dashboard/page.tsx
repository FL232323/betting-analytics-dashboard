import { Metadata } from 'next';
import { BettingDashboard } from '@/components/dashboard/betting-dashboard';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Upload and analyze your betting history',
};

export default function DashboardPage() {
  return <BettingDashboard />;
}