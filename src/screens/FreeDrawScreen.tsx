import React, { useState, useEffect, useRef } from 'react';
import { ToolType, ColorDef } from '../types';
import { DEFAULT_COLOR } from '../content/colors';
import { CanvasEngine } from '../drawing/canvasEngine';
import { TopBar } from '../components/TopBar';
import { ColorPalette } from '../components/ColorPalette';
import { ToolSelector } from '../components/ToolSelector';
import {
  saveDrawingBitmap,
  loadDrawingBitmap,
  clearFreeDrawState,
} from '../storage/persistence';

interface FreeDrawScreenProps {
  onHomeClick: () => void;
}

export const FreeDrawScreen: React.FC<FreeDrawScreenProps> = ({ onHomeClick }) => {
  const [selectedColor, setSelectedColor] = useState<ColorDef>(DEFAULT_COLOR);
  const [currentTool, setCurrentTool] = useState<ToolType>('brush');
  const [canUndo, setCanUndo] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasEngineRef = useRef<CanvasEngine | null>(null);

  // Check orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth >= 640);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const engine = new CanvasEngine(
      {
        canvas,
        onUndoStateChange: (undoAvailable) => setCanUndo(undoAvailable),
        onStrokeEnd: () => {
          if (canvasEngineRef.current) {
            saveDrawingBitmap('freedraw_canvas', canvasEngineRef.current.getDataUrl());
          }
        },
      },
      false // Solid white paper background
    );

    canvasEngineRef.current = engine;
    engine.setColor(selectedColor.hex);
    engine.setTool(currentTool);

    // Restore saved drawing if available from IndexedDB
    loadDrawingBitmap('freedraw_canvas').then((savedDataUrl) => {
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
  }, []);

  // Keep drawing engine color & tool synchronized
  useEffect(() => {
    if (canvasEngineRef.current) {
      canvasEngineRef.current.setColor(selectedColor.hex);
      canvasEngineRef.current.setTool(currentTool);
    }
  }, [selectedColor, currentTool]);

  const handleUndo = () => {
    if (canvasEngineRef.current) {
      const undone = canvasEngineRef.current.undo();
      if (undone) {
        saveDrawingBitmap('freedraw_canvas', canvasEngineRef.current.getDataUrl());
      }
    }
  };

  const handleReset = () => {
    if (canvasEngineRef.current) {
      canvasEngineRef.current.clear();
      clearFreeDrawState();
    }
  };

  return (
    <div className="w-full h-full min-h-[100dvh] max-h-[100dvh] flex flex-col bg-[#FFFDF9] overflow-hidden select-none">
      {/* Top Header */}
      <TopBar
        title="Blank Paper"
        onHomeClick={onHomeClick}
        canUndo={canUndo}
        onUndo={handleUndo}
        onReset={handleReset}
      />

      {/* Main Drawing Stage */}
      <div className="flex-1 w-full min-h-0 relative flex flex-col sm:flex-row items-center justify-center p-2 sm:p-4 gap-3">
        {/* Landscape Mode: Left Side Tools */}
        {isLandscape && (
          <div className="shrink-0 flex flex-col items-center justify-center z-20">
            <ToolSelector
              currentTool={currentTool}
              onSelectTool={setCurrentTool}
              orientation="vertical"
              includeFill={false}
            />
          </div>
        )}

        {/* The White Drawing Canvas */}
        <div className="relative flex-1 w-full h-full max-w-full max-h-full flex items-center justify-center">
          <div className="relative w-full h-full max-w-[min(94vw,900px)] max-h-[min(68vh,900px)] sm:max-h-[min(82vh,900px)] rounded-3xl bg-white shadow-md border-4 border-amber-200/90 overflow-hidden paper-canvas drawing-surface">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair touch-none"
            />
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
              includeFill={false}
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
