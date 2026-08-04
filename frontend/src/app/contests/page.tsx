import { ContestCalendar } from '@/components/contests/ContestCalendar';
import AppShell from '@/components/layout/AppShell';

export const metadata = {
  title: 'Contest Tracker | CP Times',
  description: 'Track upcoming competitive programming contests from Codeforces, LeetCode, AtCoder, and CodeChef.',
};

export default function ContestsPage() {
  return (
    <AppShell>
      <ContestCalendar />
    </AppShell>
  );
}
