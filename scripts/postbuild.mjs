import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { guidePages } from '../src/content/guide-pages.js'
import { buildRobotsTxt, buildSitemapXml } from '../worker/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const sourceIndexPath = path.join(distDir, 'index.html')
const origin = 'https://extremeheatwatch.site'
const siteName = 'Extreme Heat Watch'
const googleVerification = (process.env.GOOGLE_SITE_VERIFICATION || '').trim()
const bingVerification = (process.env.BING_SITE_VERIFICATION || process.env.BING_WEBMASTER_VERIFICATION || '').trim()

const homeTitle = 'Extreme Heat Watch | Heat Compliance Scheduling'
const homeDescription =
  'Heat compliance scheduling, risk notifications, and OSHA/state rule reminders for enterprises, schools, and live events.'

const sourceIndex = await fs.readFile(sourceIndexPath, 'utf8')

await writeStaticPage('/', {
  title: homeTitle,
  description: homeDescription,
  robots: 'index,follow',
  canonicalPath: '/',
  rootHtml: buildHomePrerender(),
  structuredData: [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: siteName,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: `${origin}/`,
      description: homeDescription,
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        lowPrice: '74.50',
        highPrice: '399.50',
        availability: 'https://schema.org/InStock',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName,
      url: `${origin}/`,
    },
  ],
})

for (const page of guidePages) {
  const title = `${page.title} | ${siteName}`
  await writeStaticPage(page.path, {
    title,
    description: page.description,
    robots: 'index,follow',
    canonicalPath: page.path,
    rootHtml: buildGuidePrerender(page),
    structuredData: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        description: page.description,
        url: `${origin}${page.path}`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
          { '@type': 'ListItem', position: 2, name: page.h1, item: `${origin}${page.path}` },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: page.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  })
}

await writeStaticPage('/privacy', {
  title: `Privacy | ${siteName}`,
  description: 'How Extreme Heat Watch handles operations data, payment metadata, support messages, and first-party analytics.',
  robots: 'index,follow',
  canonicalPath: '/privacy',
  rootHtml: buildLegalPrerender(
    'Privacy Policy',
    'Extreme Heat Watch keeps planning data focused on operations and uses simple first-party events to understand product reliability.',
  ),
  structuredData: [],
})

await writeStaticPage('/terms', {
  title: `Terms | ${siteName}`,
  description: 'Terms for using Extreme Heat Watch scheduling, notifications, rule reminders, and hosted checkout.',
  robots: 'index,follow',
  canonicalPath: '/terms',
  rootHtml: buildLegalPrerender(
    'Terms of Service',
    'Plans cover heat-day schedule planning, notification workflows, rule reminders, and operational checklists.',
  ),
  structuredData: [],
})

await writeStaticPage('/checkout/done', {
  title: `Checkout Complete | ${siteName}`,
  description: 'Your Extreme Heat Watch checkout is finishing.',
  robots: 'noindex,nofollow',
  canonicalPath: '/checkout/done',
  rootHtml: buildLegalPrerender('Returning to Extreme Heat Watch...', 'Your payment is complete and the homepage is reopening.'),
  structuredData: [],
})

await fs.writeFile(path.join(distDir, 'sitemap.xml'), buildSitemapXml())
await fs.writeFile(path.join(distDir, 'robots.txt'), buildRobotsTxt())

async function writeStaticPage(routePath, page) {
  const html = renderHtml(page)

  if (routePath === '/') {
    await fs.writeFile(sourceIndexPath, html)
    return
  }

  const outputDir = path.join(distDir, routePath.replace(/^\/+/, ''))
  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(path.join(outputDir, 'index.html'), html)
}

