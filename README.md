# Liquid Legacy Distribution: website, logo suite, brand book

The landing page for Liquid Legacy Distribution (wine and spirits distribution, est. 2026), plus the hand-built logo suite and the brand book.

- **Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS 3.4, `class-variance-authority` primitives (house pattern), zod and nodemailer for the contact form. It runs as a standalone Node server.
- **Look:** obsidian black, antique gold sampled from the crest, and parchment. Cinzel for labels, Cormorant Garamond for headlines, Libre Franklin for body.

## What's where

| Path | What |
|---|---|
| `src/app/` | Pages (`/`, `/privacy`, `/terms`, `/accessibility`, 404), `robots.ts`, `sitemap.ts`, `manifest.ts`, `api/contact` |
| `src/content/site.ts` | **All copy and editable facts** (contact details, states served). Edit here, not in components. |
| `src/components/site/` | Page sections, header, footer, age gate |
| `public/media/` | Photos, hero video (10 s seamless loop, 1080p and 720p) and poster |
| `public/brand/` | Logo SVGs and the crest cutout used on the site |
| `brand/` | Tokens, fonts, logo build scripts, media prompts |
| `brand-book/` | Brand book source (HTML) and its PDF build script |
| `deliverables/` | **Hand-off files:** brand book PDF and the logo suite (SVG, PNG, ICO) |
| `deploy/` | Nginx example |

## Local development

```bash
pnpm install
pnpm dev            # http://localhost:3410
pnpm typecheck && pnpm lint
```

In development, the contact form logs inquiries to the terminal instead of sending email when no SMTP server is configured.

## Configuration

Copy `.env.example` to `.env.production` on the VPS and fill it in. Never commit it.

| Variable | When it's read | Purpose |
|---|---|---|
| `SITE_URL` | build | Canonical links, Open Graph, sitemap. Example: `https://www.your-domain.com` |
| `NEXT_PUBLIC_ALLOW_INDEXING` | build | `false` (default) keeps search engines out with noindex and robots.txt. Set `true` at launch and rebuild. |
| `CONTACT_TO`, `CONTACT_FROM` | runtime | Who receives inquiries, and the sender address |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | runtime | Mail server used to deliver inquiries |
| `CONTACT_DRY_RUN` | runtime | `1` logs instead of sending (testing only) |
| `PROXY_SECRET` | runtime | Shared secret Nginx sends as `X-LLD-Proxy`, so the app can trust the visitor IP for rate limiting. Generate once with `openssl rand -hex 32` and put the same value in the Nginx config. The app logs an error if it's missing, short or the placeholder. |

## The proposal mockup: lld-mockup.abedubas.dev

The site is currently a proposal, published as a mockup on the shared VPS. Email delivery, contact details and the legal review come later.

That VPS also serves other clients, so the mockup only adds its own pieces: one container bound to 127.0.0.1, one Nginx site and one certificate. **Port 3000 is taken there, so the mockup uses 3480.** DNS needs no change, because `*.abedubas.dev` already points at the VPS.

| What | Where |
|---|---|
| Code (git checkout of this repo) | `/opt/lld-mockup/app` |
| App env (`chmod 600`, root only) | `/opt/lld-mockup/lld-mockup.env` |
| Container | `lld-mockup`, published on `127.0.0.1:3480` (container port 3000) |
| Image optimizer cache | Docker volume `lld-mockup-cache` |
| Nginx site | `/etc/nginx/sites-available/lld-mockup.abedubas.dev`, from `deploy/nginx.lld-mockup.conf` |
| Certificate | `/etc/letsencrypt/live/lld-mockup.abedubas.dev/`, renewed by the existing certbot timer |

The env file holds these values, without quotes:

```
SITE_URL=https://lld-mockup.abedubas.dev
NEXT_PUBLIC_ALLOW_INDEXING=false
CONTACT_DEMO_MODE=1
PROXY_SECRET=<openssl rand -hex 32; the same value goes in the Nginx X-LLD-Proxy line>
```

With `CONTACT_DEMO_MODE=1`, the form shows its success state but **nothing is sent or stored**, and the app logs a warning. Remove it before the real launch, then replace the container.

