import React, { useState } from 'react';
import { Home, Undo2, RotateCcw, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { toggleFullscreen, triggerHaptic } from '../platform/capabilities';

interface TopBarProps {
  title?: string;
  onHomeClick: () => void;
  canUndo?: boolean;
  onUndo?: () => void;
  onReset?: () => void;
  showTools?: boolean;
  guideElement?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({
  title = 'Little Doodler',
  onHomeClick,
  canUndo = false,
  onUndo,
  onReset,
  showTools = true,
  guideElement,
}) => {
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    triggerHaptic(15);
  };

  const handleFullscreen = () => {
    toggleFullscreen();
    triggerHaptic(15);
  };

  const handleUndo = () => {
    if (!canUndo || !onUndo) return;
    triggerHaptic(20);
    onUndo();
  };

  const handleResetClick = () => {
    if (!onReset) return;
    if (showResetConfirm) {
      onReset();
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  };

  return (
    <header className="w-full shrink-0 flex items-center justify-between px-2 sm:px-4 py-1 sm:py-2 z-30 select-none bg-white/80 backdrop-blur-xs border-b border-amber-100/70">
      {/* Left: Home button + Picture title + Optional Guide button */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          aria-label="Back to Home"
          onClick={() => {
            triggerHaptic(25);
            sound.playPop(400);
            onHomeClick();
          }}
          className="toddler-btn w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 border-2 border-amber-300 shadow-xs flex items-center justify-center cursor-pointer active:scale-90"
        >
          <Home className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4]" />
        </button>

        {/* Title */}
        <span className="text-sm sm:text-xl font-bold tracking-tight text-amber-950 px-0.5 truncate max-w-[100px] sm:max-w-xs">
          {title}
        </span>

        {/* Guide Suggestion Button in TopBar */}
        {guideElement && (
          <div className="shrink-0 flex items-center">
            {guideElement}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {showTools && onUndo && (
          <button
            type="button"
            disabled={!canUndo}
            aria-label="Undo last action"
            onClick={handleUndo}
            className={`toddler-btn w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center transition-all ${
              canUndo
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300 shadow-xs cursor-pointer active:scale-90'
                : 'bg-amber-50/40 text-amber-300 border-amber-100/40 opacity-40 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.6]" />
          </button>
        )}

        {showTools && onReset && (
          <button
            type="button"
            aria-label={showResetConfirm ? 'Tap again to clean canvas' : 'Clean canvas'}
            onClick={handleResetClick}
            className={`toddler-btn h-9 sm:h-11 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center transition-all ${
              showResetConfirm
                ? 'px-2.5 bg-rose-500 text-white border-rose-600 shadow-md ring-3 ring-rose-200'
                : 'w-9 sm:w-11 bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300 shadow-xs active:scale-90'
            }`}
          >
            {showResetConfirm ? (
              <span className="text-[11px] sm:text-xs font-bold tracking-tight">Clean?</span>
            ) : (
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            )}
          </button>
        )}

        {/* Audio Mute Toggle */}
        <button
          type="button"
          aria-label={isMuted ? 'Turn Sound On' : 'Turn Sound Off'}
          onClick={handleToggleSound}
          className="toddler-btn w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white hover:bg-amber-50 text-amber-900 border-2 border-amber-200 shadow-xs flex items-center justify-center cursor-pointer active:scale-90"
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 stroke-[2.4]" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-800 stroke-[2.4]" />
          )}
        </button>

        {/* Fullscreen Button on desktop/tablets */}
        <button
          type="button"
          aria-label="Toggle Fullscreen"
          onClick={handleFullscreen}
          className="hidden md:flex toddler-btn w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white hover:bg-amber-50 text-amber-900 border-2 border-amber-200 shadow-xs items-center justify-center cursor-pointer active:scale-90"
        >
          <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.3]" />
        </button>
      </div>
    </header>
  );
};

