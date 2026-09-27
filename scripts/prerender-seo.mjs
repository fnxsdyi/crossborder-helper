#!/usr/bin/env node
/**
 * TaxFlow — post-build SEO prerender.
 *
 * WHY THIS EXISTS
 * ---------------
 * TaxFlow ships as a client-rendered Vite SPA. Before this script, `vercel.json`
 * rewrote every unmatched path to `/index.html`, so `/tools` and the three
 * `/tools/*` pages all returned the *same* HTML — byte-for-byte identical, with
 * `<link rel="canonical">` pointing at the homepage. Search engines collapsed the
 * entire site into a single indexable page (Bing `InIndex` stuck at 1–2 over
 * 25 days while the crawl layer reported zero errors).
 *
 * WHAT IT DOES
 * ------------
 * Runs right after `vite build`. For every public route below it clones
 * `dist/index.html` and rewrites:
 *   - <title>
 *   - <meta name="description">
 *   - <link rel="canonical">        ← self-referencing (this is the lethal fix)
 *   - <meta property="og:url|og:title|og:description">
 *   - <meta name="twitter:title|twitter:description">
 *   - the off-screen prerendered content shell inside #root
 *   - route-aware hreflang alternates
 * then writes `dist/<path>/index.html`.
 *
 * React still takes over on mount (createRoot replaces #root's children), so the
 * user-visible experience is unchanged — only the raw HTML that crawlers and
 * `curl` receive becomes route-specific.
 *
 * The `/` homepage is NOT rewritten: `dist/index.html` already carries a correct
 * self-canonical and its own shell.
 *
 * Output:
 *   dist/tools/index.html
 *   dist/tools/w8ben-withholding-calculator/index.html
 *   dist/tools/invoice-generator/index.html
 *   dist/tools/w8ben-checklist/index.html
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const DIST = join(here, '..', 'dist')
const ORIGIN = 'https://tax.flowingpulse.com'

const HIDDEN_STYLE =
  'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0'

const FOOTER = `      <footer style="text-align:center;padding:1.5rem 1rem;color:#64748b;font-size:12px;font-family:system-ui,sans-serif">
        <a href="https://kaki.llc" rel="noopener noreferrer" style="color:#64748b;text-decoration:none">Kaki — SaaS Platform</a>
      </footer>`

const TOOL_NAV = `        <nav aria-label="Free tools">
          <a href="/tools/w8ben-withholding-calculator">W-8BEN Withholding Calculator</a> ·
          <a href="/tools/invoice-generator">Free Invoice Generator</a> ·
          <a href="/tools/w8ben-checklist">W-8BEN Filing Checklist</a> ·
          <a href="/tools">All free tax tools</a>
        </nav>`

/** Wrap a route's <main> content in the off-screen, aria-hidden shell. */
function wrapShell(inner) {
  return `      <div aria-hidden="true" style="${HIDDEN_STYLE}">
${inner}
${FOOTER}
      </div>`
}

