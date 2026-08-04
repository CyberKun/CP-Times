'use client';

import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0A0E17' }}>
      <Sidebar />
      <div
        className="flex-1 flex flex-col min-h-screen"
        style={{ marginLeft: 240 }}
      >
        <Topbar />
        <main className="flex-1" style={{ padding: 32 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
