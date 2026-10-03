import { ColoringPicture } from '../types';
import { parseSvgToPicture } from '../coloring/svgPictureParser';

/**
 * Automatically loads every SVG file placed inside `src/assets/pictures/`!
 * 
 * Folder Structure:
 *   src/assets/pictures/animals/*.svg
 *   src/assets/pictures/vehicles/*.svg
 *   src/assets/pictures/nature/*.svg
 *   src/assets/pictures/fantasy/*.svg
 * 
 * To add a new picture:
 * The design team simply exports an .svg file and developers drop it into
 * the appropriate subfolder in `src/assets/pictures/`.
 * On reload, Vite eagerly loads and parses it into the coloring catalog!
 */
const svgModules = import.meta.glob<string>('../assets/pictures/**/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function loadAllSvgPictures(): ColoringPicture[] {
  const list: ColoringPicture[] = [];

  for (const [filePath, svgText] of Object.entries(svgModules)) {
    try {
      // Example filePath: "../assets/pictures/animals/happy-puppy.svg"
      const match = filePath.match(/\/pictures\/(?:([^/]+)\/)?([^/]+)\.svg$/);
      const subfolder = match && match[1] ? match[1] : undefined;
      const fileId = match && match[2] ? match[2] : filePath.replace(/.*\/([^/]+)\.svg$/, '$1');

      const category = (subfolder && ['animals', 'vehicles', 'nature', 'fantasy'].includes(subfolder)
        ? subfolder
        : undefined) as 'animals' | 'vehicles' | 'nature' | 'fantasy' | undefined;

      const picture = parseSvgToPicture(svgText, {
        id: fileId,
        category,
      });

      list.push(picture);
    } catch (err) {
      console.warn(`Could not parse SVG picture from ${filePath}:`, err);
    }
  }

  return list;
}

export const COLORING_PICTURES: ColoringPicture[] = loadAllSvgPictures();

// Helper to get randomized copy of coloring pictures
export function getShuffledPictures(list: ColoringPicture[] = COLORING_PICTURES): ColoringPicture[] {
  const array = [...list];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
