import { ColoringPicture } from '../types';
import { loadColoringFills, saveColoringFills } from '../storage/persistence';
import { sound } from '../audio/soundEngine';
import { triggerHaptic } from '../platform/capabilities';

export interface ColoringHistoryStep {
  regionFills: Record<string, string>;
}

export class ColoringEngine {
  private picture: ColoringPicture;
  private regionFills: Record<string, string> = {};
  private history: ColoringHistoryStep[] = [];
  private onStateChange?: (regionFills: Record<string, string>, canUndo: boolean) => void;

  constructor(
    picture: ColoringPicture,
    onStateChange?: (regionFills: Record<string, string>, canUndo: boolean) => void
  ) {
    this.picture = picture;
    this.onStateChange = onStateChange;

    // Fresh coloring pages start UNCOLORED (white #FFFFFF) so baby colors it themselves!
    const initial: Record<string, string> = {};
    for (const region of picture.regions) {
      initial[region.id] = '#FFFFFF';
    }

    // Check saved state
    const savedFills = loadColoringFills(picture.id);
    if (savedFills) {
      this.regionFills = { ...initial, ...savedFills };
    } else {
      this.regionFills = initial;
    }

    this.history.push({ regionFills: { ...this.regionFills } });
  }

  public getRegionFills(): Record<string, string> {
    return this.regionFills;
  }

  public fillRegion(regionId: string, colorHex: string, freq?: number): boolean {
    const currentColor = this.regionFills[regionId];
    if (currentColor === colorHex) {
      // Re-trigger sound even if same color tapped for immediate audio feedback
      if (freq) sound.playColorNote(freq);
      else sound.playPop();
      triggerHaptic(15);
      return false;
    }

    this.regionFills = {
      ...this.regionFills,
      [regionId]: colorHex,
    };

    this.history.push({ regionFills: { ...this.regionFills } });
    if (this.history.length > 20) {
      this.history.shift();
    }

    if (freq) {
      sound.playColorNote(freq);
    } else {
      sound.playPop();
    }
    triggerHaptic(25);

    saveColoringFills(this.picture.id, this.regionFills);
    this.notify();
    return true;
  }

  public canUndo(): boolean {
    return this.history.length > 1;
  }

  public undo(): boolean {
    if (this.history.length <= 1) return false;
    this.history.pop();
    const prev = this.history[this.history.length - 1];
    if (prev) {
      this.regionFills = { ...prev.regionFills };
      saveColoringFills(this.picture.id, this.regionFills);
      sound.playWhoosh();
      triggerHaptic(20);
      this.notify();
      return true;
    }
    return false;
  }

  public resetToDefault() {
    const initial: Record<string, string> = {};
    for (const region of this.picture.regions) {
      initial[region.id] = '#FFFFFF';
    }
    this.regionFills = initial;
    this.history.push({ regionFills: { ...this.regionFills } });
    saveColoringFills(this.picture.id, this.regionFills);
    sound.playWhoosh();
    this.notify();
  }

  private notify() {
    if (this.onStateChange) {
      this.onStateChange(this.regionFills, this.canUndo());
    }
  }
}

