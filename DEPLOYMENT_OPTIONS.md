# Best Deployment Options for Your Static Site

## 🎯 **RECOMMENDED: Netlify (Easiest)**

Netlify handles subdirectories better than Vercel for static sites.

### Steps:
1. Go to [netlify.com](https://netlify.com)
2. Sign up/login
3. Click "Add new site" → "Deploy manually" or connect GitHub
4. Drag & drop your project folder OR connect GitHub repo
5. **That's it!** Netlify auto-detects `netlify.toml`

**Why Netlify is better here:**
- ✅ Better handling of subdirectories
- ✅ Simpler configuration
- ✅ Free tier is generous
- ✅ Auto-deploys from GitHub

---

## Option 2: GitHub Pages (Simplest, Free)

### Steps:
1. Push your code to GitHub
2. Go to repo → Settings → Pages
3. Set source to: **Root directory** or **/html** directory
4. If using `/html`, update all paths in HTML files (remove `../`)

**Pros:** Free, simple, reliable  
**Cons:** Less control, slower builds

---

## Option 3: Fix Vercel (Current Setup)

### The Problem:
Vercel's rewrites might not be working because:
1. Build command might be failing
2. Static assets not being served correctly
3. Path resolution issues

### Try This:
1. **In Vercel Dashboard:**
   - Go to Project Settings
   - Set **Root Directory** to `.` (root)
   - Set **Build Command** to `npm run build`
   - Set **Output Directory** to `.`

2. **Or simplify structure:**
   Move HTML files to root (see script below)

---

## Option 4: Move Files to Root (Most Reliable for Vercel)

This is the **most reliable** solution for Vercel.

### Quick Fix Script:
Create a `deploy.sh` or run these commands:

```bash
# Move HTML files to root
mv html/*.html .

# Update paths in all HTML files (remove ../)
# CSS: ../css/style.css → css/style.css
# JS: ../js/script.js → js/script.js
# Images: ../Untitled.jpg → Untitled.jpg
```

Then update `vercel.json`:
```json
{
  "buildCommand": "npm run build"
}
```

**No rewrites needed!** Vercel will serve files directly.

---

## 🚀 **My Recommendation:**

**Use Netlify** - It's the easiest for your current structure:
1. I've already created `netlify.toml` for you
2. Just sign up and deploy
3. Works immediately with your current file structure
4. No path changes needed

**OR** if you want to stick with Vercel:
- Move HTML files to root (most reliable)
- Update paths (remove `../`)
- Deploy

Which would you prefer? I can help set up either!