function renderHtml({ title, description, robots, canonicalPath, rootHtml, structuredData }) {
  const canonicalUrl = `${origin}${canonicalPath === '/' ? '/' : canonicalPath}`
  let html = sourceIndex
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(title)}</title>`)
  html = upsertMeta(html, 'name', 'description', description)
  html = upsertMeta(html, 'name', 'robots', robots)
  html = upsertMeta(html, 'property', 'og:site_name', siteName)
  html = upsertMeta(html, 'property', 'og:title', title)
  html = upsertMeta(html, 'property', 'og:description', description)
  html = upsertMeta(html, 'property', 'og:url', canonicalUrl)
  html = upsertMeta(html, 'name', 'twitter:title', title)
  html = upsertMeta(html, 'name', 'twitter:description', description)
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${escapeAttr(canonicalUrl)}" />`)
  html = html.replace('<div id="root"></div>', `<div id="root">${rootHtml}</div>`)

  if (googleVerification) {
    html = html.replace('</head>', `    <meta name="google-site-verification" content="${escapeAttr(googleVerification)}" />\n  </head>`)
  }

  if (bingVerification) {
    html = html.replace('</head>', `    <meta name="msvalidate.01" content="${escapeAttr(bingVerification)}" />\n  </head>`)
  }

  const graph =
    structuredData.length > 1
      ? { '@context': 'https://schema.org', '@graph': structuredData.map(stripContext) }
      : structuredData[0]

  if (graph) {
    html = html.replace(
      '</head>',
      `    <script type="application/ld+json" id="extreme-heat-watch-prerender-schema">${JSON.stringify(graph)}</script>\n  </head>`,
    )
  }

  return html
}

function upsertMeta(html, attrName, attrValue, content) {
  const escapedAttrValue = escapeRegExp(attrValue)
  const pattern = new RegExp(`<meta\\s+${attrName}="${escapedAttrValue}"\\s+content="[^"]*"\\s*\\/?>`, 's')
  const replacement = `<meta ${attrName}="${escapeAttr(attrValue)}" content="${escapeAttr(content)}" />`
  if (pattern.test(html)) return html.replace(pattern, replacement)
  return html.replace('</head>', `    ${replacement}\n  </head>`)
}

function stripContext(item) {
  const { '@context': _context, ...rest } = item
  return rest
}

function buildHomePrerender() {
  return `
    <main class="ehw-main">
      <section class="ehw-hero">
        <div class="ehw-hero-copy">
          <p class="ehw-eyebrow">Heat compliance scheduling for high-risk days</p>
          <h1>Extreme Heat Watch for crews, campuses, and live events.</h1>
          <p class="ehw-lede">Build heat-ready schedules, send role-specific risk notices, and keep OSHA and state-rule reminders close to the people making staffing calls.</p>
          <p><a class="ehw-button ehw-button-heat" href="#pricing">Choose Pro annual</a></p>
        </div>
        <section class="ehw-watch-card">
          <p class="ehw-eyebrow">Operations watch desk</p>
          <h2>Turn a heat alert into a staffing plan before the day gets away from you.</h2>
        </section>
      </section>
    </main>`
}

function buildGuidePrerender(page) {
  const sections = page.sections
    .map(
      (section) => `
        <section>
          <h2>${escapeHtml(section.heading)}</h2>
          ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n')}
          ${section.bullets?.length ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>` : ''}
        </section>`,
    )
    .join('\n')
  const faqs = page.faqs
    .map((faq) => `<article><h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p></article>`)
    .join('\n')

  return `
    <main class="ehw-main">
      <article class="ehw-article">
        <a class="ehw-back-link" href="/">Back to Extreme Heat Watch</a>
        <p class="ehw-eyebrow">${escapeHtml(page.eyebrow)}</p>
        <h1>${escapeHtml(page.h1)}</h1>
        <p class="ehw-lede">${escapeHtml(page.lede)}</p>
        <div class="ehw-intent-box"><strong>Best for</strong><span>${escapeHtml(page.intent)}</span></div>
        ${sections}
        <section>
          <h2>Quick answers</h2>
          ${faqs}
        </section>
        <aside class="ehw-article-cta">
          <div>
            <p class="ehw-eyebrow">Next step</p>
            <h2>Put the alert into a schedule while the context is fresh.</h2>
            <p>Start with the default Operations Watch annual plan and build a heat-day workflow for your real staff.</p>
          </div>
          <a class="ehw-button ehw-button-heat" href="/#pricing">See recommended plan</a>
        </aside>
      </article>
    </main>`
}

function buildLegalPrerender(title, description) {
  return `
    <main class="ehw-main">
      <article class="ehw-article">
        <a class="ehw-back-link" href="/">Back to Extreme Heat Watch</a>
        <h1>${escapeHtml(title)}</h1>
        <p class="ehw-lede">${escapeHtml(description)}</p>
      </article>
    </main>`
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, '&#96;')
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
