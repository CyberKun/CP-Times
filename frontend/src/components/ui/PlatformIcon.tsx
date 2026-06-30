import React from 'react';

export const PlatformIcon = ({ platform, color, className, style }: { platform: string, color?: string, className?: string, style?: React.CSSProperties }) => {
  if (platform === 'CODEFORCES') {
    return (
      <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={style}>
        <rect x="2" y="11" width="5" height="10" rx="1" fill="#F1C40F" />
        <rect x="9.5" y="4" width="5" height="17" rx="1" fill="#3498DB" />
        <rect x="17" y="7" width="5" height="14" rx="1" fill="#E74C3C" />
      </svg>
    );
  }
  if (platform === 'LEETCODE') {
    return (
      <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={style}>
        <path fill={color || "#FFA116"} d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125 2.15c.16.897.472 1.733.911 2.476.44.743 1.002 1.393 1.654 1.916L12.51 23.473a1.372 1.372 0 0 0 1.956-.039 1.372 1.372 0 0 0-.039-1.956l-8.017-7.469a1.732 1.732 0 0 1-.363-.591 1.765 1.765 0 0 1 .041-.708 1.745 1.745 0 0 1 .4-.694l3.854-4.126 5.406-5.788a1.374 1.374 0 0 0-.304-2.127 1.374 1.374 0 0 0-.962-.128z" />
        <path fill={color || "#FFA116"} fillOpacity="0.5" d="M20.67 11.047l-8.015-7.469a1.374 1.374 0 1 0-1.878 2.016l8.016 7.469a1.742 1.742 0 0 1 .364.591 1.767 1.767 0 0 1-.041.708 1.742 1.742 0 0 1-.4.694l-3.853 4.126-5.405 5.788a1.374 1.374 0 0 0 .922 2.343 1.374 1.374 0 0 0 .962-.438l5.405-5.788 3.853-4.126a5.264 5.264 0 0 0 1.209-2.104 5.352 5.352 0 0 0 .125-2.15 5.354 5.354 0 0 0-.91-2.476 5.354 5.354 0 0 0-1.655-1.916z" />
      </svg>
    );
  }
  if (platform === 'ATCODER') {
    return (
      <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={style}>
        <circle cx="12" cy="12" r="12" fill={color || "#222222"} />
        <path d="M12 4L18 16H6L12 4Z" fill="white" />
        <path d="M10 13H14L12 9L10 13Z" fill={color || "#222222"} />
      </svg>
    );
  }
  if (platform === 'CODECHEF') {
    return (
      <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={style}>
        <path fill={color || "#5B4638"} d="M12.004 0L1.758 5.922v12.16L12.004 24l10.238-5.922V5.922L12.004 0zm0 1.258L21.05 6.486v11.028L12.004 22.74l-9.042-5.228V6.486L12.004 1.258zm0 2.29l-6.816 3.94v7.882L12.004 19.31l6.816-3.94V7.488L12.004 3.55zm0 1.257l5.632 3.256v6.512L12.004 17.83l-5.632-3.255v-6.513L12.004 4.805zm0 1.637l-4.22 2.438v4.877L12.004 16.2l4.22-2.438v-4.877L12.004 6.442z"/>
      </svg>
    );
  }
  return (
    <div 
      className={className || "w-2 h-2 rounded-full"} 
      style={{ backgroundColor: color, ...style }} 
    />
  );
};
