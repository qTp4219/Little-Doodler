# 🎨 Little Doodler

A delightful digital coloring book and drawing toy designed specifically for toddlers aged 1–4. Features large touch targets, cheerful musical xylophone audio, crisp foreground character outlines, and zero frustrating menus or text prompts.

---

## ✨ Features

- **Toddler-First UX:** Oversized buttons, generous spacing, immediate audio feedback, no complex settings.
- **70+ Illustrations:** Animals, Vehicles, Nature, and Fun & Magic illustrations.
- **SVG-Driven Architecture:** New coloring pages are simply standard `.svg` vector files placed inside `src/assets/pictures/`. No TypeScript coding required!
- **Tap-to-Fill & Freehand Drawing:** Instant color fills plus rainbow crayon scribbles, sparkle trails, and undo.
- **Responsive Layout:** Optimized for phone portrait, phone landscape, tablets, and desktop.
- **Offline / Local Persistence:** Drawings and color states are saved in the browser's storage.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** 18 or newer
- **npm** (comes with Node.js)

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Locally (Development)
```bash
npm run dev
```
Open your browser at `http://localhost:3000` (or the URL shown in your terminal).

### 4. Build for Production
```bash
npm run build
```
This generates the optimized static files in the `dist/` directory.

To preview the production build locally:
```bash
npm run preview
```

---

## 🌐 Deploying to GitHub Pages (Automatic)

This project is pre-configured with a GitHub Actions workflow (`.github/workflows/deploy.yml`) for automatic deployment.

### Step-by-Step Setup:

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Little Doodler"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   * Go to your repository on GitHub.
   * Click **Settings** (top tab) → **Pages** (in the left sidebar).
   * Under **Build and deployment** → **Source**, select **GitHub Actions**.

3. **Automatic Deployment:**
   * Whenever you push to the `main` branch, the GitHub Actions workflow will automatically run, build, and deploy your application.
   * Your site will be live at:
     ```
     https://<your-username>.github.io/<your-repo-name>/
     ```

---

## ⚙️ Base Path & Custom Domains

You do **not** need to hard-code your repository name! 

`vite.config.ts` dynamically handles the base URL:
1. **GitHub Actions (Automatic):** Reads the built-in `GITHUB_REPOSITORY` environment variable and sets `base: '/<your-repo-name>/'` automatically.
2. **Local / Generic Static Hosting:** Falls back to relative paths (`./`), allowing the output to be served from any directory or subfolder.
3. **Custom Domain:** If you are using a custom domain (e.g., `https://littledoodler.com`), set `VITE_BASE_PATH=/` in your build environment or in `vite.config.ts`.

---

## 🎨 Adding New Coloring Pages (Design Team)

Adding a new picture is as simple as dropping an SVG file into the asset folder:
```
src/assets/pictures/
├── animals/
├── vehicles/
├── nature/
└── fantasy/
```
On app reload, the picture will be automatically discovered and playable. See [DESIGNER_SVG_GUIDE.md](./DESIGNER_SVG_GUIDE.md) for full design guidelines.

---

## 📜 License
Apache-2.0
