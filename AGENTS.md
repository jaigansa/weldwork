# AGENTS.md

## PROJECT OVERVIEW

**WeldWork** — a fast, minimalist, fullscreen static web application built with **Hugo** and deployed on **Cloudflare Pages**. It explains "What We Do", features a fullscreen app-like experience, accepts customer inquiries delivered straight to the owner's Gmail via Web3Forms, and provides client-side content management via Decap CMS.

## ARCHITECTURE & TECH STACK

- **Static Site Generator:** Hugo (Extended Edition)
- **Deployment Platform:** Cloudflare Pages
- **CMS:** Decap CMS (Git-based static admin panel)
- **Form Delivery:** Web3Forms API (Direct to Gmail)
- **Bot/Spam Protection:** Cloudflare Turnstile
- **Analytics:** Cloudflare Web Analytics (Cookie-less)

### Core UX Requirements

- Fullscreen web app look & feel (SPA experience, no full reloads).
- Fixed viewport height using `100dvh` — no outer body scrolling.
- Header bar (top), bottom navigation bar (bottom), dynamic screen switcher in the middle.
- Smooth CSS transitions between screens (Home / What We Do, Services).
- High-visibility "Quick Inquiry" CTA in both header and bottom nav.
- Floating overlay modal for inquiry submission.

## DIRECTORY & FILE STRUCTURE RULES

Strictly respect and maintain the following Hugo directory layout:

```text
my-hugo-site/
├── hugo.toml                # Primary site configuration
├── content/                 # Markdown & front-matter source files
│   ├── _index.md            # Home screen content
│   └── services/            # Service offerings
├── layouts/                 # Custom HTML layout templates
│   ├── _default/
│   │   ├── baseof.html      # App shell markup
│   │   └── list.html
│   └── partials/
│       ├── header.html      # Top app navigation bar
│       ├── footer.html      # Bottom tab switcher
│       └── contact-modal.html # Web3Forms inquiry overlay
├── static/                  # Raw untranspiled assets (copied verbatim to /public)
│   ├── admin/
│   │   ├── index.html       # Decap CMS loader
│   │   └── config.yml       # Decap CMS field schema
│   ├── css/
│   │   └── app.css          # App-look styling (100dvh viewport)
│   ├── js/
│   │   └── app.js           # Screen switcher & modal logic
│   └── _headers             # Caching rules (copied to output)
└── functions/               # Optional Cloudflare Pages Functions
```

- `static/*` is copied verbatim into the build output (`public/`). Keep `_headers` there so it ships to Cloudflare Pages.
- Build command: `hugo --minify`; output directory: `public/`. Use the **Extended Edition** (SCSS support).
- No framework, no bundler, no package.json required.

## Inquiry & Form Handling

- **Primary:** Standard HTML form → Web3Forms API endpoint (`https://api.web3forms.com/submit`), delivering to Gmail. Requires an access key (public-safe). Free plan: 250 submissions/month.
- **Fallback:** Embedded responsive Google Form iframe OR HTML `mailto:` mechanism (feature-detected).
- **Spam protection:** Cloudflare Turnstile widget. NOTE: Turnstile on Web3Forms is a **PRO** feature. On free plan, use Web3Forms' built-in hCaptcha instead (`<div class="h-captcha" data-captcha="true"></div>` + `https://web3forms.com/client/script.js`) — both are wired server-side by pasting a secret key in the Web3Forms dashboard.

### Web3Forms form pattern (in `layouts/partials/contact-modal.html`)

```html
<form action="https://api.web3forms.com/submit" method="POST" id="inquiry-form">
  <input type="hidden" name="access_key" value="YOUR_ACCESS_KEY">
  <input type="hidden" name="subject" value="New Inquiry from weldwork site">
  <input type="hidden" name="from_name" value="WeldWork">
  <input type="text" name="name" required>
  <input type="email" name="email" required>
  <textarea name="message" required></textarea>
  <!-- Turnstile (PRO) or hCaptcha (free) widget here -->
  <button type="submit">Send</button>
</form>
```

- AJAX submit: `POST https://api.web3forms.com/submit`, headers `Content-Type: application/json` + `Accept: application/json`. Success = HTTP 200 + `{success:true, message}`. Errors: 400/429/500. Use `FormData` (auto-includes captcha token) or build JSON manually (include `cf-turnstile-response` yourself). Reset the captcha widget in a `finally` block.

### Turnstile (explicit render for modal)

