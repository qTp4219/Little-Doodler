import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ColoringPicture, ToolType, ColorDef } from '../types';
import { DEFAULT_COLOR } from '../content/colors';
import { ColoringEngine } from '../coloring/coloringEngine';
import { CanvasEngine } from '../drawing/canvasEngine';
import { TopBar } from '../components/TopBar';
import { ColorPalette } from '../components/ColorPalette';
import { ToolSelector } from '../components/ToolSelector';
import { SuggestedColorGuide } from '../components/SuggestedColorGuide';
import {
  saveColoringFills,
  saveDrawingBitmap,
  loadDrawingBitmap,
  clearColoringState,
} from '../storage/persistence';

interface ColoringScreenProps {
  picture: ColoringPicture;
  onHomeClick: () => void;
}

export const ColoringScreen: React.FC<ColoringScreenProps> = ({
  picture,
  onHomeClick,
}) => {
  const [selectedColor, setSelectedColor] = useState<ColorDef>(DEFAULT_COLOR);
  const [currentTool, setCurrentTool] = useState<ToolType>('fill');
  const [regionFills, setRegionFills] = useState<Record<string, string>>({});
  const [canUndoFill, setCanUndoFill] = useState(false);
  const [canUndoCanvas, setCanUndoCanvas] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  // Chronological unified action history: records 'fill' or 'canvas' in order of occurrence
  const actionHistoryRef = useRef<Array<'fill' | 'canvas'>>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const coloringEngineRef = useRef<ColoringEngine | null>(null);
  const canvasEngineRef = useRef<CanvasEngine | null>(null);
  const [tapBursts, setTapBursts] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

  // Check orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth >= 640);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Initialize Coloring Engine
  useEffect(() => {
    actionHistoryRef.current = [];
    const engine = new ColoringEngine(picture, (fills, canUndo) => {
      setRegionFills(fills);
      setCanUndoFill(canUndo);
    });
    coloringEngineRef.current = engine;
    setRegionFills(engine.getRegionFills());
    setCanUndoFill(engine.canUndo());
  }, [picture]);

  // Initialize Canvas Drawing Engine overlay
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new CanvasEngine(
      {
        canvas,
        onUndoStateChange: (canUndo) => setCanUndoCanvas(canUndo),
        onStrokeEnd: () => {
          actionHistoryRef.current.push('canvas');
          if (canvasEngineRef.current) {
            const dataUrl = canvasEngineRef.current.getDataUrl();
            saveDrawingBitmap(`pic_drawing_${picture.id}`, dataUrl);
          }
        },
      },
      true // transparent overlay over coloring page
    );

    canvasEngineRef.current = engine;
    engine.setColor(selectedColor.hex);
    engine.setTool(currentTool);

    // Restore saved drawing strokes asynchronously from IndexedDB
    loadDrawingBitmap(`pic_drawing_${picture.id}`).then((savedDataUrl) => {
      if (savedDataUrl && canvasEngineRef.current) {
        canvasEngineRef.current.loadFromDataUrl(savedDataUrl);
      }
    });

    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
    };
  }, [picture]);

  // Keep drawing engine color & tool synchronized
  useEffect(() => {
    if (canvasEngineRef.current) {
      canvasEngineRef.current.setColor(selectedColor.hex);
      canvasEngineRef.current.setTool(currentTool);
    }
  }, [selectedColor, currentTool]);

  // Handle region tap (fill mode)
  const handleRegionTap = useCallback(
    (regionId: string, clientX?: number, clientY?: number) => {
      if (currentTool !== 'fill') return;
      if (coloringEngineRef.current) {
        const changed = coloringEngineRef.current.fillRegion(
          regionId,
          selectedColor.hex,
          selectedColor.frequency
        );

        if (changed) {
          actionHistoryRef.current.push('fill');
          saveColoringFills(picture.id, coloringEngineRef.current.getRegionFills());
        }

        if (clientX !== undefined && clientY !== undefined) {
          const burstId = Date.now() + Math.random();
          setTapBursts((prev) => [
            ...prev.slice(-3), // keep maximum 4 active
            { id: burstId, x: clientX, y: clientY, color: selectedColor.hex },
          ]);
          setTimeout(() => {
            setTapBursts((prev) => prev.filter((b) => b.id !== burstId));
          }, 450);
        }
      }
    },
    [currentTool, selectedColor, picture.id]
  );

  // Chronologically accurate Undo
  const handleUndo = () => {
    while (actionHistoryRef.current.length > 0) {
      const lastAction = actionHistoryRef.current.pop();
      if (lastAction === 'canvas' && canUndoCanvas && canvasEngineRef.current) {
        const undone = canvasEngineRef.current.undo();
        if (undone) {
          saveDrawingBitmap(`pic_drawing_${picture.id}`, canvasEngineRef.current.getDataUrl());
          return;
        }
      } else if (lastAction === 'fill' && canUndoFill && coloringEngineRef.current) {
        const undone = coloringEngineRef.current.undo();
        if (undone) {
          saveColoringFills(picture.id, coloringEngineRef.current.getRegionFills());
          return;
        }
      }
    }

    // Fallbacks if history stack was empty
    if (canUndoCanvas && canvasEngineRef.current) {
      canvasEngineRef.current.undo();
      saveDrawingBitmap(`pic_drawing_${picture.id}`, canvasEngineRef.current.getDataUrl());
    } else if (canUndoFill && coloringEngineRef.current) {
      coloringEngineRef.current.undo();
      saveColoringFills(picture.id, coloringEngineRef.current.getRegionFills());
    }
  };

  // Reset / Clear both fills and drawing
  const handleReset = () => {
    actionHistoryRef.current = [];
    if (coloringEngineRef.current) {
      coloringEngineRef.current.resetToDefault();
    }
    if (canvasEngineRef.current) {
      canvasEngineRef.current.clear();
    }
    clearColoringState(picture.id);
  };

  const canUndo = canUndoCanvas || canUndoFill;

  return (
    <div className="w-full h-full min-h-[100dvh] max-h-[100dvh] flex flex-col bg-[#FFFDF9] overflow-hidden select-none">
      {/* Top Header */}
      <TopBar
        title={picture.title}
        onHomeClick={onHomeClick}
        canUndo={canUndo}
        onUndo={handleUndo}
        onReset={handleReset}
      />

      {/* Main Interactive Stage */}
      <div className="flex-1 w-full min-h-0 relative flex flex-col sm:flex-row items-center justify-center p-1.5 sm:p-3 gap-2 sm:gap-3">
        {/* Landscape Mode: Left Side Tools */}
        {isLandscape && (
          <div className="shrink-0 flex flex-col items-center justify-center z-20">
            <ToolSelector
              currentTool={currentTool}
              onSelectTool={setCurrentTool}
              orientation="vertical"
              includeFill={true}
            />
          </div>
        )}

        {/* The Coloring Artwork Area */}
        <div className="relative flex-1 w-full h-full max-w-full max-h-full flex items-center justify-center">
          <div className="relative w-full h-full max-w-[min(90vw,780px)] max-h-[min(65vh,780px)] sm:max-h-[min(82vh,780px)] aspect-square rounded-3xl bg-white shadow-md border-4 border-amber-200/90 overflow-hidden drawing-surface">
            {/* Mini Suggested Picture Guide Thumbnail inside canvas corner - never covers color board */}
            <div className={`absolute ${isLandscape ? 'top-2 left-2' : 'top-2 right-2'} z-25`}>
              <SuggestedColorGuide picture={picture} />
            </div>

            {/* SVG Base: Background & Filled Regions */}
            <svg
              viewBox={picture.viewBox}
              className="absolute inset-0 w-full h-full"
            >
              {picture.regions.map((region) => {
                const fill = regionFills[region.id] || '#FFFFFF';
                return (
                  <path
                    key={region.id}
                    d={region.path}
                    fill={fill}
                    stroke="#1E293B"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={
                      currentTool === 'fill'
                        ? 'cursor-pointer transition-colors duration-150 active:opacity-85'
                        : ''
                    }
                    onPointerDown={(e) => {
                      if (currentTool === 'fill') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRegionTap(region.id, e.clientX, e.clientY);
                      }
                    }}
                  />
                );
              })}
            </svg>

            {/* Canvas Overlay for Crayon, Sparkles, and Eraser */}
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full z-10 ${
                currentTool === 'fill' ? 'pointer-events-none' : 'pointer-events-auto cursor-crosshair'
              }`}
            />

            {/* Tap Bursts Animation Overlay */}
            {tapBursts.map((burst) => (
              <div
                key={burst.id}
                className="fixed pop-burst-anim z-50 flex items-center justify-center pointer-events-none"
                style={{
                  left: burst.x,
                  top: burst.y,
                }}
              >
                <div
                  className="w-14 h-14 rounded-full border-4"
                  style={{ borderColor: burst.color }}
                />
              </div>
            ))}

            {/* SVG Outlines Overlay: Keeps thick black character outlines crisp over scribbles */}
            <svg
              viewBox={picture.viewBox}
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
            >
              {picture.outlines.map((outline, idx) => (
                <path
                  key={`out_${idx}`}
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
        </div>

        {/* Landscape Mode: Right Side Colors */}
        {isLandscape && (
          <div className="shrink-0 flex flex-col items-center justify-center z-20">
            <ColorPalette
              selectedColorHex={selectedColor.hex}
              onSelectColor={setSelectedColor}
              orientation="vertical"
            />
          </div>
        )}
      </div>

      {/* Portrait Mode: Bottom Controls */}
      {!isLandscape && (
        <footer className="w-full shrink-0 flex flex-col items-center justify-center gap-2 p-2 pb-safe bg-gradient-to-t from-amber-50/90 to-transparent z-20">
          <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-full">
            <ToolSelector
              currentTool={currentTool}
              onSelectTool={setCurrentTool}
              orientation="horizontal"
              includeFill={true}
            />
          </div>
          <div className="w-full flex items-center justify-center overflow-x-auto pb-1">
            <ColorPalette
              selectedColorHex={selectedColor.hex}
              onSelectColor={setSelectedColor}
              orientation="horizontal"
            />
          </div>
        </footer>
      )}
    </div>
  );
};
