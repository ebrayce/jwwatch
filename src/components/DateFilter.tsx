import React, { useEffect, useRef } from 'react';
import { format, isSameDay } from 'date-fns';

interface DateFilterProps {
  dates: Date[];
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
}

export const DateFilter: React.FC<DateFilterProps> = ({ dates, selectedDate, onSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll logic can be enhanced here if needed
  }, [selectedDate]);

  if (dates.length === 0) {
    return <div className="h-12"></div>;
  }

  return (
    <div 
      ref={scrollRef}
      className="flex overflow-x-auto gap-2 px-4 pb-2 no-scrollbar"
    >
      {dates.map((date, idx) => {
        const isSelected = selectedDate && isSameDay(date, selectedDate);
        return (
          <button
            key={idx}
            onClick={() => onSelect(date)}
            className={`
              flex flex-col items-center justify-center min-w-[4.5rem] py-2 rounded-xl border transition-all shrink-0
              ${isSelected 
                ? 'bg-teal-600 text-white border-teal-600 shadow-md transform scale-105' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
              }
            `}
          >
            <span className={`text-xs font-medium ${isSelected ? 'text-teal-100' : 'text-gray-400'}`}>
              {format(date, 'EEE')}
            </span>
            <span className={`text-xl font-bold leading-none my-0.5`}>
              {format(date, 'd')}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-teal-100' : 'text-gray-500'}`}>
              {format(date, 'MMM')}
            </span>
          </button>
        );
      })}
    </div>
  );
};