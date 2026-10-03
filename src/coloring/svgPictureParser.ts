import { ColoringPicture, ColoringRegion, ColoringOutline } from '../types';

/**
 * Options for converting an SVG into a ColoringPicture
 */
export interface SvgParseOptions {
  id?: string;
  title?: string;
  category?: 'animals' | 'vehicles' | 'nature' | 'fantasy';
  accentColor?: string;
}

/**
 * Convert a rect to SVG path d
 */
function rectToPath(x: number, y: number, w: number, h: number, rx = 0, ry = 0): string {
  if (rx === 0 && ry === 0) {
    return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
  }
  const r = Math.min(rx || ry, ry || rx, w / 2, h / 2);
  return `M ${x + r} ${y} L ${x + w - r} ${y} A ${r} ${r} 0 0 1 ${x + w} ${y + r} L ${x + w} ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} L ${x + r} ${y + h} A ${r} ${r} 0 0 1 ${x} ${y + h - r} L ${x} ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;
}

/**
 * Convert a circle to SVG path d
 */
function circleToPath(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
}

/**
 * Convert an ellipse to SVG path d
 */
function ellipseToPath(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
}

/**
 * Convert polygon / polyline points to SVG path d
 */
function pointsToPath(pointsStr: string, isClosed: boolean): string {
  const points = pointsStr
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  if (points.length < 4) return '';
  let d = `M ${points[0]} ${points[1]}`;
  for (let i = 2; i < points.length; i += 2) {
    d += ` L ${points[i]} ${points[i + 1]}`;
  }
  if (isClosed) d += ' Z';
  return d;
}

/**
 * Clean and humanize an element ID (e.g. "ear_left" -> "Ear Left")
 */
function humanizeId(id: string): string {
  return id
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

/**
 * Parse an SVG string directly into a ColoringPicture.
 * 
 * Works with SVGs exported from Figma, Adobe Illustrator, Inkscape, or online sources!
 * Automatically:
 * - Detects viewBox (or calculates from width/height)
 * - Identifies colorable regions (shapes with fills)
 * - Extracts original colors as suggestedColor (for thumbnail & coloring guide)
 * - Identifies permanent foreground outlines (strokes or dark line art)
 */
export function parseSvgToPicture(svgContent: string, options: SvgParseOptions = {}): ColoringPicture {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');

  if (!svgEl) {
    throw new Error('Invalid SVG: No <svg> root element found.');
  }

  // 1. Determine viewBox
  let viewBox = svgEl.getAttribute('viewBox');
  if (!viewBox) {
    const width = parseFloat(svgEl.getAttribute('width') || '500');
    const height = parseFloat(svgEl.getAttribute('height') || '500');
    viewBox = `0 0 ${width} ${height}`;
  }

  const regions: ColoringRegion[] = [];
  const outlines: ColoringOutline[] = [];
  let regionCounter = 1;

  // Check if SVG has explicit outline groups (e.g. <g id="outlines"> or <g class="outline">)
  const outlineGroup = svgEl.querySelector('#outlines, [id*="outline"], .outlines, [data-type="outline"]');

  // Traverse all elements in the SVG
  const allElements = Array.from(svgEl.querySelectorAll('path, rect, circle, ellipse, polygon, polyline'));

  for (const el of allElements) {
    // Extract geometry path d
    let d = '';
    const tagName = el.tagName.toLowerCase();

    if (tagName === 'path') {
      d = el.getAttribute('d') || '';
    } else if (tagName === 'rect') {
      const x = parseFloat(el.getAttribute('x') || '0');
      const y = parseFloat(el.getAttribute('y') || '0');
      const w = parseFloat(el.getAttribute('width') || '0');
      const h = parseFloat(el.getAttribute('height') || '0');
      const rx = parseFloat(el.getAttribute('rx') || '0');
      const ry = parseFloat(el.getAttribute('ry') || '0');
      d = rectToPath(x, y, w, h, rx, ry);
    } else if (tagName === 'circle') {
      const cx = parseFloat(el.getAttribute('cx') || '0');
      const cy = parseFloat(el.getAttribute('cy') || '0');
      const r = parseFloat(el.getAttribute('r') || '0');
      d = circleToPath(cx, cy, r);
    } else if (tagName === 'ellipse') {
      const cx = parseFloat(el.getAttribute('cx') || '0');
      const cy = parseFloat(el.getAttribute('cy') || '0');
      const rx = parseFloat(el.getAttribute('rx') || '0');
      const ry = parseFloat(el.getAttribute('ry') || '0');
      d = ellipseToPath(cx, cy, rx, ry);
    } else if (tagName === 'polygon') {
      d = pointsToPath(el.getAttribute('points') || '', true);
    } else if (tagName === 'polyline') {
      d = pointsToPath(el.getAttribute('points') || '', false);
    }

    if (!d || d.trim().length === 0) continue;

    // Check style/attributes
    const fill = (el.getAttribute('fill') || '').trim();
    const stroke = (el.getAttribute('stroke') || '').trim();
    const strokeWidthAttr = el.getAttribute('stroke-width');
    const strokeWidth = strokeWidthAttr ? parseFloat(strokeWidthAttr) : (stroke && stroke !== 'none' ? 4 : 0);
    const id = el.getAttribute('id') || '';
    const isInsideOutlineGroup = outlineGroup && outlineGroup.contains(el);

    // Is this an outline/detail line?
    const isPureStroke = (fill === 'none' || fill === 'transparent') && stroke && stroke !== 'none';
    const isOutlineId = /outline|stroke|line|detail|pupil|eye_dot|mouth_line/i.test(id);
    const isDarkFillDetail = fill === '#000000' || fill === '#1E293B' || fill === '#111827' || fill === 'black';

    if (isInsideOutlineGroup || isPureStroke || (isOutlineId && isDarkFillDetail)) {
      outlines.push({
        path: d,
        strokeWidth: strokeWidth > 0 ? strokeWidth : (isPureStroke ? 6 : undefined),
        fill: isDarkFillDetail ? fill : undefined,
      });
    } else {
      // It's a colorable region!
      const regionId = id ? id.replace(/\s+/g, '_').toLowerCase() : `region_${regionCounter}`;
      const name = el.getAttribute('name') || (id ? humanizeId(id) : `Region ${regionCounter}`);
      regionCounter++;

      // Suggested color extracted from the designer's original fill
      let suggestedColor: string | undefined = undefined;
      if (fill && fill !== 'none' && fill !== 'transparent') {
        suggestedColor = fill;
      }

      regions.push({
        id: regionId,
        name,
        path: d,
        suggestedColor,
      });

      // If the region also has a bold border, add it to outlines so line art is preserved on top
      if (stroke && stroke !== 'none' && strokeWidth > 0) {
        outlines.push({
          path: d,
          strokeWidth: Math.min(strokeWidth, 8),
        });
      }
    }
  }

  // Fallback defaults if options not passed
  const title =
    options.title ||
    svgEl.getAttribute('data-title') ||
    svgEl.querySelector('title')?.textContent?.trim() ||
    svgEl.getAttribute('title') ||
    'My Coloring Picture';
  const id = options.id || `pic-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const category = (options.category ||
    svgEl.getAttribute('data-category') ||
    'fantasy') as 'animals' | 'vehicles' | 'nature' | 'fantasy';
  const accentColor =
    options.accentColor ||
    svgEl.getAttribute('data-accent') ||
    regions[0]?.suggestedColor ||
    '#F59E0B';

  return {
    id,
    title,
    category,
    viewBox,
    regions,
    outlines,
    accentColor,
  };
}

