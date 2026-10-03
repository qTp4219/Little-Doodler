export type ToolType = 'fill' | 'brush' | 'sparkle' | 'eraser';

export interface ColorDef {
  id: string;
  name: string;
  hex: string;
  frequency: number; // Musical note for xylophone effect (Hz)
  textColor?: string;
}

export interface ColoringRegion {
  id: string;
  name: string;
  path: string; // SVG path d string
  suggestedColor?: string; // Color guide suggestion (e.g. puppy body color)
  defaultColor?: string; // Optional starting color (defaults to white uncolored if omitted)
}

export interface ColoringOutline {
  path: string;
  strokeWidth?: number;
  fill?: string;
}

export interface ColoringPicture {
  id: string;
  title: string;
  category: 'animals' | 'nature' | 'vehicles' | 'fantasy';
  viewBox: string; // e.g. "0 0 500 500"
  regions: ColoringRegion[];
  outlines: ColoringOutline[]; // Permanent foreground outlines
  accentColor: string; // Used for card borders / joyful UI themes
}

export interface ColoringState {
  pictureId: string;
  regionFills: Record<string, string>; // regionId -> hex color
  drawingDataUrl?: string; // Optional freehand strokes drawn on top of the picture
  updatedAt: number;
}

export interface FreeDrawState {
  dataUrl: string;
  updatedAt: number;
}
