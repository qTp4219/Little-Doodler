import { ToolType } from '../types';
import { sound } from '../audio/soundEngine';

export interface CanvasEngineOptions {
  canvas: HTMLCanvasElement;
  onUndoStateChange?: (canUndo: boolean) => void;
  onStrokeEnd?: () => void;
}

interface Point {
  x: number;
  y: number;
}

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isDrawing = false;
  private currentTool: ToolType = 'brush';
  private currentColor: string = '#EF4444';
  private strokeColorIndex = 0;
  private points: Point[] = [];
  // Use compact offscreen canvas snapshots instead of huge raw ImageData buffers
  private undoStack: HTMLCanvasElement[] = [];
  private maxUndo = 10;
  private dpr = 1;
  private onUndoStateChange?: (canUndo: boolean) => void;
  private onStrokeEnd?: () => void;
  private isClearCanvasTransparent = true;
  private resizeObserver?: ResizeObserver;
  private hasDrawnStroke = false;

  constructor(options: CanvasEngineOptions, isTransparent = true) {
    this.canvas = options.canvas;
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Could not get 2D canvas context');
    this.ctx = ctx;
    this.onUndoStateChange = options.onUndoStateChange;
    this.onStrokeEnd = options.onStrokeEnd;
    this.isClearCanvasTransparent = isTransparent;

    this.setupDpi();
    if (!this.isClearCanvasTransparent) {
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
    }

    this.bindEvents();
    // Save initial pristine state
    this.saveSnapshotInternal(false);

    // Responsive auto-fit observer with debouncing
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.resize();
      });
      this.resizeObserver.observe(this.canvas);
    }
  }

  public setTool(tool: ToolType) {
    this.currentTool = tool;
  }

  public setColor(hex: string) {
    this.currentColor = hex;
  }

  public getCanUndo(): boolean {
    return this.hasDrawnStroke && this.undoStack.length > 1;
  }

  private setupDpi() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(rect.width, 240);
    const height = Math.max(rect.height, 240);

    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);

    this.ctx.scale(this.dpr, this.dpr);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  public resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const targetWidth = Math.floor(rect.width * this.dpr);
    const targetHeight = Math.floor(rect.height * this.dpr);

    // Avoid redundant re-allocations if dimension hasn't changed
    if (this.canvas.width === targetWidth && this.canvas.height === targetHeight) {
      return;
    }

    // Preserve current content onto temporary buffer
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(this.canvas, 0, 0);
    }

    this.canvas.width = targetWidth;
    this.canvas.height = targetHeight;

    this.ctx.scale(this.dpr, this.dpr);
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (!this.isClearCanvasTransparent) {
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(0, 0, rect.width, rect.height);
    }

    if (tempCtx && tempCanvas.width > 0 && tempCanvas.height > 0) {
      this.ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
    }
  }

  private getCanvasPoint(e: PointerEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = this.canvas.width / this.dpr;
    const cssHeight = this.canvas.height / this.dpr;
    const scaleX = rect.width > 0 ? cssWidth / rect.width : 1;
    const scaleY = rect.height > 0 ? cssHeight / rect.height : 1;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  private bindEvents() {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);
    window.addEventListener('pointerup', this.handleWindowPointerUp);
    window.addEventListener('blur', this.handleBlur);
  }

  public destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
    window.removeEventListener('pointerup', this.handleWindowPointerUp);
    window.removeEventListener('blur', this.handleBlur);
  }

  private handleBlur = () => {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.points = [];
    }
  };

  private handleWindowPointerUp = (e: PointerEvent) => {
    if (this.isDrawing) {
      this.handlePointerUp(e);
    }
  };

  private handlePointerDown = (e: PointerEvent) => {
    if (this.currentTool === 'fill') return;

    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    this.isDrawing = true;
    const pt = this.getCanvasPoint(e);
    this.points = [pt, pt];

    this.configureContext();

    if (this.currentTool === 'sparkle') {
      this.drawSparkle(pt.x, pt.y);
      sound.playSparkle();
    } else {
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, this.getBrushRadius(), 0, Math.PI * 2);
      this.ctx.fill();
    }
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isDrawing || this.currentTool === 'fill') return;

    const pt = this.getCanvasPoint(e);
    this.points.push(pt);

    if (this.currentTool === 'sparkle') {
      const prev = this.points[this.points.length - 2];
      const dist = Math.hypot(pt.x - prev.x, pt.y - prev.y);
      if (dist >= 28) {
        this.drawSparkle(pt.x, pt.y);
      }
      return;
    }

    this.configureContext();

    const len = this.points.length;
    const p1 = this.points[len - 2];
    const p2 = this.points[len - 1];
    const midPoint = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };

    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
    this.ctx.stroke();
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.points = [];

    try {
      if (this.canvas.hasPointerCapture(e.pointerId)) {
        this.canvas.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }

    this.hasDrawnStroke = true;
    this.saveSnapshotInternal(true);

    if (this.onStrokeEnd) {
      this.onStrokeEnd();
    }
  };

  private getBrushRadius(): number {
    const isMobile = window.innerWidth < 640;
    if (this.currentTool === 'eraser') {
      return isMobile ? 18 : 24;
    }
    return isMobile ? 9 : 13;
  }

  private configureContext() {
    const radius = this.getBrushRadius();
    this.ctx.lineWidth = radius * 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (this.currentTool === 'eraser') {
      if (this.isClearCanvasTransparent) {
        this.ctx.globalCompositeOperation = 'destination-out';
      } else {
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.fillStyle = '#FFFFFF';
      }
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = this.currentColor;
      this.ctx.fillStyle = this.currentColor;
    }
  }

  private drawSparkle(x: number, y: number) {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'source-over';

    const colors = ['#FACC15', '#F472B6', '#38BDF8', '#C084FC', '#4ADE80', '#FB923C'];
    const color = colors[(this.strokeColorIndex++) % colors.length];
    const size = 14 + Math.random() * 8;
    const angle = Math.random() * Math.PI;

    this.ctx.translate(x, y);
    this.ctx.rotate(angle);
    this.ctx.fillStyle = color;

    this.ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      this.ctx.rotate(Math.PI / 2);
      this.ctx.lineTo(size, 0);
      this.ctx.lineTo(size * 0.3, size * 0.3);
    }
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  private saveSnapshotInternal(triggerNotify = true) {
    try {
      // Create a compact offscreen snapshot
      const snapshot = document.createElement('canvas');
      snapshot.width = this.canvas.width;
      snapshot.height = this.canvas.height;
      const sCtx = snapshot.getContext('2d');
      if (sCtx) {
        sCtx.drawImage(this.canvas, 0, 0);
        this.undoStack.push(snapshot);
        if (this.undoStack.length > this.maxUndo) {
          this.undoStack.shift();
        }
      }
      if (triggerNotify) {
        this.notifyUndo();
      }
    } catch {
      // Ignore
    }
  }

  public saveSnapshot() {
    this.hasDrawnStroke = true;
    this.saveSnapshotInternal(true);
  }

  public undo(): boolean {
    if (this.undoStack.length <= 1) {
      this.hasDrawnStroke = false;
      this.notifyUndo();
      return false;
    }

    this.undoStack.pop();
    const previous = this.undoStack[this.undoStack.length - 1];

    if (previous) {
      const cssWidth = this.canvas.width / this.dpr;
      const cssHeight = this.canvas.height / this.dpr;

      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (this.isClearCanvasTransparent) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      } else {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
      this.ctx.drawImage(previous, 0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();

      if (this.undoStack.length <= 1) {
        this.hasDrawnStroke = false;
      }

      this.notifyUndo();
      sound.playWhoosh();
      return true;
    }
    return false;
  }

  public clear() {
    const cssWidth = this.canvas.width / this.dpr;
    const cssHeight = this.canvas.height / this.dpr;

    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (this.isClearCanvasTransparent) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.ctx.restore();

    this.undoStack = [];
    this.hasDrawnStroke = false;
    this.saveSnapshotInternal(false);
    this.notifyUndo();
    sound.playWhoosh();
  }

  public getDataUrl(): string {
    return this.canvas.toDataURL('image/png');
  }

  public loadFromDataUrl(dataUrl: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (this.isClearCanvasTransparent) {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
          this.ctx.fillStyle = '#FFFFFF';
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        this.hasDrawnStroke = true;
        this.saveSnapshotInternal(true);
        resolve();
      };
      img.onerror = () => resolve();
      img.src = dataUrl;
    });
  }

  private notifyUndo() {
    if (this.onUndoStateChange) {
      this.onUndoStateChange(this.getCanUndo());
    }
  }
}
