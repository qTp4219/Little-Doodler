import React from 'react';
import { ColorDef } from '../types';
import { TODDLER_COLORS } from '../content/colors';
import { sound } from '../audio/soundEngine';
import { triggerHaptic } from '../platform/capabilities';

interface ColorPaletteProps {
  selectedColorHex: string;
  onSelectColor: (color: ColorDef) => void;
  orientation?: 'horizontal' | 'vertical';
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  selectedColorHex,
  onSelectColor,
  orientation = 'horizontal',
}) => {
  const handleColorClick = (color: ColorDef) => {
    sound.playColorNote(color.frequency);
    triggerHaptic(20);
    onSelectColor(color);
  };

  const isVertical = orientation === 'vertical';

  // Landscape mode: Vertical 2-column strip on the right side of the screen
  if (isVertical) {
    return (
      <div
        className="p-1.5 rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-md shadow-sm border-2 border-amber-200/90 grid grid-cols-2 gap-1.5 sm:gap-2 max-h-[75vh] overflow-y-auto no-scrollbar touch-pan-y"
      >
        {TODDLER_COLORS.map((color) => {
          const isSelected = selectedColorHex.toLowerCase() === color.hex.toLowerCase();
          return (
            <button
              key={color.id}
              type="button"
              aria-label={`Color ${color.name}`}
              onClick={() => handleColorClick(color)}
              className={`toddler-btn relative shrink-0 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'scale-110 z-10 ring-3 ring-offset-1 ring-amber-400 shadow-md'
                  : 'hover:scale-105 active:scale-95 opacity-95 shadow-xs'
              }`}
              style={{
                backgroundColor: color.hex,
                width: '38px',
                height: '38px',
                boxShadow: isSelected
                  ? '0 4px 8px rgba(0,0,0,0.18), inset 0 2px 2px rgba(255,255,255,0.45)'
                  : '0 2px 4px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.35)',
              }}
            >
              <span
                className="absolute top-1 left-1.5 w-2.5 h-1 rounded-full bg-white/50 pointer-events-none"
                style={{ transform: 'rotate(-25deg)' }}
              />
              {isSelected && (
                <span
                  className="w-2.5 h-2.5 rounded-full bg-white shadow-xs"
                  style={{ border: `2px solid ${color.hex}` }}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Portrait mode:
  // Mobile vertical mode: 2 lines with 5 colors each (grid-cols-5)
  // Tablet vertical mode (sm: and up): 1 line with all colors (sm:flex sm:flex-row)
  return (
    <div className="relative max-w-full flex items-center justify-center px-1">
      <div
        className="p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-md shadow-sm border-2 border-amber-200/90 grid grid-cols-5 gap-2 sm:flex sm:flex-row sm:items-center sm:justify-center sm:gap-2.5 sm:max-w-full"
      >
        {TODDLER_COLORS.map((color) => {
          const isSelected = selectedColorHex.toLowerCase() === color.hex.toLowerCase();

          return (
            <button
              key={color.id}
              type="button"
              aria-label={`Color ${color.name}`}
              onClick={() => handleColorClick(color)}
              className={`toddler-btn relative shrink-0 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'scale-115 z-10 ring-4 ring-offset-2 ring-amber-400 shadow-md'
                  : 'hover:scale-105 active:scale-95 opacity-95 shadow-xs'
              }`}
              style={{
                backgroundColor: color.hex,
                width: '44px',
                height: '44px',
                boxShadow: isSelected
                  ? '0 6px 12px rgba(0,0,0,0.18), inset 0 2px 3px rgba(255,255,255,0.45)'
                  : '0 3px 6px rgba(0,0,0,0.12), inset 0 2px 2px rgba(255,255,255,0.35)',
              }}
            >
              {/* Tactile glossy bubble highlight */}
              <span
                className="absolute top-1 left-2 w-3 h-1.5 rounded-full bg-white/50 pointer-events-none"
                style={{ transform: 'rotate(-25deg)' }}
              />

              {/* Selected dot indicator */}
              {isSelected && (
                <span
                  className="w-3.5 h-3.5 rounded-full bg-white shadow-xs"
                  style={{
                    border: `2px solid ${color.hex}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};


