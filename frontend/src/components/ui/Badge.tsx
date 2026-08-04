import { cn } from '@/lib/utils';

interface BadgeProps {
  label: string;
  color: string;
  variant?: 'solid' | 'outline' | 'glow';
  size?: 'sm' | 'md';
}

export function Badge({
  label,
  color,
  variant = 'solid',
  size = 'sm',
}: BadgeProps) {
  const baseClasses = cn(
    'inline-flex items-center font-mono font-medium rounded whitespace-nowrap uppercase tracking-widest',
    size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
  );

  if (variant === 'outline') {
    return (
      <span
        className={baseClasses}
        style={{
          border: `1px solid ${color}50`,
          color: color,
          backgroundColor: 'transparent',
        }}
      >
        {label}
      </span>
    );
  }

  // solid and glow both render the same (no glow shadow)
  return (
    <span
      className={baseClasses}
      style={{
        backgroundColor: `${color}18`,
        color: color,
      }}
    >
      {label}
    </span>
  );
}
