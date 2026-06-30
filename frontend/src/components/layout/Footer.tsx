import React from 'react';

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-6 mt-auto w-full">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
        <p className="text-zinc-600 text-xs">© {new Date().getFullYear()} CP Times</p>
      </div>
    </footer>
  );
}
