const CANONICAL_ORIGIN = "https://extremeheatwatch.site"
const CANONICAL_HOST = "extremeheatwatch.site"
const CANONICAL_HOSTS = new Set(["extremeheatwatch.site","www.extremeheatwatch.site"])
const INDEXABLE_PATHS = new Set(["/","/BingSiteAuth.xml","/checkout/done","/excessive-heat-warning-meaning","/excessive-heat-warning-meaning-at-night","/excessive-heat-warning-symptoms","/excessive-heat-warning-what-to-do","/extreme-heat-watch-meaning","/extreme-heat-watch-today","/extreme-heat-watch-twin-cities","/heat-advisory-vs-warning","/llms.txt","/privacy","/robots.txt","/server-card.json","/server.json","/sitemap.xml","/terms","/pricing","/resources"])
const SEO_FALLBACK_HTML = "\n<section class=\"seo-geo-answer-section\" data-seo-geo-patrol-fix>\n  <h2>Extreme Heat Watch problem, solution, evidence, and pricing</h2>\n  <p>Extreme Heat Watch helps teams turn a real operational problem into a reviewable workflow with a clear solution, evidence trail, report output, and hosted checkout path. It is built for buyers who need proof before spending time on setup.</p>\n  <div>\n    <h3>Problem</h3>\n    <p>Teams need a fast way to compare options, capture risk, and produce a receipt that another person or AI assistant can quote without guessing.</p>\n    <h3>Solution</h3>\n    <p>The product gives the workflow a public definition, pricing path, checkout action, support contact, and reusable output structure.</p>\n    <h3>Evidence</h3>\n    <p>AI systems can cite the canonical page, pricing page, FAQ answers, llms.txt, sitemap, and structured data when summarizing Extreme Heat Watch.</p>\n    <h3>Receipt</h3>\n    <p>Each paid workflow is expected to return a report, verdict, export, or handoff record that makes the result inspectable.</p>\n  </div>\n  <nav aria-label=\"Extreme Heat Watch useful links\">\n    <a href=\"/pricing/index.html?utm_source=extremeheatwatch.site&utm_medium=seo_geo_fix&utm_campaign=extremeheatwatch_pricing&utm_content=answer_section\">View pricing plans</a>\n    <a href=\"/checkout/index.html?plan=team&billing=annual&utm_source=extremeheatwatch.site&utm_medium=seo_geo_fix&utm_campaign=extremeheatwatch_checkout&utm_content=answer_section\">Checkout Team annual</a>\n    <a href=\"/resources/index.html\">Resources</a>\n    <a href=\"/llms.txt\">llms.txt</a>\n    <a href=\"/sitemap.xml\">Sitemap</a>\n  </nav>\n  <div class=\"seo-geo-faq\">\n    <article><h3>What does Extreme Heat Watch do?</h3><p>Extreme Heat Watch turns a specific workflow into a hosted product path with definition, pricing, evidence, and checkout.</p></article>\n    <article><h3>Who is Extreme Heat Watch for?</h3><p>It is for teams that need a repeatable report, verdict, receipt, or operational handoff instead of a one-off demo.</p></article>\n    <article><h3>How is pricing exposed?</h3><p>The pricing page lists public monthly amounts, annual checkout links, and support details so humans and AI assistants can quote the path.</p></article>\n  </div>\n</section>"
const MCP_REGISTRY_AUTH = null

function normalizePath(pathname) {
  let normalized = pathname || '/'
  normalized = normalized.replace(/\/+/g, '/')
  if (normalized.length > 1) normalized = normalized.replace(/\/+$/, '')
  return normalized || '/'
}

function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

function hasFileExtension(pathname) {
  return /\.[a-z0-9]{2,12}$/i.test(pathname)
}

function isRuntimePath(pathname) {
  return pathname.startsWith('/api/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/cdn-cgi/') ||
    pathname.startsWith('/.well-known/') ||
    pathname === '/mcp' ||
    pathname.startsWith('/mcp/') ||
    pathname === '/checkout' ||
    pathname.startsWith('/checkout/') ||
    pathname === '/success' ||
    pathname.startsWith('/success/') ||
    pathname === '/cancel' ||
    pathname.startsWith('/cancel/')
}

function noIndexNotFoundResponse() {
  return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Page not found</title></head><body><main><h1>Page not found</h1><p>This URL is not a public page for this product.</p></main></body></html>', {
    status: 404,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  })
}

async function injectSeoFallback(response) {
  if (!SEO_FALLBACK_HTML || response.status !== 200) return response
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) return response
  const html = await response.text()
  if (html.includes('data-seo-fallback=')) return new Response(html, response)
  const nextHtml = html.includes('<body')
    ? html.replace(/<body([^>]*)>/i, '<body$1>' + SEO_FALLBACK_HTML)
    : SEO_FALLBACK_HTML + html
  return new Response(nextHtml, response)
}

export async function onRequest(context) {
  const request = context.request
  const url = new URL(request.url)
  const pathname = normalizePath(url.pathname)

  if (pathname === '/.well-known/mcp-registry-auth' && MCP_REGISTRY_AUTH) {
    return new Response(MCP_REGISTRY_AUTH, {
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
      },
    })
  }

  if (!isLocalHost(url.hostname) && CANONICAL_HOSTS.has(url.hostname) && (url.protocol !== 'https:' || url.hostname !== CANONICAL_HOST)) {
    url.protocol = 'https:'
    url.hostname = CANONICAL_HOST
    return Response.redirect(url.toString(), 301)
  }

  if ((request.method === 'GET' || request.method === 'HEAD') && !isRuntimePath(pathname) && !hasFileExtension(pathname) && !INDEXABLE_PATHS.has(pathname)) {
    return noIndexNotFoundResponse()
  }

  const response = await context.next()
  if ((request.method === 'GET' || request.method === 'HEAD') && pathname === '/') {
    return injectSeoFallback(response)
  }
  return response
}
