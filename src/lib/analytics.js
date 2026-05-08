export function trackEvent(eventName, payload = {}) {
  const event = {
    event: eventName,
    path: window.location.pathname,
    referrer: document.referrer ? new URL(document.referrer).hostname : '',
    utm: captureUtm(),
    ...payload,
  }

  const body = JSON.stringify(event)
  if (navigator.sendBeacon) {
    const ok = navigator.sendBeacon('/api/analytics', new Blob([body], { type: 'application/json' }))
    if (ok) return
  }

  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}

export function captureUtm() {
  const params = new URLSearchParams(window.location.search)
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
  const found = {}
  for (const key of keys) {
    const value = params.get(key)
    if (value) found[key] = value.slice(0, 120)
  }
  return found
}
