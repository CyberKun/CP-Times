import React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, onCheckedChange, checked, onChange, ...props }, ref) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) onChange(e);
      if (onCheckedChange) onCheckedChange(e.target.checked);
    };

    return (
      <label className="flex items-center gap-2 cursor-pointer group">
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            ref={ref}
            checked={checked}
            onChange={handleChange}
            className="peer sr-only"
            {...props}
          />
          <div className={cn(
            "w-5 h-5 rounded border border-[#30363D] bg-[#161B22]",
            "peer-focus:ring-1 peer-focus:ring-[#30363D]",
            "transition-colors duration-100",
            "peer-checked:bg-[#E6EDF3] peer-checked:border-[#E6EDF3]",
            className
          )}>
          </div>
          <Check 
            className={cn(
              "absolute w-3.5 h-3.5 text-[#0D1117] opacity-0 transition-opacity duration-100",
              checked && "opacity-100"
            )} 
          />
        </div>
        {label && (
          <span className="text-sm text-[#8B949E] group-hover:text-[#E6EDF3] transition-colors duration-100">
            {label}
          </span>
        )}
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';