const ROUTES = [
  {
    path: '/tools',
    title: 'Free Tools for Cross-Border Freelancers | TaxFlow',
    description:
      'Free tools for global freelancers — W-8BEN withholding tax calculator, form checklists, and invoice helpers. No signup required.',
    ogTitle: 'Free Tools for Cross-Border Freelancers | TaxFlow',
    ogDescription:
      'Free, no-signup tools for freelancers working with US clients: a W-8BEN withholding calculator, a W-8BEN form checklist, and a multi-currency invoice generator.',
    h1: 'Free tools for cross-border freelancers',
    breadcrumb: [{ name: 'Home', path: '/' }, { name: 'Free Tools', path: '/tools' }],
    shell: wrapShell(`        <main>
          <h1>Free tools for cross-border freelancers</h1>
          <p>Practical, no-signup calculators and helpers for freelancers working with US clients. Built by the TaxFlow team to make cross-border taxes a little less painful.</p>
          <ul>
            <li><a href="/tools/w8ben-withholding-calculator">W-8BEN Withholding Tax Calculator</a> — see exactly how much a missing or expired W-8BEN costs you: compare the default 30% withholding against your country’s tax-treaty rate.</li>
            <li><a href="/tools/w8ben-checklist">W-8BEN Form Checklist</a> — a step-by-step checklist for filling out Form W-8BEN correctly, and avoiding the mistakes that trigger 30% backup withholding.</li>
            <li><a href="/tools/invoice-generator">Invoice Generator</a> — create a clean, professional, tax-ready invoice in seconds; multi-currency and downloadable as PDF.</li>
          </ul>
          <p>Every tool runs free and without an account. TaxFlow — the full workspace — adds W-8BEN expiry tracking with reminders, invoice scanning (OCR), cloud sync, and a multi-currency dashboard.</p>
          <h2>Want the full toolkit?</h2>
          <p>TaxFlow tracks every W-8BEN, scans invoices, and manages multi-currency taxes in one place.</p>
          <p><a href="/#pricing">Start free</a></p>
${TOOL_NAV}
        </main>`),
  },
  {
    path: '/tools/w8ben-withholding-calculator',
    title: 'W-8BEN Withholding Tax Calculator — 30% vs Treaty Rate | TaxFlow',
    description:
      'Free calculator: see how much US tax a missing W-8BEN costs you. Compare the default 30% withholding against your country’s tax-treaty rate.',
    ogTitle: 'W-8BEN Withholding Tax Calculator — 30% vs Treaty Rate',
    ogDescription:
      'Compare the default 30% US withholding against your country’s tax-treaty rate and see what a missing or expired W-8BEN really costs. Free, no signup.',
    h1: 'W-8BEN Withholding Tax Calculator',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'Free Tools', path: '/tools' },
      { name: 'W-8BEN Withholding Tax Calculator', path: '/tools/w8ben-withholding-calculator' },
    ],
    shell: wrapShell(`        <main>
          <h1>W-8BEN Withholding Tax Calculator</h1>
          <p>Without a valid W-8BEN, US payers withhold tax at the default <strong>30%</strong> statutory rate. File the right form and your country’s tax treaty can cut that dramatically. See what a missing — or expired — form really costs you.</p>
          <h2>How the calculator works</h2>
          <ol>
            <li>Choose your country of residence and the type of US-source income (dividends, interest, or royalties).</li>
            <li>Enter your annual US-source income in US dollars.</li>
            <li>The calculator compares the default 30% statutory withholding against your country’s tax-treaty rate, and shows how much more of your income you keep with a valid W-8BEN.</li>
          </ol>
          <h2>What a W-8BEN changes</h2>
          <p>A W-8BEN (Certificate of Foreign Status of Beneficial Owner for United States Tax Withholding and Reporting) tells a US payer that you are a non-resident alien and lets you claim a reduced rate under an applicable US income tax treaty. Without it — or once an older form has lapsed — the payer must default to the 30% rate on US-source income.</p>
          <h3>Examples of treaty rates</h3>
          <ul>
            <li>United Kingdom: 0% on dividends, interest, and royalties.</li>
            <li>Germany: 15% on dividends; 0% on interest and royalties.</li>
            <li>Australia: 15% on dividends, 10% on interest, 5% on royalties.</li>
            <li>Hong Kong: no US tax treaty — the default 30% rate applies.</li>
          </ul>
          <p>Rates shown are typical statutory rates for educational estimates and can vary by ownership percentage and income type. Always confirm the precise treaty article for your situation.</p>
          <h2>Never let a form lapse again</h2>
          <p>TaxFlow tracks every W-8BEN you file and reminds you before it expires — so you never slip back to the 30% default.</p>
          <p><a href="/#pricing">Start free with TaxFlow</a></p>
          <p>This calculator provides a general educational estimate and is not tax advice; consult a qualified tax professional for your situation.</p>
${TOOL_NAV}
        </main>`),
  },
  {
    path: '/tools/invoice-generator',
    title: 'Free Invoice Generator — Create & Download Invoices (PDF) | TaxFlow',
    description:
      'Free invoice generator for freelancers. Create professional, multi-currency invoices in seconds, add tax, and download or print as PDF. No signup required.',
    ogTitle: 'Free Invoice Generator — Create & Download Invoices (PDF)',
    ogDescription:
      'Create a clean, professional invoice in seconds — multi-currency, tax-ready, and downloadable as PDF. No account, no watermarks, no fees.',
    h1: 'Free Invoice Generator',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'Free Tools', path: '/tools' },
      { name: 'Invoice Generator', path: '/tools/invoice-generator' },
    ],
    shell: wrapShell(`        <main>
          <h1>Free Invoice Generator</h1>
          <p>Create a clean, professional invoice in seconds — multi-currency, tax-ready, and ready to download as PDF. No account, no watermarks, no fees.</p>
          <h2>What you can do with it</h2>
          <ul>
            <li>Add your details and your client’s, then fill in line items with quantity and price.</li>
            <li>Choose from twelve currencies — USD, EUR, GBP, JPY, CAD, AUD, CNY, SGD, INR, CHF, SEK, and NZD — with automatic formatting.</li>
            <li>Apply an optional tax rate and see subtotal, tax, and total update instantly.</li>
            <li>Add an invoice number, issue date, due date, and a note.</li>
            <li>Download or print the finished invoice as a PDF — free, with no signup.</li>
          </ul>
          <h2>Free tool vs. the full version</h2>
          <p>This generator is a fast, no-signup tool. TaxFlow is the full invoice and tax workspace: your invoices sync to the cloud, with US/EU/UK templates, VAT handling, batch PDF export, client history, and W-8BEN tracking.</p>
          <p><a href="/register">Get the full version — free</a></p>
${TOOL_NAV}
        </main>`),
  },
  {
    path: '/tools/w8ben-checklist',
    title: 'W-8BEN Form Checklist — How to Fill Out Form W-8BEN Correctly | TaxFlow',
    description:
      'Step-by-step W-8BEN form checklist for freelancers. Fill out Form W-8BEN correctly and avoid the 30% backup withholding that comes from common mistakes.',
    ogTitle: 'W-8BEN Form Checklist — How to Fill Out Form W-8BEN Correctly',
    ogDescription:
      'A field-by-field W-8BEN checklist for freelancers: Part I identification, Part II treaty claim, and Part III certification — plus the mistakes that trigger 30% withholding.',
    h1: 'W-8BEN Form Checklist',
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'Free Tools', path: '/tools' },
      { name: 'W-8BEN Form Checklist', path: '/tools/w8ben-checklist' },
    ],
    shell: wrapShell(`        <main>
          <h1>W-8BEN Form Checklist</h1>
          <p>A clean, field-by-field checklist for filling out <strong>Form W-8BEN</strong> the right way — and avoiding the common mistakes that push US payers back to the default <strong>30% withholding</strong>.</p>
          <section>
            <h2>Part I — Identification of Beneficial Owner</h2>
            <p>Who you are. Errors here are the most common reason a form gets rejected or ignored by a payer.</p>
            <ul>
              <li>Full legal name (last, first, middle) — use the name on your passport, not a brand or nickname. A mismatch can void the form.</li>
              <li>Country of citizenship — your passport country, even if you live elsewhere; this drives your treaty eligibility.</li>
              <li>Permanent residence address — a real street address, not a PO box, unless your country has no street system.</li>
              <li>Mailing address (if different) — skip if it matches your residence address.</li>
              <li>U.S. TIN or foreign tax ID — enter your SSN/ITIN if you have one, otherwise your foreign tax ID; never leave both blank without explanation.</li>
              <li>Date of birth — required only when you do not provide a U.S. taxpayer identification number.</li>
            </ul>
          </section>
          <section>
            <h2>Part II — Claim of Tax Treaty Benefits</h2>
            <p>This is where you claim a lower withholding rate. Get the country or article wrong and you slip back to the default 30%.</p>
            <ul>
              <li>Country of residence for treaty purposes — usually your country of citizenship or residence; this is the country whose treaty you claim.</li>
              <li>Treaty article and paragraph (or “None”) — name the specific article that grants the reduced rate; if you make no claim, write “None” rather than leaving it blank.</li>
              <li>Special rates or conditions (if any) — only fill this in if your treaty has a special provision for your income type.</li>
            </ul>
          </section>
          <section>
            <h2>Part III — Certification</h2>
            <p>The signature under penalties of perjury. A missing or undated signature makes the whole form invalid.</p>
            <ul>
              <li>Sign under penalties of perjury — must be signed by you (the beneficial owner), not the payer; most payers accept electronic signatures.</li>
              <li>Capacity in which you sign — if signing as an individual, write “self” or your own name.</li>
              <li>Date of signing — an undated certification is invalid; keep the date current, since a stale form is a common rejection cause.</li>
            </ul>
          </section>
          <h2>This is the lightweight version</h2>
          <p>TaxFlow generates the full W-8BEN for you, stores every version, and reminds you before each form expires — so a single missed date never trips the 30% default again.</p>
          <p><a href="/register">Get the full version</a></p>
          <p>This checklist follows the general structure of Form W-8BEN (Rev. 2021) for educational purposes. It is not a substitute for the official IRS form, legal guidance, or advice from a qualified tax professional.</p>
${TOOL_NAV}
        </main>`),
  },
]

