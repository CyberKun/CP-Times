import { ContestCalendar } from '@/components/contests/ContestCalendar';
import { AppShell } from '@/components/layout/AppShell';

export const metadata = {
  title: 'Contest Calendar | CP Times',
  description: 'Track upcoming competitive programming contests from Codeforces and LeetCode.',
};

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 pb-12">
        <ContestCalendar />
      </div>
    </AppShell>
  );
}
