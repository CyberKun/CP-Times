'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface DualSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
}

export const DualSlider: React.FC<DualSliderProps> = ({ min, max, value, onChange, className }) => {
  const [minVal, setMinVal] = useState(value[0]);
  const [maxVal, setMaxVal] = useState(value[1]);
  const minValRef = useRef<HTMLInputElement>(null);
  const maxValRef = useRef<HTMLInputElement>(null);
  const range = useRef<HTMLDivElement>(null);

  // Convert to percentage
  const getPercent = useCallback(
    (val: number) => Math.round(((val - min) / (max - min)) * 100),
    [min, max]
  );

  // Set width of the range to decrease from the left side
  useEffect(() => {
    if (maxValRef.current) {
      const minPercent = getPercent(minVal);
      const maxPercent = getPercent(maxValRef.current.valueAsNumber);

      if (range.current) {
        range.current.style.left = `${minPercent}%`;
        range.current.style.width = `${maxPercent - minPercent}%`;
      }
    }
  }, [minVal, getPercent]);

  // Set width of the range to decrease from the right side
  useEffect(() => {
    if (minValRef.current) {
      const minPercent = getPercent(minValRef.current.valueAsNumber);
      const maxPercent = getPercent(maxVal);

      if (range.current) {
        range.current.style.width = `${maxPercent - minPercent}%`;
      }
    }
  }, [maxVal, getPercent]);

  useEffect(() => {
    setMinVal(value[0]);
    setMaxVal(value[1]);
  }, [value]);

  const handleMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(event.target.value), maxVal - 1);
    setMinVal(val);
    onChange([val, maxVal]);
  };

  const handleMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(event.target.value), minVal + 1);
    setMaxVal(val);
    onChange([minVal, val]);
  };

  return (
    <div className={cn("relative w-full flex items-center h-5", className)}>
      <input
        type="range"
        min={min}
        max={max}
        value={minVal}
        ref={minValRef}
        onChange={handleMinChange}
        className="pointer-events-none absolute w-full h-1 appearance-none bg-transparent outline-none z-30"
      />
      <input
        type="range"
        min={min}
        max={max}
        value={maxVal}
        ref={maxValRef}
        onChange={handleMaxChange}
        className="pointer-events-none absolute w-full h-1 appearance-none bg-transparent outline-none z-40"
      />

      <div className="relative w-full h-1 bg-[#30363D] rounded z-10">
        <div ref={range} className="absolute h-1 bg-[#E6EDF3] rounded z-20" />
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        input[type=range]::-webkit-slider-thumb {
          pointer-events: all;
          width: 16px;
          height: 16px;
          -webkit-appearance: none;
          border-radius: 4px;
          background: #E6EDF3;
          cursor: pointer;
        }
        input[type=range]::-moz-range-thumb {
          pointer-events: all;
          width: 16px;
          height: 16px;
          appearance: none;
          border-radius: 4px;
          background: #E6EDF3;
          cursor: pointer;
          border: none;
        }
      `}} />
    </div>
  );
};