```html
<link rel="preconnect" href="https://challenges.cloudflare.com" />
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" defer></script>
<div id="turnstile-widget"></div>
<script>
  let widgetId;
  function renderTurnstile() {
    widgetId = turnstile.render("#turnstile-widget", {
      sitekey: "YOUR_TURNSTILE_SITE_KEY",
      theme: "light",
      callback: (token) => {},
      "error-callback": (code) => console.error("Turnstile error:", code),
      "expired-callback": () => console.warn("Token expired; resetting"),
    });
  }
</script>
```

- Tokens expire after 300s and are single-use. Widget inside a `<form>` auto-injects `<input type="hidden" name="cf-turnstile-response">`. Render on modal open (not page load), not while the modal is hidden. Test keys: sitekey `1x00000000000000000000AA`.
- **Do NOT proxy/cache** `challenges.cloudflare.com/turnstile/v0/api.js`.

## Analytics

- Cloudflare Web Analytics beacon, manual embed in `layouts/_default/baseof.html` (must use `type="module"`):

```html
<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js"
  data-cf-beacon='{"token": "YOUR_SITE_TOKEN"}'></script>
```

- SPA route tracking is on by default via `pushState`/`popstate`. **Hash-based routing is NOT tracked.** If the screen switcher uses `pushState`, pageviews are tracked per screen automatically.
- **Custom events are NOT supported** by Web Analytics — do not build custom event calls.
- Alternative: enable Web Analytics per Pages project (Metrics → Enable); snippet auto-injected on next deploy.

## Decap CMS (`static/admin/`)

- Admin script (official, latest 3.x):

```html
<script src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"></script>
```

- `admin/index.html` includes `<meta name="robots" content="noindex" />`. Decap uses hash routing (`/admin/#/...`), so no SPA fallback needed.
- **Do NOT** create root `admin.html` alongside `static/admin/` — Cloudflare serves the file with priority and Decap breaks.
- `config.yml` requires a Git backend (GitHub/GitLab OAuth, or Git Gateway). Recommended Pages path: GitHub backend + self-hosted OAuth proxy (Cloudflare Pages Function `functions/api/auth.js`), with:

```yaml
backend:
  name: github
  repo: owner/repo
  branch: main            # MUST equal the Pages production branch
  base_url: https://your-domain.com
  auth_endpoint: api/auth
```

- Use `folder` collections targeting `content/` markdown files (e.g. `content/_index.md`, `content/services/*.md`) with `format: frontmatter`. Include `media_folder` at top level. Each CMS save = commit → Pages auto-rebuilds.
- If a service worker exists, exclude `/admin/` from SW caching (stale `config.yml` breaks auth).

## _headers (caching, in `static/_headers`)

```txt
/css/* /js/*
  Cache-Control: public, max-age=31556952, immutable

/services/*
  Cache-Control: public, max-age=300

/admin/*
  Cache-Control: no-store

/*
  Cache-Control: public, max-age=300
```

- Rules apply to static assets only, not Pages Functions. Avoid `Cache-Control: public, no-transform` on HTML.

## Script Loading Strategy

- Turnstile: `async defer` (preconnect to `challenges.cloudflare.com`).
- Web Analytics beacon: `defer` + `type="module"`.
- Decap CMS: only on `/admin/`, plain script last in body.
- Preconnect: `https://challenges.cloudflare.com`, `https://static.cloudflareinsights.com`, `https://api.web3forms.com`.

## Code Quality Rules

- Clean, semantic HTML5, CSS3, vanilla JavaScript (no React/Vue unless requested).
- Fully responsive (mobile, tablet, desktop).
- Clean separation: UI styling (`static/css/app.css`), state toggling (`static/js/app.js`), page content (`content/` markdown + Hugo front matter).
- No comments in code unless asked.

## Build & Config Tasks (do not skip)

1. All integrations need real keys/placeholders: Web3Forms access key, Turnstile site key + secret (PRO), Web Analytics token, GitHub repo name. Use obvious placeholders (`YOUR_...`) and a small CONFIG section in `app.js`/`hugo.toml`.
2. Set `baseURL` and metadata in `hugo.toml` before deploying.
3. Verify locally: `hugo server -D` (dev) then a production build `hugo --minify`; preview with `python -m http.server -d public` or `npx serve public`.
4. On Cloudflare Pages: framework preset Hugo, build command `hugo --minify`, output directory `public`, and use the Git integration so Decap CMS commits rebuild the site.
