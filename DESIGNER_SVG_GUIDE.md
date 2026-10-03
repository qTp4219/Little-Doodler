# Developer & Design Team SVG Guide

## 📁 Which Folder Do SVGs Go In?

All coloring SVG files are placed in:
```
src/assets/pictures/
├── animals/     (e.g., happy-puppy.svg, cute-kitty.svg, baby-bunny.svg)
├── vehicles/    (e.g., fire-truck.svg, beep-car.svg, space-rocket.svg)
├── nature/      (e.g., sunny-rainbow.svg, juicy-apple.svg, flower-garden.svg)
└── fantasy/     (e.g., fairytale-castle.svg, twinkle-star.svg, gift-box.svg)
```

---

## ⚡ How It Works (Zero Code Needed!)

1. **Design Team:** Creates or exports a standard `.svg` file from Figma, Adobe Illustrator, or Inkscape.
2. **Dev Team:** Drops the `.svg` file into the target folder (e.g., `src/assets/pictures/animals/panda.svg`).
3. **App Reload:** Vite automatically detects the new SVG via `import.meta.glob`.
4. **Instant Coloring:** The app's engine parses the SVG's paths, extracts colorable regions, preserves crisp foreground outlines, and adds the picture to the carousel immediately!

---

## 🎨 Best Practices for the Design Team

### 1. Canvas & ViewBox
* Artboard size: Recommended **500 × 500 px** (or any square ratio like 600×600).
* Ensure root tag has: `viewBox="0 0 500 500"`.

### 2. Colorable Regions (Shapes to Fill)
* Every section the toddler colors (head, ears, body, wheels, leaves) must be a **closed vector shape** (`<path>`, `<rect>`, `<circle>`, `<polygon>`) with a `fill` attribute.
* The original `fill` color in the designer's file is automatically used as the **Suggested Color** for the card thumbnail and preview guide!
* Optional: Add a `name="Left Ear"` attribute or layer name in Figma/Illustrator for accessibility.

### 3. Foreground Outlines & Details
* Put bold black/dark line art, smiles, whiskers, or small detail dots inside a group with `id="outlines"`:
  ```xml
  <g id="outlines">
    <path stroke="#1E293B" stroke-width="7" fill="none" d="..." />
  </g>
  ```
* These stay crisp on top of toddler crayon strokes.

### 4. Optional Metadata on the `<svg>` Tag
You can optionally include title and category right on the `<svg>` element:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" data-title="Happy Panda" data-category="animals" data-accent="#10B981">
```
*(If omitted, the title is automatically generated from the filename, e.g. `happy-panda.svg` -> `"Happy Panda"`).*

---

## 🧩 Structure of Existing SVGs
All existing illustrations have been exported as standard `.svg` files inside `src/assets/pictures/`. You can open any of them in Illustrator or Figma as reference templates!
