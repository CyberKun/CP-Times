import React from 'react';

export function Footer() {
  return (
    <footer className="border-t border-[#30363D] py-6 mt-auto w-full">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-1">
        <p className="text-[#8B949E] text-xs">© {new Date().getFullYear()} CP Times</p>
        <p className="text-[#8B949E]/60 text-[10px]">
          Similar problems powered by{' '}
          <a
            href="https://github.com/coldchair/CPRet"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#8B949E] transition-colors duration-75"
          >
            CPRet
          </a>
          {' '}(NeurIPS 2025)
        </p>
      </div>
    </footer>
  );
}

