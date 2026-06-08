import { findKeywordPageByPath, normalizePath } from '../content/guide-pages.js'

const origin = 'https://extremeheatwatch.site'
const siteName = 'Extreme Heat Watch'

const routeSeo = {
  '/': {
    title: 'Extreme Heat Watch - Heat Compliance Scheduling and Risk Alerts',
    description:
      'Plan heat compliance scheduling, risk notifications, OSHA and state rule reminders, staffing alerts, and event readiness for field teams and venues.',
  },
  '/privacy': {
    title: `Privacy | ${siteName}`,
    description: 'How Extreme Heat Watch handles operations data, payment metadata, support messages, and first-party analytics.',
  },
  '/terms': {
    title: `Terms | ${siteName}`,
    description: 'Terms for using Extreme Heat Watch scheduling, notifications, rule reminders, and hosted checkout.',
  },
  '/checkout/done': {
    title: `Checkout Complete | ${siteName}`,
    description: 'Your Extreme Heat Watch checkout is finishing.',
    robots: 'noindex,nofollow',
  },
}

export function syncSeo(pathname) {
  const normalized = normalizePath(pathname)
  const guidePage = findKeywordPageByPath(normalized)
  const page = guidePage
    ? {
        title: `${guidePage.title} | ${siteName}`,
        description: guidePage.description,
      }
    : routeSeo[normalized] || {
        title: `Page Not Found | ${siteName}`,
        description: 'The requested Extreme Heat Watch page was not found.',
        robots: 'noindex,nofollow',
      }

  document.title = page.title
  setMeta('name', 'description', page.description)
  setMeta('name', 'robots', page.robots || 'index,follow')
  setMeta('property', 'og:title', page.title)
  setMeta('property', 'og:description', page.description)
  setMeta('property', 'og:url', `${origin}${normalized === '/' ? '/' : normalized}`)
  setMeta('name', 'twitter:title', page.title)
  setMeta('name', 'twitter:description', page.description)
  setCanonical(`${origin}${normalized === '/' ? '/' : normalized}`)
}

function setMeta(attributeName, attributeValue, content) {
  let tag = document.head.querySelector(`meta[${attributeName}="${attributeValue}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attributeName, attributeValue)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setCanonical(href) {
  let link = document.head.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}
