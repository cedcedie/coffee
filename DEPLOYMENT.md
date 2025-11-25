# Vercel Deployment Guide

## Understanding the 404 Error

### Root Cause Analysis

**What happened:**
- Your HTML files are in `html/` subdirectory
- CSS/JS files are in `css/` and `js/` directories at root
- HTML files use relative paths: `../css/style.css`, `../js/script.js`
- Vercel by default serves from root directory
- When you visit `/`, Vercel can't find `index.html` at root (it's in `html/`)

**Why the error occurred:**
1. **Path Resolution Mismatch**: Vercel expects files at root, but yours are in subdirectories
2. **Relative Path Confusion**: When rewrites happen, relative paths resolve differently than expected
3. **Build Process**: Vercel might not be running the Tailwind build before serving

### The Fix

The `vercel.json` configuration now:
- Routes requests to correct HTML files
- Ensures static assets (CSS/JS/images) are served correctly
- Runs the build command to compile Tailwind CSS

## Deployment Steps

1. **Ensure all files are committed:**
   ```bash
   git add .
   git commit -m "Add Vercel configuration"
   ```

2. **Deploy to Vercel:**
   - Via CLI: `vercel --prod`
   - Via GitHub: Push to your repo (auto-deploys if connected)

3. **Verify build:**
   - Check Vercel dashboard → Build Logs
   - Ensure `npm run build` completes successfully
   - CSS should be compiled to `css/style.css`

## Alternative Solutions

### Option 1: Move Files to Root (Simpler)
Move all HTML files to root directory:
```
/ (root)
  ├── index.html
  ├── menu.html
  ├── cart.html
  ├── css/
  ├── js/
```

**Pros:** No rewrites needed, simpler paths
**Cons:** Clutters root directory

### Option 2: Use Base Tag (Current Setup)
Keep current structure, ensure `vercel.json` is correct.

**Pros:** Organized structure
**Cons:** Requires rewrites configuration

### Option 3: Use Vercel's Root Directory Setting
In Vercel dashboard → Settings → Root Directory → Set to `html/`

**Pros:** No rewrites needed
**Cons:** Need to adjust all paths in HTML files

## Troubleshooting

If 404 persists:
1. Check Vercel build logs for errors
2. Verify `css/style.css` exists after build
3. Check browser console for failed resource loads
4. Ensure `vercel.json` is in root directory
5. Try accessing `/html/index.html` directly to test

