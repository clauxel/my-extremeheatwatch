import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildRobotsTxt,
  buildSitemapXml,
  handleCheckout,
  handleReadiness,
  handleRuntime,
} from '../worker/index.js'

test('runtime returns Cloudflare deployment metadata', async () => {
  const response = handleRuntime(new URL('https://www.extremeheatwatch.site/api/runtime'))
  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.equal(payload.ok, true)
  assert.equal(payload.publicAppOrigin, 'https://www.extremeheatwatch.site')
  assert.equal(payload.paymentProvider, 'creem')
})

test('sitemap and robots include indexable heat alert pages', () => {
  const sitemap = buildSitemapXml()
  const robots = buildRobotsTxt()

  for (const path of [
    '/extreme-heat-watch-today',
    '/extreme-heat-watch-meaning',
    '/extreme-heat-watch-twin-cities',
    '/excessive-heat-warning-meaning',
    '/heat-advisory-vs-warning',
    '/excessive-heat-warning-what-to-do',
    '/excessive-heat-warning-symptoms',
    '/excessive-heat-warning-meaning-at-night',
  ]) {
    assert.match(sitemap, new RegExp(`https://extremeheatwatch\\.site${path}`))
  }

  assert.match(robots, /Sitemap: https:\/\/extremeheatwatch\.site\/sitemap\.xml/)
  assert.match(robots, /Disallow: \/api\//)
})

test('checkout validates method and payment secret', async () => {
  const getResponse = await handleCheckout(
    new Request('https://extremeheatwatch.site/api/checkout'),
    {},
    new URL('https://extremeheatwatch.site/api/checkout'),
  )
  assert.equal(getResponse.status, 405)

  const noSecretResponse = await handleCheckout(
    new Request('https://extremeheatwatch.site/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ planId: 'pro', billing: 'annual' }),
    }),
    {},
    new URL('https://extremeheatwatch.site/api/checkout'),
  )
  assert.equal(noSecretResponse.status, 503)
})

test('checkout creates Creem product and hosted checkout URL', async () => {
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), body: JSON.parse(options.body) })
    if (String(url).endsWith('/v1/products')) {
      return Response.json({ id: 'prod_extreme_heat_watch_test' })
    }
    if (String(url).endsWith('/v1/checkouts')) {
      return Response.json({ checkout_url: 'https://www.creem.io/checkout/test' })
    }
    return Response.json({ message: 'unexpected' }, { status: 500 })
  }

  try {
    const response = await handleCheckout(
      new Request('https://www.extremeheatwatch.site/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'pro', billing: 'annual' }),
      }),
      { API_PROD_KEY: 'creem_test_key' },
      new URL('https://www.extremeheatwatch.site/api/checkout'),
    )
    const payload = await response.json()

    assert.equal(response.status, 200)
    assert.equal(payload.ok, true)
    assert.equal(payload.checkoutUrl, 'https://www.creem.io/checkout/test')
    assert.equal(calls[0].body.name, 'Extreme Heat Watch Operations Watch (annual)')
    assert.equal(calls[0].body.price, 179400)
    assert.equal(calls[0].body.currency, 'USD')
    assert.equal(calls[0].body.billing_type, 'onetime')
    assert.match(calls[0].body.description, /\$149\.50\/mo/)
    assert.equal(calls[1].body.metadata.planId, 'pro')
    assert.equal(calls[1].body.metadata.billing, 'annual')
    assert.equal(calls[1].body.success_url, 'https://www.extremeheatwatch.site/checkout/done')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('planning endpoint is not offered as a free compliance review', async () => {
  const response = await handleReadiness(
    new Request('https://extremeheatwatch.site/api/readiness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/event' }),
    }),
  )
  const payload = await response.json()

  assert.equal(response.status, 402)
  assert.equal(payload.ok, false)
  assert.match(payload.error, /paid workspaces/i)
})

test('planning endpoint rejects unsupported methods', async () => {
  const response = await handleReadiness(new Request('https://extremeheatwatch.site/api/readiness'))
  assert.equal(response.status, 405)
})
