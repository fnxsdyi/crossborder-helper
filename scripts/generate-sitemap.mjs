#!/usr/bin/env node
/**
 * TaxFlow — build-time sitemap generator.
 *
 * WHY THIS EXISTS
 * ---------------
 * public/sitemap.xml was hand-maintained and its <lastmod> froze at
 * 2026-09-27. Every deploy kept serving the same 6 URLs with a 44-day-old
 * timestamp, so Bing had no freshness signal even though the pages had
 * changed. ChartFlow already emits a build-time lastmod; this script brings
 * TaxFlow in line with that pattern.
 *
 * WHAT IT DOES
 * ------------
 * Runs after `vite build` (which copies public/ into dist/) and overwrites
 * dist/sitemap.xml plus the .gz/.br pre-compressed copies emitted by
 * vite-plugin-compression2, so every served variant carries the fresh lastmod.
 * public/sitemap.xml is kept as a dev/fallback copy and is updated manually
 * whenever the route list changes.
 *
 * Route list must stay in sync with vercel.json rewrites and
 * scripts/prerender-seo.mjs ROUTES.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { brotliCompressSync, gzipSync } from 'node:zlib'

const here = dirname(fileURLToPath(import.meta.url))
const DIST = join(here, '..', 'dist')
const ORIGIN = 'https://tax.flowingpulse.com'

const ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/tools', changefreq: 'weekly', priority: '0.8' },
  { path: '/tools/w8ben-withholding-calculator', changefreq: 'weekly', priority: '0.8' },
  { path: '/tools/invoice-generator', changefreq: 'weekly', priority: '0.8' },
  { path: '/tools/w8ben-checklist', changefreq: 'weekly', priority: '0.8' },
  { path: '/terms', changefreq: 'yearly', priority: '0.6' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/disclaimer', changefreq: 'yearly', priority: '0.3' },
]

const escapeXml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const lastmod = new Date().toISOString()
const urls = ROUTES.map(({ path, changefreq, priority }) => `  <url>
    <loc>${escapeXml(ORIGIN + path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`

mkdirSync(DIST, { recursive: true })
const output = join(DIST, 'sitemap.xml')
const payload = Buffer.from(xml, 'utf8')
writeFileSync(output, payload)

// vite-plugin-compression2 emits .gz/.br copies of the static public/ fallback
// during `vite build`, BEFORE this script runs. Rewrite those copies too, so a
// CDN that prefers pre-compressed assets never serves a stale lastmod.
writeFileSync(`${output}.gz`, gzipSync(payload))
writeFileSync(`${output}.br`, brotliCompressSync(payload))

console.log(`sitemap written: ${output} (${ROUTES.length} urls, lastmod ${lastmod})`)