/**
 * Helper to validate an SVG string for coloring readiness
 */
export function validateSvgForColoring(svgContent: string): {
  isValid: boolean;
  regionCount: number;
  outlineCount: number;
  error?: string;
} {
  try {
    const pic = parseSvgToPicture(svgContent);
    if (pic.regions.length === 0) {
      return {
        isValid: false,
        regionCount: 0,
        outlineCount: pic.outlines.length,
        error: 'No colorable regions found. Ensure shapes have closed paths or fills.',
      };
    }
    return {
      isValid: true,
      regionCount: pic.regions.length,
      outlineCount: pic.outlines.length,
    };
  } catch (err: unknown) {
    return {
      isValid: false,
      regionCount: 0,
      outlineCount: 0,
      error: err instanceof Error ? err.message : 'Unknown SVG parsing error',
    };
  }
}

/**
 * Generates clean, ready-to-paste TypeScript code for src/content/pictures.ts
 */
export function exportPictureToTypeScript(picture: ColoringPicture): string {
  return `  {
    id: '${picture.id}',
    title: '${picture.title}',
    category: '${picture.category}',
    accentColor: '${picture.accentColor}',
    viewBox: '${picture.viewBox}',
    regions: [
${picture.regions
  .map(
    (r) =>
      `      { id: '${r.id}', name: '${r.name}', path: '${r.path}'${
        r.suggestedColor ? `, suggestedColor: '${r.suggestedColor}'` : ''
      } },`
  )
  .join('\n')}
    ],
    outlines: [
${picture.outlines
  .map(
    (o) =>
      `      { path: '${o.path}'${o.strokeWidth ? `, strokeWidth: ${o.strokeWidth}` : ''}${
        o.fill ? `, fill: '${o.fill}'` : ''
      } },`
  )
  .join('\n')}
    ],
  },`;
}

/**
 * Drop-in wrapper so a developer can simply do:
 * export const myPicture = createPictureFromSvg({ id: 'boat', title: 'Sailboat', category: 'vehicles', svg: '...' });
 */
export function createPictureFromSvg(params: {
  id: string;
  title: string;
  category: 'animals' | 'vehicles' | 'nature' | 'fantasy';
  accentColor?: string;
  svg: string;
}): ColoringPicture {
  return parseSvgToPicture(params.svg, {
    id: params.id,
    title: params.title,
    category: params.category,
    accentColor: params.accentColor,
  });
}