// ── helpers ───────────────────────────────────────────────────────────────────

const escText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escAttr = (s) => escText(s).replace(/"/g, '&quot;')

/** Replace once; fail the build if the anchor is missing (never ship a silent no-op). */
function mustReplace(html, re, replacer, label) {
  if (!re.test(html)) {
    throw new Error(`[prerender-seo] anchor not found: ${label} (regex ${re})`)
  }
  return html.replace(re, replacer)
}

function buildPage(baseHtml, r) {
  const url = ORIGIN + r.path
  let out = baseHtml

  out = mustReplace(out, /<title>[\s\S]*?<\/title>/, () => `<title>${escText(r.title)}</title>`, 'title')
  out = mustReplace(
    out,
    /(<meta name="description" content=")[^"]*(")/,
    (_m, a, b) => a + escAttr(r.description) + b,
    'meta description'
  )
  out = mustReplace(
    out,
    /(<link rel="canonical" href=")[^"]*(")/,
    (_m, a, b) => a + url + b,
    'canonical'
  )
  // Swap the off-screen shell. NOTE: Vite hoists the entry <script type="module">
  // into <head>, so the body ends with the #root shell immediately followed by
  // </body> — anchor on that, not on the script tag.
  out = mustReplace(
    out,
    /(<div id="root">)[\s\S]*?(<\/body>)/,
    (_m, a, b) => `${a}\n${r.shell}\n    </div>\n  ${b}`,
    'root shell'
  )

  // Optional head tags — warn (do not fail) if the shape ever changes.
  const soft = [
    [/(<meta property="og:url" content=")[^"]*(")/, (_m, a, b) => a + url + b, 'og:url'],
    [/(<meta property="og:title" content=")[^"]*(")/, (_m, a, b) => a + escAttr(r.ogTitle) + b, 'og:title'],
    [/(<meta property="og:description" content=")[^"]*(")/, (_m, a, b) => a + escAttr(r.ogDescription) + b, 'og:description'],
    [/(<meta name="twitter:title" content=")[^"]*(")/, (_m, a, b) => a + escAttr(r.ogTitle) + b, 'twitter:title'],
    [/(<meta name="twitter:description" content=")[^"]*(")/, (_m, a, b) => a + escAttr(r.ogDescription) + b, 'twitter:description'],
  ]
  for (const [re, fn, label] of soft) {
    if (re.test(out)) out = out.replace(re, fn)
    else console.warn(`[prerender-seo] skipped optional tag: ${label}`)
  }

  // Structured data: the homepage's BreadcrumbList only lists "Home", and its
  // FAQPage describes the homepage. Replace the breadcrumb with a route-specific
  // one and drop the homepage FAQ from sub-pages (they have no FAQ of their own).
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: r.breadcrumb.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      item: ORIGIN + b.path,
    })),
  }
  const breadcrumbScript = `<script type="application/ld+json">\n    ${JSON.stringify(breadcrumb)}\n    </script>`
  const bcRe = /<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema\.org",\s*"@type": "BreadcrumbList"[\s\S]*?<\/script>/
  if (bcRe.test(out)) out = out.replace(bcRe, () => breadcrumbScript)
  else console.warn('[prerender-seo] skipped: BreadcrumbList not found')

  out = out.replace(/<!--\s*Structured Data - FAQ\s*-->\s*/, '')
  out = out.replace(
    /<script type="application\/ld\+json">\s*\{\s*"@context": "https:\/\/schema\.org",\s*"@type": "FAQPage"[\s\S]*?<\/script>\s*/,
    ''
  )

  // Route-aware hreflang: point the alternates at THIS route, not the homepage.
  // Both patterns are anchored on `hreflang=`, so og:image / JSON-LD are untouched.
  out = out.replace(
    /(<link rel="alternate" hreflang="[a-z-]+" href=")https:\/\/tax\.flowingpulse\.com\/\?lang=([a-z]+)(")/g,
    (_m, a, code, b) => `${a}${ORIGIN}${r.path}?lang=${code}${b}`
  )
  out = out.replace(
    /(<link rel="alternate" hreflang="x-default" href=")https:\/\/tax\.flowingpulse\.com\/(")/,
    (_m, a, b) => a + url + b
  )

  return out
}

// ── main ──────────────────────────────────────────────────────────────────────

function main() {
  const srcIndex = join(DIST, 'index.html')
  if (!existsSync(srcIndex)) {
    throw new Error(`[prerender-seo] dist/index.html not found at ${srcIndex}. Run this after "vite build".`)
  }
  const base = readFileSync(srcIndex, 'utf8')

  for (const r of ROUTES) {
    const html = buildPage(base, r)
    const target = join(DIST, ...r.path.split('/').filter(Boolean), 'index.html')
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, html, 'utf8')
    const rel = target.slice(DIST.length + 1).replace(/\\/g, '/')
    console.log(`[prerender-seo] wrote dist/${rel}  (${html.length} B)`)
  }

  console.log(`[prerender-seo] done — ${ROUTES.length} route(s) prerendered.`)
}

main()