**Redeploy after a push to `main`.** The swap takes a few seconds, and Nginx needs no change:

```bash
cd /opt/lld-mockup/app && sudo git pull --ff-only
TAG=$(date +%Y%m%d-%H%M)
sudo docker build -t lld-mockup:$TAG --build-arg SITE_URL=https://lld-mockup.abedubas.dev .
sudo docker rm -f lld-mockup
sudo docker run -d --name lld-mockup --restart unless-stopped \
  -p 127.0.0.1:3480:3000 --env-file /opt/lld-mockup/lld-mockup.env \
  --read-only --tmpfs /tmp --mount type=volume,src=lld-mockup-cache,dst=/app/.next/cache \
  --cap-drop=ALL --security-opt no-new-privileges \
  --memory 768m --cpus 1.5 --pids-limit 256 lld-mockup:$TAG
```

## Deploying to the VPS

**Rules that keep it safe** (from the security review):
- **Node listens on 127.0.0.1 only.** Nginx is the only way in. Never publish the Node port to the internet. Docker-published ports bypass UFW.
- **Firewall:** allow only 22, 80 and 443 (`ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable`).
- **`PROXY_SECRET`** in the app env must equal the `X-LLD-Proxy` value in the Nginx config. Without it, the rate limiter can't trust the client IP and falls back to one shared bucket.
- **SMTP:** use a dedicated send-only account, not a staff mailbox, and prefer port 465 with `SMTP_SECURE=true`.
- **Never set `CONTACT_DRY_RUN=1` in production.** The app refuses it there.
- **Env file permissions:** `chmod 600` on the env file (Docker) or on `.env.production` and its copy inside `.next/standalone/` (PM2).

Pick one of the two options.

### Option A: Docker

```bash
docker build -t lld-site --build-arg SITE_URL=https://www.your-domain.com .
docker run -d --name lld-site --restart unless-stopped \
  -p 127.0.0.1:3000:3000 --env-file /etc/lld-site.env \
  --log-opt max-size=10m --log-opt max-file=3 \
  --read-only --tmpfs /tmp --mount type=volume,src=lld-cache,dst=/app/.next/cache \
  --cap-drop=ALL --security-opt no-new-privileges lld-site
```

In a Docker env file, don't wrap values in quotes: Docker keeps the quotes as part of the value.

### Option B: Node + PM2

```bash
pnpm install --frozen-lockfile
SITE_URL=https://www.your-domain.com pnpm build
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
cd .next/standalone && PORT=3000 HOSTNAME=127.0.0.1 pm2 start server.js --name lld-site
pm2 install pm2-logrotate
```

Then put Nginx in front: see `deploy/nginx.conf.example` for HTTPS, HSTS, real client IP headers, the proxy secret, and edge rate limits on `/api/contact` and `/_next/image`.

**Launch checklist**
1. Fill in `src/content/site.ts` → `contactDetails` (email, phone, city) and `coverage.states` once confirmed. The email also becomes the fallback shown if the form ever can't send.
2. Set the SMTP variables and `PROXY_SECRET`, and send one real test inquiry.
3. Have counsel review `/privacy` and `/terms`. They are drafts.
4. Set `NEXT_PUBLIC_ALLOW_INDEXING=true` and rebuild.

**Maintenance:** Next.js 15 receives security fixes only until **January 31, 2027**. Plan the move to Next.js 16 before then.

## Media and brand assets

- **Photos and hero video** were generated with Higgsfield for this project, then curated for realism. Prompts, models and the chosen takes are in `brand/media-prompts.md`. `node brand/scripts/process-media.mjs` rebuilds the web files from the raw downloads in `media-src/`, which isn't committed.
- **Logos:** `pnpm logos` rebuilds every SVG, PNG and icon from `brand/scripts/build-logos.mjs`, using the OFL fonts in `brand/fonts/`.
- **The crest** (`public/brand/crest-*.png`) is the client's supplied artwork with the background removed. It's a raster render meant for dark backgrounds. For print, embossing or light backgrounds, use the vector marks.
- **Brand book:** `pnpm brand-book` renders `deliverables/LLD-Brand-Book.pdf`.

Credits and licenses are in `CREDITS.md`.
