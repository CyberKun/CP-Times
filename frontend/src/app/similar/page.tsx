import { SimilarPage } from '@/components/similar/SimilarPage';
import { AppShell } from '@/components/layout/AppShell';
import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: 'Similar Problems | CP Times',
  description:
    'Find similar competitive programming problems using CPRet semantic embeddings. Powered by precomputed similarity across Codeforces, LeetCode, AtCoder, and CodeChef.',
};

export default function SimilarProblemsPage() {
  return (
    <AppShell>
      <div className="max-w-[1100px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 pb-12">
        <SimilarPage />
      </div>
      <Footer />
    </AppShell>
  );
}
