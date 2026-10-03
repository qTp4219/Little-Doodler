import React, { useMemo } from 'react';
import { ColoringPicture } from '../types';
import { loadColoringFills } from '../storage/persistence';

interface PictureThumbnailProps {
  picture: ColoringPicture;
  onClick: () => void;
}

export const PictureThumbnail: React.FC<PictureThumbnailProps> = ({ picture, onClick }) => {
  // Check if child has already colored some regions
  const currentFills = useMemo(() => {
    const saved = loadColoringFills(picture.id);
    const fills: Record<string, string> = {};
    for (const region of picture.regions) {
      fills[region.id] = (saved && saved[region.id]) || region.suggestedColor || region.defaultColor || '#FDE047';
    }
    return fills;
  }, [picture]);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Color ${picture.title}`}
      className="toddler-btn group relative flex flex-col items-center justify-between bg-white rounded-2xl sm:rounded-3xl p-1.5 sm:p-3 shadow-sm hover:shadow-md border-2 border-amber-100 hover:border-amber-300 transition-all duration-150 cursor-pointer w-full h-full text-left overflow-hidden"
    >
      {/* Visual background card tint */}
      <div
        className="w-full flex-1 min-h-0 rounded-xl sm:rounded-2xl flex items-center justify-center p-1.5 sm:p-2 overflow-hidden transition-transform duration-200 group-hover:scale-102"
        style={{ backgroundColor: '#FAF6F0' }}
      >
        <svg
          viewBox={picture.viewBox}
          className="w-full h-full max-h-full aspect-square drop-shadow-xs pointer-events-none"
        >
          {/* Filled regions */}
          {picture.regions.map((region) => (
            <path
              key={region.id}
              d={region.path}
              fill={currentFills[region.id] || '#FFFFFF'}
              stroke="#1E293B"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Outlines and details */}
          {picture.outlines.map((outline, idx) => (
            <path
              key={`out_${idx}`}
              d={outline.path}
              fill={outline.fill || 'none'}
              stroke={outline.strokeWidth ? '#1E293B' : 'none'}
              strokeWidth={outline.strokeWidth ? outline.strokeWidth * 0.9 : 0}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
      </div>

      {/* Title */}
      <div className="w-full shrink-0 flex items-center justify-between mt-1 px-1">
        <span className="text-xs sm:text-base font-bold text-amber-950 truncate">
          {picture.title}
        </span>
        <span
          className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
          style={{ backgroundColor: picture.accentColor }}
        />
      </div>
    </button>
  );
};
