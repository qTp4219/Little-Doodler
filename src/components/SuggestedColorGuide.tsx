import React, { useState } from 'react';
import { ColoringPicture } from '../types';
import { Sparkles, X } from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { triggerHaptic } from '../platform/capabilities';

interface SuggestedColorGuideProps {
  picture: ColoringPicture;
}

export const SuggestedColorGuide: React.FC<SuggestedColorGuideProps> = ({ picture }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    sound.playPop(520);
    triggerHaptic(15);
    setIsExpanded((prev) => !prev);
  };

  return (
    <>
      {/* Compact Mini-Guide Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Color suggestion guide"
        className="toddler-btn group relative flex items-center gap-1.5 p-1 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 border-2 border-amber-300 shadow-xs cursor-pointer active:scale-90"
        title="Tap to see color suggestion"
      >
        {/* Mini preview thumbnail */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white p-0.5 flex items-center justify-center overflow-hidden border border-amber-200/80">
          <svg
            viewBox={picture.viewBox}
            className="w-full h-full pointer-events-none drop-shadow-xs"
          >
            {picture.regions.map((region) => (
              <path
                key={region.id}
                d={region.path}
                fill={region.suggestedColor || region.defaultColor || '#FDE047'}
                stroke="#1E293B"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
            {picture.outlines.map((outline, idx) => (
              <path
                key={`guide_out_${idx}`}
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

        <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold pr-1.5 text-amber-950">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-300" />
          Idea
        </span>
      </button>

      {/* Expanded Friendly Popover Modal */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-0 duration-150"
          onClick={handleToggle}
        >
          <div
            className="relative bg-white rounded-3xl p-4 sm:p-6 max-w-xs sm:max-w-sm w-full shadow-2xl border-4 border-amber-300 flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-1 border-b border-amber-100">
              <span className="text-base sm:text-lg font-bold text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-300" />
                Color Suggestion
              </span>
              <button
                type="button"
                onClick={handleToggle}
                className="toddler-btn w-9 h-9 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Large reference artwork */}
            <div className="w-full aspect-square rounded-2xl bg-amber-50/70 p-3 flex items-center justify-center overflow-hidden border-2 border-amber-200/80">
              <svg viewBox={picture.viewBox} className="w-full h-full drop-shadow-sm">
                {picture.regions.map((region) => (
                  <path
                    key={region.id}
                    d={region.path}
                    fill={region.suggestedColor || region.defaultColor || '#FDE047'}
                    stroke="#1E293B"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
                {picture.outlines.map((outline, idx) => (
                  <path
                    key={`modal_out_${idx}`}
                    d={outline.path}
                    fill={outline.fill || 'none'}
                    stroke={outline.strokeWidth ? '#1E293B' : 'none'}
                    strokeWidth={outline.strokeWidth || 0}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-amber-800 text-center">
              You can color like this, or use any colors you like!
            </p>
          </div>
        </div>
      )}
    </>
  );
};

