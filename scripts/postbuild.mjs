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

const privacySections = [
  ['Last updated', ['May 8, 2026.']],
  [
    'Information we collect',
    [
      'We may collect account contact details, billing metadata, workspace settings, locations you choose to monitor, roles, schedules, notification categories, support messages, and basic device or usage data needed to operate the service.',
      'Do not submit private medical information, student education records, child personal information, Social Security numbers, passwords, credentials, or regulated health data unless a separate written agreement expressly allows it.',
    ],
  ],
  [
    'Payments',
    [
      'Payments are handled through Creem hosted checkout. We do not store full payment card numbers. We receive payment metadata needed to confirm purchases, provide support, handle renewals, and maintain business records.',
    ],
  ],
  [
    'Measurement',
    ['We send simple first-party events such as page views, pricing intent, and checkout starts. We do not use third-party advertising cookies on this site.'],
  ],
  [
    'How we use information',
    [
      'We use information to provide the service, process payments, secure the site, troubleshoot issues, improve product flows, respond to support requests, enforce our Terms, and comply with legal obligations.',
    ],
  ],
  [
    'Sharing',
    [
      'We may share information with hosting, payment, analytics, security, and support providers that help us operate the service; with professional advisors; during a business transaction; or when required to protect rights, safety, or comply with law. We do not sell personal information for money or share it for cross-context behavioral advertising.',
    ],
  ],
  [
    'Retention and security',
    [
      'We keep information only as long as reasonably needed, unless a longer period is required for legal, tax, accounting, security, or dispute purposes. We use reasonable safeguards, but no internet service can promise perfect security.',
    ],
  ],
  ['Your choices', ['You may request access, correction, deletion, or other privacy rights that apply in your jurisdiction by contacting support@aigeamy.com.']],
  ['Contact', ['Privacy questions and requests should be sent to support@aigeamy.com.']],
]

const termsSections = [
  ['Last updated', ['May 8, 2026.']],
  [
    'Agreement and authority',
    [
      'These Terms are a binding agreement between the customer using Extreme Heat Watch and the operator of the service. If you use the service for an organization, you represent that you have authority to bind that organization.',
    ],
  ],
  [
    'Service scope',
    ['Plans cover heat-day schedule planning, notification workflows, rule reminders, and operational checklists. The service is planning support and does not provide legal, medical, or emergency services.'],
  ],
  [
    'Customer responsibility',
    [
      'You are responsible for your worksites, events, schools, policies, staff instructions, emergency response, regulatory compliance, and final decisions. You must review all outputs before use and confirm them against official alerts, applicable law, contracts, collective bargaining obligations, insurance requirements, and your own safety procedures.',
    ],
  ],
  [
    'Official guidance',
    [
      'National Weather Service alerts, OSHA resources, state-plan rules, and local emergency instructions should control final decisions. Extreme Heat Watch is not a weather authority, law firm, medical provider, emergency dispatcher, insurer, or compliance auditor.',
    ],
  ],
  [
    'No prohibited data',
    [
      'Do not upload regulated health data, private medical details, student education records, child personal information, passwords, credentials, government identifiers, or other sensitive data unless we have signed a separate written agreement specifically allowing that use.',
    ],
  ],
  [
    'Payments',
    [
      'Plan payment happens in a Creem hosted checkout popup and returns to the homepage after completion. Fees are due as shown at checkout and are non-refundable except where required by law or expressly stated in a signed order.',
    ],
  ],
  [
    'No warranties',
    [
      'The service is provided as is and as available. To the maximum extent permitted by law, we disclaim all warranties, including implied warranties of merchantability, fitness for a particular purpose, non-infringement, uninterrupted availability, accuracy, and any guarantee that use of the service will prevent injury, loss, citation, penalty, regulatory action, claim, or incident.',
    ],
  ],
  [
    'Limitation of liability',
    [
      'To the maximum extent permitted by law, we will not be liable for indirect, incidental, special, consequential, exemplary, punitive, lost-profit, lost-revenue, lost-data, business interruption, personal injury, property damage, regulatory penalty, or third-party claims arising from use of the service. Our total liability for any claim is limited to the greater of one hundred dollars or the amount you paid for the service during the three months before the event giving rise to the claim.',
    ],
  ],
  [
    'Indemnity',
    [
      'You will defend, indemnify, and hold us harmless from claims, damages, losses, liabilities, penalties, costs, and expenses arising from your operations, schedules, notices, decisions, data, legal compliance, misuse of the service, or breach of these Terms.',
    ],
  ],
  [
    'Disputes',
    [
      'These Terms are governed by Delaware law, excluding conflict-of-law rules. Any dispute must be resolved individually through binding arbitration under the AAA Commercial Arbitration Rules, except that either party may seek injunctive relief or use small claims court where available. Class actions, class arbitration, representative actions, and jury trials are waived to the maximum extent permitted by law.',
    ],
  ],
  [
    'Changes and termination',
    [
      'We may update the service or these Terms, suspend access, or terminate accounts that create risk, violate these Terms, abuse checkout or support, or use the service in a way that could harm people, systems, or legal compliance.',
    ],
  ],
  ['Contact', ['Questions about these Terms should be sent to support@aigeamy.com.']],
]

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
    'Extreme Heat Watch keeps planning data focused on operations, uses limited first-party measurement, and avoids collecting sensitive personal details that are not needed for heat-day scheduling.',
    privacySections,
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
    'By using Extreme Heat Watch, you agree to use official alerts, your own policies, and qualified advisors for final safety and compliance decisions.',
    termsSections,
  ),
  structuredData: [],
})

await writeStaticPage('/checkout/done', {
  title: `Checkout Complete | ${siteName}`,
  description: 'Your Extreme Heat Watch checkout is finishing.',
  robots: 'noindex,nofollow',
  canonicalPath: '/checkout/done',
  rootHtml: buildLegalPrerender('Returning to Extreme Heat Watch...', 'Your payment is complete and the homepage is reopening.', []),
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
    </main>
    ${buildFooterPrerender()}`
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
    </main>
    ${buildFooterPrerender()}`
}

function buildLegalPrerender(title, description, sections) {
  const sectionHtml = sections
    .map(
      ([heading, paragraphs]) => `
        <section>
          <h2>${escapeHtml(heading)}</h2>
          ${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n')}
        </section>`,
    )
    .join('\n')

  return `
    <main class="ehw-main">
      <article class="ehw-article">
        <a class="ehw-back-link" href="/">Back to Extreme Heat Watch</a>
        <h1>${escapeHtml(title)}</h1>
        <p class="ehw-lede">${escapeHtml(description)}</p>
        ${sectionHtml}
      </article>
    </main>
    ${buildFooterPrerender()}`
}

function buildFooterPrerender() {
  return `
    <footer class="ehw-footer">
      <div>
        <strong>Extreme Heat Watch</strong>
        <span>Heat compliance scheduling, risk notices, and rule reminders for teams that operate in public heat.</span>
      </div>
      <nav aria-label="Footer">
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/excessive-heat-warning-what-to-do">Warning actions</a>
        <a href="mailto:support@aigeamy.com">support@aigeamy.com</a>
      </nav>
    </footer>`
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
