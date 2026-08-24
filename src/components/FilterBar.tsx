import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../data/mockVideos';

interface FilterBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categories?: string[];
}

export const FilterBar = ({
  selectedCategory,
  onSelectCategory,
  categories = CATEGORIES,
}: FilterBarProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-14 z-30 flex items-center bg-[#0f0f0f]/95 backdrop-blur-md px-4 py-3 border-b border-[#212121] group">
      {/* Scroll Left Button */}
      <button
        onClick={() => scroll('left')}
        className="hidden group-hover:flex items-center justify-center w-8 h-8 rounded-full bg-[#0f0f0f]/90 hover:bg-[#272727] text-white shadow-lg border border-[#303030] mr-2 shrink-0 transition-colors"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Horizontal Pills */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap py-0.5"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all shrink-0 ${
                isSelected
                  ? 'bg-[#f1f1f1] text-[#0f0f0f] font-semibold shadow-sm'
                  : 'bg-[#272727] hover:bg-[#3f3f3f] text-[#f1f1f1]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      <button
        onClick={() => scroll('right')}
        className="hidden group-hover:flex items-center justify-center w-8 h-8 rounded-full bg-[#0f0f0f]/90 hover:bg-[#272727] text-white shadow-lg border border-[#303030] ml-2 shrink-0 transition-colors"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
