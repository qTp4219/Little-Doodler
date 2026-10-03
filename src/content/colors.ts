import { ColorDef } from '../types';

export const TODDLER_COLORS: ColorDef[] = [
  {
    id: 'red',
    name: 'Red',
    hex: '#EF4444',
    frequency: 261.63, // C4
    textColor: '#FFFFFF',
  },
  {
    id: 'orange',
    name: 'Orange',
    hex: '#F97316',
    frequency: 293.66, // D4
    textColor: '#FFFFFF',
  },
  {
    id: 'yellow',
    name: 'Yellow',
    hex: '#FACC15',
    frequency: 329.63, // E4
    textColor: '#78350F',
  },
  {
    id: 'green',
    name: 'Green',
    hex: '#22C55E',
    frequency: 392.00, // G4
    textColor: '#FFFFFF',
  },
  {
    id: 'sky',
    name: 'Sky Blue',
    hex: '#38BDF8',
    frequency: 440.00, // A4
    textColor: '#082F49',
  },
  {
    id: 'blue',
    name: 'Deep Blue',
    hex: '#3B82F6',
    frequency: 523.25, // C5
    textColor: '#FFFFFF',
  },
  {
    id: 'purple',
    name: 'Purple',
    hex: '#A855F7',
    frequency: 587.33, // D5
    textColor: '#FFFFFF',
  },
  {
    id: 'pink',
    name: 'Pink',
    hex: '#EC4899',
    frequency: 659.25, // E5
    textColor: '#FFFFFF',
  },
  {
    id: 'brown',
    name: 'Brown',
    hex: '#92400E',
    frequency: 783.99, // G5
    textColor: '#FFFFFF',
  },
  {
    id: 'black',
    name: 'Black',
    hex: '#1E293B',
    frequency: 880.00, // A5
    textColor: '#FFFFFF',
  },
];

export const DEFAULT_COLOR = TODDLER_COLORS[0]; // Red
