import React from 'react';
import { ToolType } from '../types';
import { PaintBucket, Pencil, Sparkles, Eraser } from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { triggerHaptic } from '../platform/capabilities';

interface ToolSelectorProps {
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  orientation?: 'horizontal' | 'vertical';
  includeFill?: boolean;
}

export const ToolSelector: React.FC<ToolSelectorProps> = ({
  currentTool,
  onSelectTool,
  orientation = 'horizontal',
  includeFill = true,
}) => {
  const tools: { type: ToolType; label: string; icon: React.ReactNode; bgActive: string }[] = [
    ...(includeFill
      ? [
          {
            type: 'fill' as ToolType,
            label: 'Tap to Fill',
            icon: <PaintBucket className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.4]" />,
            bgActive: 'bg-amber-400 text-amber-950 ring-4 ring-amber-200 border-amber-500',
          },
        ]
      : []),
    {
      type: 'brush',
      label: 'Crayon',
      icon: <Pencil className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.4]" />,
      bgActive: 'bg-sky-400 text-sky-950 ring-4 ring-sky-200 border-sky-500',
    },
    {
      type: 'sparkle',
      label: 'Magic Sparkles',
      icon: <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.4]" />,
      bgActive: 'bg-fuchsia-400 text-fuchsia-950 ring-4 ring-fuchsia-200 border-fuchsia-500',
    },
    {
      type: 'eraser',
      label: 'Eraser',
      icon: <Eraser className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.4]" />,
      bgActive: 'bg-rose-400 text-rose-950 ring-4 ring-rose-200 border-rose-500',
    },
  ];

  const handleToolClick = (tool: ToolType) => {
    sound.playPop(520);
    triggerHaptic(20);
    onSelectTool(tool);
  };

  const isVertical = orientation === 'vertical';

  return (
    <div
      className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-3xl bg-white/90 backdrop-blur-md shadow-sm border-2 border-amber-200/80 ${
        isVertical ? 'flex-col' : 'flex-row'
      }`}
    >
      {tools.map((t) => {
        const isActive = currentTool === t.type;
        return (
          <button
            key={t.type}
            type="button"
            aria-label={t.label}
            onClick={() => handleToolClick(t.type)}
            className={`toddler-btn relative flex items-center justify-center rounded-2xl w-12 h-12 sm:w-14 sm:h-14 transition-all duration-150 cursor-pointer border-2 ${
              isActive
                ? `${t.bgActive} shadow-md scale-105 font-bold`
                : 'bg-amber-50/80 text-amber-900 border-amber-200/60 hover:bg-amber-100/90 active:scale-95'
            }`}
          >
            {t.icon}
          </button>
        );
      })}
    </div>
  );
};

