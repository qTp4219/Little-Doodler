import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ColoringPicture } from '../types';
import { COLORING_PICTURES, getShuffledPictures } from '../content/pictures';
import { PictureThumbnail } from '../components/PictureThumbnail';
import { sound } from '../audio/soundEngine';
import { triggerHaptic } from '../platform/capabilities';
import { Sparkles, Palette, Volume2, VolumeX, Pencil, ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';

interface HomeScreenProps {
  onSelectPicture: (picture: ColoringPicture) => void;
  onOpenFreeDraw: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectPicture,
  onOpenFreeDraw,
}) => {
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [shuffledList, setShuffledList] = useState<ColoringPicture[]>(() =>
    getShuffledPictures(COLORING_PICTURES)
  );
  const [itemsPerPage, setItemsPerPage] = useState<number>(4);
  const [isLandscape, setIsLandscape] = useState<boolean>(false);

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  // Responsive calculation of items per page to guarantee FIXED screen with zero overflow
  useEffect(() => {
    const updateLayout = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const landscape = w > h && h < 550;
      setIsLandscape(landscape);

      if (landscape) {
        // Small mobile landscape: 1 row of 3 or 4 cards
        setItemsPerPage(w < 740 ? 3 : 4);
      } else if (w < 640) {
        // Mobile portrait: 2x2 grid (4 cards)
        setItemsPerPage(4);
      } else if (w < 1024) {
        // Tablet: 2x3 grid (6 cards)
        setItemsPerPage(6);
      } else {
        // Desktop: 2x4 grid (8 cards)
        setItemsPerPage(8);
      }
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'animals', label: 'Animals' },
    { id: 'vehicles', label: 'Vehicles' },
    { id: 'nature', label: 'Nature' },
    { id: 'fantasy', label: 'Fun & Magic' },
  ];

  // Filtered pictures based on active category
  const filteredPictures = useMemo(() => {
    if (selectedCategory === 'all') return shuffledList;
    return shuffledList.filter((p) => p.category === selectedCategory);
  }, [selectedCategory, shuffledList]);

  // Total pages calculation (Page 0 in 'all' category includes 1 Free Draw card)
  const totalSlots = selectedCategory === 'all' ? filteredPictures.length + 1 : filteredPictures.length;
  const totalPages = Math.max(1, Math.ceil(totalSlots / itemsPerPage));

  // Reset to first page when category changes
  const handleCategorySelect = (catId: string) => {
    sound.playPop(420);
    triggerHaptic(15);
    setSelectedCategory(catId);
    setCurrentPage(0);
  };

  // Shuffle / Randomize pictures
  const handleShuffle = () => {
    sound.playSparkle();
    triggerHaptic(25);
    setShuffledList(getShuffledPictures(COLORING_PICTURES));
    setCurrentPage(0);
  };

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      sound.playPop(480);
      triggerHaptic(20);
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      sound.playPop(380);
      triggerHaptic(20);
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;

    // Horizontal swipe threshold: > 45px and more horizontal than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 45) {
      if (deltaX > 0) {
        handleNextPage();
      } else {
        handlePrevPage();
      }
    }
  };

  const handleSelectPicture = (picture: ColoringPicture) => {
    sound.playFanfare();
    triggerHaptic(30);
    onSelectPicture(picture);
  };

  const handleSelectFreeDraw = () => {
    sound.playSparkle();
    triggerHaptic(30);
    onOpenFreeDraw();
  };

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    triggerHaptic(15);
  };

  // Slice items for current page
  const pageItems = useMemo(() => {
    if (selectedCategory === 'all') {
      if (currentPage === 0) {
        // Page 0: Free Draw card + (itemsPerPage - 1) pictures
        return [
          { type: 'freedraw' as const },
          ...filteredPictures.slice(0, itemsPerPage - 1).map((pic) => ({ type: 'picture' as const, picture: pic })),
        ];
      } else {
        // Subsequent pages
        const startIdx = (currentPage * itemsPerPage) - 1;
        return filteredPictures
          .slice(startIdx, startIdx + itemsPerPage)
          .map((pic) => ({ type: 'picture' as const, picture: pic }));
      }
    } else {
      const startIdx = currentPage * itemsPerPage;
      return filteredPictures
        .slice(startIdx, startIdx + itemsPerPage)
        .map((pic) => ({ type: 'picture' as const, picture: pic }));
    }
  }, [selectedCategory, currentPage, itemsPerPage, filteredPictures]);

  return (
    <div
      className="w-full h-full min-h-[100dvh] max-h-[100dvh] flex flex-col bg-[#FFFDF9] select-none overflow-hidden touch-pan-x"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ultra-compact Top Header - Stays small so pictures dominate the viewport */}
      <header className="w-full shrink-0 flex items-center justify-between px-2 sm:px-5 py-1 sm:py-2 border-b border-amber-100/80 bg-white/80 backdrop-blur-xs z-20">
        {/* Brand / App Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center shadow-xs border-2 border-amber-300">
            <Palette className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.4]" />
          </div>
          <span className="text-base sm:text-xl font-bold tracking-tight text-amber-950">
            Little Doodler
          </span>
        </div>

        {/* Category Tabs (Compact) */}
        <div className="hidden sm:flex items-center gap-1 p-0.5 bg-amber-100/70 rounded-2xl overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySelect(cat.id)}
              className={`px-2.5 py-1 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-white text-amber-950 shadow-xs'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Right Actions: Shuffle & Sound */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            aria-label="Randomize picture order"
            onClick={handleShuffle}
            title="Randomize pictures"
            className="toddler-btn px-2.5 h-8 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 text-amber-950 shadow-xs flex items-center gap-1 text-xs font-bold cursor-pointer active:scale-90"
          >
            <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-800 stroke-[2.4]" />
            <span className="hidden xs:inline">Mix</span>
          </button>

          <button
            type="button"
            aria-label={isMuted ? 'Turn Sound On' : 'Turn Sound Off'}
            onClick={toggleSound}
            className="toddler-btn w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white border-2 border-amber-200/80 shadow-xs flex items-center justify-center text-amber-900 cursor-pointer active:scale-90"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 stroke-[2.3]" />
            ) : (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-800 stroke-[2.3]" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile-only Category Filter Strip */}
      <div className="sm:hidden w-full px-2 py-1 bg-amber-50/80 border-b border-amber-100/50 flex items-center gap-1 overflow-x-auto no-scrollbar touch-pan-x shrink-0">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleCategorySelect(cat.id)}
            className={`px-2.5 py-1 text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
              selectedCategory === cat.id
                ? 'bg-amber-400 text-amber-950 shadow-xs'
                : 'bg-white/80 text-amber-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Interactive Stage: FIXED TO SCREEN, NO VERTICAL SCROLL */}
      <main className="flex-1 w-full min-h-0 relative flex items-center justify-center p-2 sm:p-4 overflow-hidden">
        {/* Left Side Arrow Button for Toddlers */}
        {currentPage > 0 && (
          <button
            type="button"
            aria-label="Previous pictures"
            onClick={handlePrevPage}
            className="toddler-btn absolute left-1 sm:left-3 z-30 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-amber-400/90 hover:bg-amber-400 text-amber-950 border-2 border-amber-300 shadow-md flex items-center justify-center cursor-pointer active:scale-90"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 stroke-[3]" />
          </button>
        )}

        {/* Fixed Responsive Picture Grid */}
        <div
          className={`w-full h-full max-w-5xl mx-auto grid gap-2 sm:gap-4 items-center justify-center ${
            isLandscape
              ? itemsPerPage === 3
                ? 'grid-cols-3 grid-rows-1'
                : 'grid-cols-4 grid-rows-1'
              : itemsPerPage === 4
              ? 'grid-cols-2 grid-rows-2'
              : itemsPerPage === 6
              ? 'grid-cols-3 grid-rows-2'
              : 'grid-cols-4 grid-rows-2'
          }`}
        >
          {pageItems.map((item, idx) => {
            if (item.type === 'freedraw') {
              return (
                <button
                  key="freedraw_card"
                  type="button"
                  onClick={handleSelectFreeDraw}
                  aria-label="Free Drawing on blank paper"
                  className="toddler-btn group relative flex flex-col items-center justify-between bg-white rounded-2xl sm:rounded-3xl p-1.5 sm:p-3 shadow-sm hover:shadow-md border-3 border-amber-300 hover:border-amber-400 transition-all cursor-pointer w-full h-full overflow-hidden text-left"
                >
                  <div className="w-full flex-1 min-h-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 flex flex-col items-center justify-center p-2 relative overflow-hidden border-2 border-amber-200">
                    <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white shadow-xs flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                      <Pencil className="w-5 h-5 sm:w-8 sm:h-8 text-amber-500 stroke-[2.4]" />
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500 fill-amber-300" />
                      <span className="text-[10px] sm:text-xs font-bold text-amber-900 uppercase tracking-wide">
                        Blank Paper
                      </span>
                    </div>
                  </div>

                  <div className="w-full shrink-0 flex items-center justify-between mt-1 px-1">
                    <span className="text-xs sm:text-base font-bold text-amber-950 truncate">
                      Free Draw
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  </div>
                </button>
              );
            }

            return (
              <div key={item.picture.id} className="w-full h-full flex items-center justify-center">
                <PictureThumbnail
                  picture={item.picture}
                  onClick={() => handleSelectPicture(item.picture)}
                />
              </div>
            );
          })}
        </div>

        {/* Right Side Arrow Button for Toddlers */}
        {currentPage < totalPages - 1 && (
          <button
            type="button"
            aria-label="Next pictures"
            onClick={handleNextPage}
            className="toddler-btn absolute right-1 sm:right-3 z-30 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-amber-400/90 hover:bg-amber-400 text-amber-950 border-2 border-amber-300 shadow-md flex items-center justify-center cursor-pointer active:scale-90"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 stroke-[3]" />
          </button>
        )}
      </main>

      {/* Bottom Swipe Indicator & Page Dots */}
      <footer className="w-full shrink-0 py-1.5 sm:py-2 flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-t from-amber-50/90 to-transparent">
        <span className="text-[11px] font-bold text-amber-900/60 mr-1 hidden sm:inline">
          Swipe or tap:
        </span>
        {Array.from({ length: Math.min(10, totalPages) }).map((_, pIdx) => (
          <button
            key={`dot_${pIdx}`}
            type="button"
            aria-label={`Go to page ${pIdx + 1}`}
            onClick={() => {
              sound.playPop(400);
              setCurrentPage(pIdx);
            }}
            className={`transition-all duration-200 rounded-full cursor-pointer ${
              currentPage === pIdx
                ? 'w-6 sm:w-8 h-2.5 sm:h-3 bg-amber-500'
                : 'w-2.5 sm:w-3 h-2.5 sm:h-3 bg-amber-200 hover:bg-amber-300'
            }`}
          />
        ))}
        {totalPages > 10 && (
          <span className="text-xs font-bold text-amber-700 ml-1">
            {currentPage + 1}/{totalPages}
          </span>
        )}
      </footer>
    </div>
  );
};
