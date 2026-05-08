import assert from 'node:assert/strict'
import test from 'node:test'

import { guidePages } from '../src/content/guide-pages.js'

const requiredPages = new Map([
  ['/extreme-heat-watch-today', /Extreme heat watch today/i],
  ['/extreme-heat-watch-meaning', /Extreme heat watch meaning/i],
  ['/extreme-heat-watch-twin-cities', /Extreme heat watch Twin Cities/i],
  ['/excessive-heat-warning-meaning', /Excessive heat warning meaning/i],
  ['/heat-advisory-vs-warning', /Heat advisory vs warning/i],
  ['/excessive-heat-warning-what-to-do', /Excessive heat warning/i],
  ['/excessive-heat-warning-symptoms', /Excessive heat warning symptoms/i],
  ['/excessive-heat-warning-meaning-at-night', /Excessive heat warning meaning at night/i],
])

test('all requested heat-alert guide pages exist', () => {
  assert.equal(guidePages.length, requiredPages.size)

  for (const [path, pattern] of requiredPages) {
    const page = guidePages.find((item) => item.path === path)
    assert.ok(page, `missing ${path}`)
    assert.match(`${page.title} ${page.h1} ${page.lede}`, pattern)
    assert.ok(page.sections.length >= 2)
    assert.ok(page.faqs.length >= 2)
  }
})

test('public page copy avoids exposing internal build language', () => {
  const visibleCopy = JSON.stringify(guidePages)
  const forbidden = [new RegExp('conversion\\s+brief', 'i'), new RegExp('require' + 'ments', 'i')]

  for (const pattern of forbidden) {
    assert.doesNotMatch(visibleCopy, pattern)
  }
})
