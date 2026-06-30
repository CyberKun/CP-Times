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
    'inline-flex items-center font-mono font-medium rounded-md whitespace-nowrap uppercase tracking-widest',
    size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'
  );

  if (variant === 'solid') {
    return (
      <span
        className={baseClasses}
        style={{
          backgroundColor: `${color}10`,
          color: color,
        }}
      >
        {label}
      </span>
    );
  }

  if (variant === 'outline') {
    return (
      <span
        className={baseClasses}
        style={{
          border: `1px solid ${color}30`,
          color: color,
          backgroundColor: 'transparent',
        }}
      >
        {label}
      </span>
    );
  }

  // glow variant
  return (
    <span
      className={baseClasses}
      style={{
        backgroundColor: `${color}10`,
        color: color,
        boxShadow: `0 0 8px ${color}15`,
      }}
    >
      {label}
    </span>
  );
}
