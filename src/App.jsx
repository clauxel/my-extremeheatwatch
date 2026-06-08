import { useEffect, useMemo, useState } from 'react'

import { findKeywordPageByPath, guidePages, normalizePath } from './content/guide-pages.js'
import { trackEvent } from './lib/analytics.js'
import { syncSeo } from './lib/seo.js'

const defaultOrigin = 'https://extremeheatwatch.site'
const annualMultiplier = 0.5

const plans = [
  {
    id: 'starter',
    name: 'Heat Desk',
    label: 'Starter',
    monthlyUsd: 149,
    tagline: 'For one location that needs a cleaner heat-day playbook.',
    bullets: ['One operating location', 'Daily watch summary', 'Basic shift rotation templates', 'Email support'],
  },
  {
    id: 'pro',
    name: 'Operations Watch',
    label: 'Pro',
    monthlyUsd: 299,
    tagline: 'The default plan for schools, worksites, and event teams with live staffing decisions.',
    popular: true,
    bullets: ['Five locations or events', 'Role-based risk notifications', 'OSHA and state rule reminders', 'Supervisor handoff notes'],
  },
  {
    id: 'scale',
    name: 'Command Center',
    label: 'Scale',
    monthlyUsd: 799,
    tagline: 'For portfolios coordinating heat policy across many crews, campuses, or venues.',
    bullets: ['Twenty monitored locations', 'Multi-state rule matrix', 'Executive compliance digest', 'Priority onboarding'],
  },
]

const operatingModes = [
  {
    id: 'enterprise',
    label: 'Enterprise crew',
    copy: 'Outdoor labor, warehouses, logistics, field service, and mixed indoor/outdoor crews.',
  },
  {
    id: 'school',
    label: 'School day',
    copy: 'Athletics, recess, transportation, maintenance, and after-school programs.',
  },
  {
    id: 'event',
    label: 'Live event',
    copy: 'Gates, queues, staff posts, vendors, medical tents, and guest communications.',
  },
]

const proof = [
  { value: '50%', label: 'annual savings selected' },
  { value: '5 min', label: 'first schedule pass' },
  { value: '3 roles', label: 'ops, safety, comms' },
  { value: '24/7', label: 'watch-to-warning context' },
]

const riskBands = {
  advisory: {
    label: 'Heat advisory posture',
    score: 64,
    action: 'Shorten strenuous blocks, confirm water/rest access, and prepare escalation messages.',
    severity: 'watch',
  },
  watch: {
    label: 'Extreme heat watch posture',
    score: 78,
    action: 'Lock rotations before staffing starts, notify supervisors, and pre-stage shaded recovery areas.',
    severity: 'risk',
  },
  warning: {
    label: 'Excessive heat warning posture',
    score: 91,
    action: 'Move high-exertion work earlier, reduce exposure windows, and assign a visible heat lead.',
    severity: 'danger',
  },
}

function CheckoutDoneBridge() {
  useEffect(() => {
    const origin = window.location.origin
    if (window.opener) {
      try {
        window.opener.postMessage({ type: 'extremeheatwatch-checkout-complete' }, origin)
      } catch {
        /* The opener may be gone. */
      }
      window.close()
      return
    }
    window.location.replace(`${origin}/?payment=success`)
  }, [])

  return (
    <main className="ehw-main">
      <section className="ehw-centered">
        <p className="ehw-eyebrow">Checkout</p>
        <h1>Returning to Extreme Heat Watch...</h1>
        <p>Your payment is complete and the homepage is reopening.</p>
      </section>
    </main>
  )
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}

function readJson(response) {
  return response.text().then((text) => {
    if (!text.trim()) return null
    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  })
}

function openCenteredCheckoutWindow() {
  const width = 560
  const height = 760
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2))
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2))
  const popup = window.open(
    'about:blank',
    'extreme-heat-watch-creem-checkout',
    `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
  )

  if (popup) {
    try {
      popup.document.title = 'Opening secure checkout'
      popup.document.body.innerHTML =
        '<main style="min-height:100vh;display:grid;place-items:center;background:#081816;color:#f5fff4;font-family:Arial,sans-serif;text-align:center;padding:28px"><section><h1 style="font-size:22px;margin:0 0 8px">Opening secure checkout...</h1><p style="margin:0;color:#c8e9df">Your Creem payment window is being prepared.</p></section></main>'
    } catch {
      /* A named popup may already be cross-origin; assigning location still works. */
    }
  }

  return popup
}

function sendPopupToCheckout(popup, url) {
  if (!popup || popup.closed) return false
  try {
    popup.location.replace(url)
    popup.focus()
    return true
  } catch {
    return false
  }
}

function useRoute() {
  const [path, setPath] = useState(() => window.location.pathname)
  const [search, setSearch] = useState(() => window.location.search)

  function navigate(to) {
    const url = new URL(to, window.location.origin)
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`)
    setPath(url.pathname)
    setSearch(url.search)

    if (url.hash) {
      const scrollToHash = () => document.querySelector(url.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      requestAnimationFrame(scrollToHash)
      window.setTimeout(scrollToHash, 80)
      return
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    function onPop() {
      setPath(window.location.pathname)
      setSearch(window.location.search)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return { path, search, navigate }
}

function buildPlanPreview(mode, trigger, headcount) {
  const band = riskBands[trigger] || riskBands.watch
  const people = Math.max(12, Number(headcount) || 90)
  const breakCycle = trigger === 'warning' ? '20 on / 20 recovery' : trigger === 'watch' ? '30 on / 20 recovery' : '45 on / 15 recovery'
  const notificationCount = trigger === 'warning' ? 5 : trigger === 'watch' ? 4 : 3
  const modeCopy = operatingModes.find((item) => item.id === mode)?.copy || operatingModes[0].copy

  return {
    ...band,
    people,
    breakCycle,
    notificationCount,
    modeCopy,
    staffing: Math.ceil(people / (trigger === 'warning' ? 18 : trigger === 'watch' ? 24 : 32)),
    reminders:
      mode === 'school'
        ? ['Athletics and outdoor PE review', 'Bus line hydration checkpoint', 'Guardian-facing delay language']
        : mode === 'event'
          ? ['Gate and queue cooling check', 'Vendor and security rotation sync', 'Guest heat message before arrival']
          : ['Supervisor heat lead assigned', 'New worker acclimatization flag', 'High-exertion work moved earlier'],
  }
}

export default function App() {
  const route = useRoute()
  const normalizedPath = normalizePath(route.path)
  const guidePage = findKeywordPageByPath(normalizedPath)
  const [publicOrigin, setPublicOrigin] = useState(defaultOrigin)
  const [headerTight, setHeaderTight] = useState(() => window.scrollY > 10)
  const [billing, setBilling] = useState('annual')
  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [mode, setMode] = useState('event')
  const [trigger, setTrigger] = useState('watch')
  const [headcount, setHeadcount] = useState(180)
  const [checkout, setCheckout] = useState(null)
  const [checkoutLoadingKey, setCheckoutLoadingKey] = useState('')
  const preview = useMemo(() => buildPlanPreview(mode, trigger, headcount), [mode, trigger, headcount])

  useEffect(() => {
    syncSeo(normalizedPath)
    trackEvent('page_view', { route: normalizedPath })
  }, [normalizedPath])

  useEffect(() => {
    let cancelled = false
    fetch('/api/runtime')
      .then(readJson)
      .then((payload) => {
        if (!cancelled && payload?.publicAppOrigin) setPublicOrigin(payload.publicAppOrigin)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function onScroll() {
      setHeaderTight(window.scrollY > 10)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const allowed = new Set([window.location.origin, new URL(publicOrigin).origin])
    function onMessage(event) {
      if (!allowed.has(event.origin)) return
      if (event.data?.type === 'extremeheatwatch-checkout-complete') {
        setCheckout(null)
        route.navigate('/?payment=success')
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [publicOrigin, route])

  async function startCheckout(planId = 'pro', cycle = billing, loadingKey = `checkout-${planId}-${cycle}`, provider = 'creem') {
    setSelectedPlan(planId)
    setBilling(cycle)
    setCheckoutLoadingKey(loadingKey)
    setCheckout({ status: 'loading', planId, billing: cycle, loadingKey })
    trackEvent('checkout_started', { planId, billing: cycle })

    const popup = openCenteredCheckoutWindow()

    try {
      const response = await fetch(provider === 'nowpayments' ? '/api/nowpayments-checkout' : '/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billing: cycle }),
      })
      const payload = await readJson(response)
      if (!response.ok || !payload?.ok || !payload.checkoutUrl) {
        throw new Error(payload?.error || 'Checkout could not be created.')
      }
      sendPopupToCheckout(popup, payload.checkoutUrl)
      setCheckout({ status: 'popup', planId, billing: cycle, checkoutUrl: payload.checkoutUrl, loadingKey })
      trackEvent('checkout_popup_opened', { planId, billing: cycle })
    } catch (error) {
      try {
        if (popup && !popup.closed) popup.close()
      } catch {
        /* Nothing to close. */
      }
      setCheckout({
        status: 'error',
        planId,
        billing: cycle,
        loadingKey,
        error: error instanceof Error ? error.message : 'Checkout could not be created.',
      })
      trackEvent('checkout_error', { planId, billing: cycle })
    } finally {
      setCheckoutLoadingKey('')
    }
  }

  function headerLink(to) {
    return (event) => {
      event.preventDefault()
      route.navigate(to)
    }
  }

  function goToPricing() {
    setBilling('annual')
    setSelectedPlan('pro')
    route.navigate('/#pricing')
    const scrollToRecommendedPlan = () =>
      document.querySelector('.ehw-plan-card[data-popular="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    requestAnimationFrame(scrollToRecommendedPlan)
    window.setTimeout(scrollToRecommendedPlan, 120)
    window.setTimeout(scrollToRecommendedPlan, 420)
  }

  function renderHeader() {
    return (
      <header className={`ehw-header${headerTight ? ' is-tight' : ''}`}>
        <div className="ehw-header-inner">
          <a className="ehw-brand" href="/" onClick={headerLink('/')}>
            <span className="ehw-brand-mark" aria-hidden="true">
              <span />
            </span>
            <span>Extreme Heat Watch</span>
          </a>
          <nav className="ehw-nav" aria-label="Primary">
            <a href="/#watch-desk" onClick={headerLink('/#watch-desk')}>
              Watch desk
            </a>
            <a href="/#rules" onClick={headerLink('/#rules')}>
              Rules
            </a>
            <a href="/#pricing" onClick={headerLink('/#pricing')}>
              Pricing
            </a>
            <a href="/extreme-heat-watch-today" onClick={headerLink('/extreme-heat-watch-today')}>
              Today guide
            </a>
          </nav>
          <button
            className="ehw-button ehw-button-soft ehw-header-cta"
            type="button"
            onClick={goToPricing}
            disabled={Boolean(checkoutLoadingKey)}
          >
            View Pro annual
          </button>
        </div>
      </header>
    )
  }

  function renderWatchDesk() {
    return (
      <section className="ehw-watch-card" id="watch-desk" aria-label="Heat compliance schedule preview">
        <div className="ehw-watch-top">
          <div>
            <p className="ehw-eyebrow">Operations watch desk</p>
            <h2>Turn a heat alert into a staffing plan before the day gets away from you.</h2>
          </div>
          <span className={`ehw-risk-pill is-${preview.severity}`}>{preview.label}</span>
        </div>

        <div className="ehw-control-grid">
          <label>
            Operation
            <select value={mode} onChange={(event) => setMode(event.target.value)}>
              {operatingModes.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Forecast trigger
            <select value={trigger} onChange={(event) => setTrigger(event.target.value)}>
              <option value="advisory">Heat Advisory</option>
              <option value="watch">Extreme Heat Watch</option>
              <option value="warning">Excessive Heat Warning</option>
            </select>
          </label>
          <label>
            People exposed
            <input
              inputMode="numeric"
              value={headcount}
              onChange={(event) => setHeadcount(event.target.value.replace(/[^\d]/g, '').slice(0, 5))}
            />
          </label>
        </div>

        <div className="ehw-score-row">
          <div className="ehw-score-ring" style={{ '--score': preview.score }}>
            <strong>{preview.score}</strong>
            <span>risk</span>
          </div>
          <div>
            <p className="ehw-result-title">{preview.action}</p>
            <p className="ehw-muted">{preview.modeCopy}</p>
          </div>
        </div>

        <div className="ehw-output-grid">
          {[
            ['Rotation rhythm', preview.breakCycle],
            ['Supervisor groups', `${preview.staffing} active groups`],
            ['Notifications', `${preview.notificationCount} targeted sends`],
          ].map(([title, value]) => (
            <article className="ehw-output-card" key={title}>
              <span>{title}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>

        <div className="ehw-risk-panel">
          <div>
            <strong>What Operations Watch reminds the team to do</strong>
            <p>Use official alerts for decisions, then make the operational steps hard to miss.</p>
          </div>
          <ul>
            {preview.reminders.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="ehw-next-actions">
          <button
            className="ehw-button ehw-button-heat"
            type="button"
            onClick={goToPricing}
            disabled={Boolean(checkoutLoadingKey)}
          >
            See the selected plan
          </button>
          <button
            className="ehw-link-button"
            type="button"
            onClick={() => startCheckout('pro', 'annual', 'preview-pro-annual')}
            disabled={Boolean(checkoutLoadingKey)}
          >
            {checkoutLoadingKey === 'preview-pro-annual' ? 'Opening checkout...' : 'Checkout Pro annual'}
          </button>
        </div>
      </section>
    )
  }

  function renderHome() {
    const paymentSuccess = new URLSearchParams(route.search).get('payment') === 'success'

    return (
      <main className="ehw-main">
        {paymentSuccess ? <div className="ehw-success">Payment received. You are back on the homepage and onboarding can begin.</div> : null}

        <section className="ehw-hero">
          <div className="ehw-hero-copy">
            <p className="ehw-eyebrow">Heat compliance scheduling for high-risk days</p>
            <h1>Extreme Heat Watch for crews, campuses, and live events.</h1>
            <p className="ehw-lede">
              Build heat-ready schedules, send role-specific risk notices, and keep OSHA and state-rule reminders close to the
              people making staffing calls.
            </p>
            <div className="ehw-hero-actions">
              <button className="ehw-button ehw-button-heat" type="button" onClick={goToPricing}>
                Choose Pro annual
              </button>
              <a className="ehw-button ehw-button-ice" href="/extreme-heat-watch-meaning" onClick={headerLink('/extreme-heat-watch-meaning')}>
                What alerts mean
              </a>
            </div>
            <div className="ehw-trust-row">
              <span>Pro selected by default</span>
              <span>Annual saves 50%</span>
              <span>Creem checkout opens in place</span>
            </div>
          </div>

          {renderWatchDesk()}
        </section>

        <section className="ehw-proof-strip" aria-label="Extreme Heat Watch proof">
          {proof.map((item) => (
            <article key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </section>

        <section className="ehw-section ehw-split">
          <div>
            <p className="ehw-eyebrow">Why teams buy before the first dangerous week</p>
            <h2>Heat risk becomes expensive when the forecast is clear but the schedule is not.</h2>
          </div>
          <div className="ehw-copy-stack">
            <p>
              Extreme heat decisions rarely fail because no one saw the warning. They fail because rotations, thresholds, parent
              messages, contractor rules, and supervisor ownership are still scattered when people arrive.
            </p>
            <p>
              Extreme Heat Watch keeps that work in one place: forecast posture, exposure roles, rule reminders, and the exact
              message each operator needs before heat becomes an incident.
            </p>
          </div>
        </section>

        <section className="ehw-section" id="rules">
          <div className="ehw-section-head">
            <p className="ehw-eyebrow">What the service coordinates</p>
            <h2>Built for the messy handoff between weather, compliance, and staffing.</h2>
          </div>
          <div className="ehw-feature-grid">
            {[
              ['Heat-day scheduling', 'Generate work/rest blocks, staffing groups, arrival windows, and contingency tasks by alert posture.'],
              ['Risk notifications', 'Send clear messages to supervisors, coaches, vendors, contractors, and incident leads without long email threads.'],
              ['OSHA and state reminders', 'Surface water, rest, shade, acclimatization, training, and state-plan prompts in the workflow.'],
              ['Event and school playbooks', 'Translate public heat products into gate, queue, athletics, transportation, and dismissal decisions.'],
            ].map(([title, body]) => (
              <article className="ehw-feature-card" key={title}>
                <span aria-hidden="true" />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        {renderPricing()}

        <section className="ehw-section">
          <div className="ehw-section-head">
            <p className="ehw-eyebrow">Useful heat alert guides</p>
            <h2>Plain-language pages your operations team can actually use.</h2>
          </div>
          <div className="ehw-guide-grid">
            {guidePages.map((page) => (
              <a className="ehw-guide-card" href={page.path} key={page.path} onClick={headerLink(page.path)}>
                <span>{page.eyebrow}</span>
                <strong>{page.h1}</strong>
                <p>{page.intent}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="ehw-section ehw-source-note">
          <div>
            <p className="ehw-eyebrow">Official alerts still lead</p>
            <h2>A planning workspace, not a replacement for public warnings.</h2>
            <p>
              Use National Weather Service alerts, local emergency management guidance, OSHA resources, and your own legal and
              safety advisors for final decisions. Extreme Heat Watch helps teams act on that guidance faster.
            </p>
          </div>
          <div className="ehw-source-links">
            <a href="https://www.weather.gov/safety/heat" target="_blank" rel="noreferrer">
              NWS heat safety
            </a>
            <a href="https://www.osha.gov/heat-exposure" target="_blank" rel="noreferrer">
              OSHA heat exposure
            </a>
          </div>
        </section>
      </main>
    )
  }

  function renderPricing() {
    return (
      <section className="ehw-section ehw-pricing" id="pricing">
        <div className="ehw-pricing-head">
          <div>
            <p className="ehw-eyebrow">Pricing</p>
            <h2>Operations Watch annual is selected because heat compliance is seasonal work before it is urgent.</h2>
            <p>Annual billing is the default and is 50% less than paying month to month.</p>
          </div>
          <div className="ehw-toggle" role="group" aria-label="Billing cycle">
            <button type="button" data-active={billing === 'monthly'} onClick={() => setBilling('monthly')}>
              Monthly
            </button>
            <button type="button" data-active={billing === 'annual'} onClick={() => setBilling('annual')}>
              Annual - 50% less
            </button>
          </div>
        </div>
        <div className="ehw-plan-grid">
          {plans.map((plan) => {
            const effective = billing === 'annual' ? plan.monthlyUsd * annualMultiplier : plan.monthlyUsd
            const loadingKey = `plan-${plan.id}-${billing}`
            return (
              <article className="ehw-plan-card" data-popular={plan.popular ? 'true' : 'false'} key={plan.id}>
                {plan.popular ? <span className="ehw-plan-badge">Default choice</span> : null}
                <h3>{plan.name}</h3>
                <p>{plan.tagline}</p>
                <div className="ehw-price">
                  <strong>{formatMoney(effective)}</strong>
                  <span>/mo</span>
                  {billing === 'annual' ? <del>{formatMoney(plan.monthlyUsd)}</del> : null}
                </div>
                <small>{billing === 'annual' ? `${formatMoney(effective * 12)} billed annually` : 'Billed monthly'}</small>
                <ul>
                  {plan.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <button
                  className={plan.popular ? 'ehw-button ehw-button-heat' : 'ehw-button ehw-button-dark'}
                  type="button"
                  onMouseEnter={() => setSelectedPlan(plan.id)}
                  onFocus={() => setSelectedPlan(plan.id)}
                  onClick={() => startCheckout(plan.id, billing, loadingKey)}
                  disabled={Boolean(checkoutLoadingKey)}
                >
                  {checkoutLoadingKey === loadingKey ? 'Opening checkout...' : `Checkout ${plan.label} ${billing}`}
                </button>
                <button
                  className="ehw-button ehw-button-dark"
                  type="button"
                  onMouseEnter={() => setSelectedPlan(plan.id)}
                  onFocus={() => setSelectedPlan(plan.id)}
                  onClick={() => startCheckout(plan.id, billing, `${loadingKey}-wallet`, 'nowpayments')}
                  disabled={Boolean(checkoutLoadingKey)}
                >
                  {checkoutLoadingKey === `${loadingKey}-wallet` ? 'Opening USDC wallet...' : 'Pay with USDC Wallet'}
                </button>
                {selectedPlan === plan.id ? <span className="ehw-selected">Selected</span> : null}
              </article>
            )
          })}
        </div>
      </section>
    )
  }

  function renderGuidePage(page) {
    return (
      <main className="ehw-main">
        <article className="ehw-article">
          <a className="ehw-back-link" href="/" onClick={headerLink('/')}>
            Back to Extreme Heat Watch
          </a>
          <p className="ehw-eyebrow">{page.eyebrow}</p>
          <h1>{page.h1}</h1>
          <p className="ehw-lede">{page.lede}</p>
          <div className="ehw-intent-box">
            <strong>Best for</strong>
            <span>{page.intent}</span>
          </div>
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
          <section>
            <h2>Quick answers</h2>
            <div className="ehw-faq-grid">
              {page.faqs.map((faq) => (
                <article key={faq.question}>
                  <h3>{faq.question}</h3>
                  <p>{faq.answer}</p>
                </article>
              ))}
            </div>
          </section>
          <aside className="ehw-article-cta">
            <div>
              <p className="ehw-eyebrow">Next step</p>
              <h2>Put the alert into a schedule while the context is fresh.</h2>
              <p>Start with the default Operations Watch annual plan and build a heat-day workflow for your real staff.</p>
            </div>
            <button className="ehw-button ehw-button-heat" type="button" onClick={goToPricing}>
              See recommended plan
            </button>
          </aside>
        </article>
      </main>
    )
  }

  function renderPrivacy() {
    return (
      <main className="ehw-main">
        <article className="ehw-article">
          <p className="ehw-eyebrow">Privacy</p>
          <h1>Privacy Policy</h1>
          <p className="ehw-lede">
            Extreme Heat Watch keeps planning data focused on operations, uses limited first-party measurement, and avoids collecting
            sensitive personal details that are not needed for heat-day scheduling.
          </p>
          <section>
            <h2>Last updated</h2>
            <p>May 8, 2026.</p>
            <h2>Information we collect</h2>
            <p>
              We may collect account contact details, billing metadata, workspace settings, locations you choose to monitor, roles,
              schedules, notification categories, support messages, and basic device or usage data needed to operate the service.
            </p>
            <p>
              Do not submit private medical information, student education records, child personal information, Social Security
              numbers, passwords, credentials, or regulated health data unless a separate written agreement expressly allows it.
            </p>
            <h2>Payments</h2>
            <p>
              Payments are handled through Creem hosted checkout. We do not store full payment card numbers. We receive payment
              metadata needed to confirm purchases, provide support, handle renewals, and maintain business records.
            </p>
            <h2>Measurement</h2>
            <p>
              We send simple first-party events such as page views, pricing intent, and checkout starts. We do not use third-party
              advertising cookies on this site.
            </p>
            <h2>How we use information</h2>
            <p>
              We use information to provide the service, process payments, secure the site, troubleshoot issues, improve product
              flows, respond to support requests, enforce our Terms, and comply with legal obligations.
            </p>
            <h2>Sharing</h2>
            <p>
              We may share information with hosting, payment, analytics, security, and support providers that help us operate the
              service; with professional advisors; during a business transaction; or when required to protect rights, safety, or
              comply with law. We do not sell personal information for money or share it for cross-context behavioral advertising.
            </p>
            <h2>Retention and security</h2>
            <p>
              We keep information only as long as reasonably needed for the purposes above, unless a longer period is required for
              legal, tax, accounting, security, or dispute purposes. We use reasonable technical and organizational safeguards, but no
              internet service can promise perfect security.
            </p>
            <h2>Your choices</h2>
            <p>
              You may request access, correction, deletion, or other privacy rights that apply in your jurisdiction by contacting
              support@aigeamy.com. We may verify your request and may retain information where permitted or required by law.
            </p>
            <h2>Contact</h2>
            <p>Privacy questions and requests should be sent to support@aigeamy.com.</p>
          </section>
        </article>
      </main>
    )
  }

  function renderTerms() {
    return (
      <main className="ehw-main">
        <article className="ehw-article">
          <p className="ehw-eyebrow">Terms</p>
          <h1>Terms of Service</h1>
          <p className="ehw-lede">
            By using Extreme Heat Watch, you agree to use official alerts, your own policies, and qualified advisors for final
            safety and compliance decisions.
          </p>
          <section>
            <h2>Last updated</h2>
            <p>May 8, 2026.</p>
            <h2>Agreement and authority</h2>
            <p>
              These Terms are a binding agreement between the customer using Extreme Heat Watch and the operator of the service. If
              you use the service for an organization, you represent that you have authority to bind that organization.
            </p>
            <h2>Service scope</h2>
            <p>
              Plans cover heat-day schedule planning, notification workflows, rule reminders, and operational checklists. The
              service is planning support and does not provide legal, medical, or emergency services.
            </p>
            <h2>Customer responsibility</h2>
            <p>
              You are responsible for your worksites, events, schools, policies, staff instructions, emergency response, regulatory
              compliance, and final decisions. You must review all outputs before use and confirm them against official alerts,
              applicable law, contracts, collective bargaining obligations, insurance requirements, and your own safety procedures.
            </p>
            <h2>Official guidance</h2>
            <p>
              National Weather Service alerts, OSHA resources, state-plan rules, and local emergency instructions should control
              final decisions. Extreme Heat Watch is not a weather authority, law firm, medical provider, emergency dispatcher,
              insurer, or compliance auditor.
            </p>
            <h2>No prohibited data</h2>
            <p>
              Do not upload regulated health data, private medical details, student education records, child personal information,
              passwords, credentials, government identifiers, or other sensitive data unless we have signed a separate written
              agreement specifically allowing that use.
            </p>
            <h2>Payments</h2>
            <p>
              Plan payment happens in a Creem hosted checkout popup and returns to the homepage after completion. Fees are due as
              shown at checkout and are non-refundable except where required by law or expressly stated in a signed order.
            </p>
            <h2>No warranties</h2>
            <p>
              The service is provided as is and as available. To the maximum extent permitted by law, we disclaim all warranties,
              including implied warranties of merchantability, fitness for a particular purpose, non-infringement, uninterrupted
              availability, accuracy, and any guarantee that use of the service will prevent injury, loss, citation, penalty,
              regulatory action, claim, or incident.
            </p>
            <h2>Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, we will not be liable for indirect, incidental, special, consequential,
              exemplary, punitive, lost-profit, lost-revenue, lost-data, business interruption, personal injury, property damage,
              regulatory penalty, or third-party claims arising from use of the service. Our total liability for any claim is limited
              to the greater of one hundred dollars or the amount you paid for the service during the three months before the event
              giving rise to the claim.
            </p>
            <h2>Indemnity</h2>
            <p>
              You will defend, indemnify, and hold us harmless from claims, damages, losses, liabilities, penalties, costs, and
              expenses arising from your operations, schedules, notices, decisions, data, legal compliance, misuse of the service, or
              breach of these Terms.
            </p>
            <h2>Disputes</h2>
            <p>
              These Terms are governed by Delaware law, excluding conflict-of-law rules. Any dispute must be resolved individually
              through binding arbitration under the AAA Commercial Arbitration Rules, except that either party may seek injunctive
              relief or use small claims court where available. Class actions, class arbitration, representative actions, and jury
              trials are waived to the maximum extent permitted by law.
            </p>
            <h2>Changes and termination</h2>
            <p>
              We may update the service or these Terms, suspend access, or terminate accounts that create risk, violate these Terms,
              abuse checkout or support, or use the service in a way that could harm people, systems, or legal compliance.
            </p>
            <h2>Contact</h2>
            <p>Questions about these Terms should be sent to support@aigeamy.com.</p>
          </section>
        </article>
      </main>
    )
  }

  function renderCheckoutOverlay() {
    if (!checkout) return null
    return (
      <div className="ehw-checkout-backdrop" role="presentation">
        <section className="ehw-checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
          <button className="ehw-close" type="button" aria-label="Close checkout status" onClick={() => setCheckout(null)}>
            x
          </button>
          {checkout.status === 'loading' ? (
            <>
              <p className="ehw-eyebrow">Secure checkout</p>
              <h2 id="checkout-title">Opening Creem...</h2>
              <p>The payment window is being prepared. Keep this page open.</p>
              <div className="ehw-loader" aria-hidden="true" />
            </>
          ) : checkout.status === 'popup' ? (
            <>
              <p className="ehw-eyebrow">Secure checkout</p>
              <h2 id="checkout-title">Creem checkout is open.</h2>
              <p>Finish payment in the centered popup. This page stays in place and returns home after success.</p>
              <a className="ehw-button ehw-button-dark" href={checkout.checkoutUrl} target="_blank" rel="noreferrer">
                Reopen payment window
              </a>
            </>
          ) : (
            <>
              <p className="ehw-eyebrow">Secure checkout</p>
              <h2 id="checkout-title">Checkout needs another try.</h2>
              <p>{checkout.error || 'The payment session could not be created.'}</p>
              <button
                className="ehw-button ehw-button-heat"
                type="button"
                onClick={() => startCheckout(checkout.planId, checkout.billing, checkout.loadingKey)}
              >
                Try Creem checkout again
              </button>
            </>
          )}
        </section>
      </div>
    )
  }

  function renderNotFound() {
    return (
      <main className="ehw-main">
        <section className="ehw-centered">
          <p className="ehw-eyebrow">404</p>
          <h1>That heat plan is not here.</h1>
          <button className="ehw-button ehw-button-heat" type="button" onClick={() => route.navigate('/')}>
            Return home
          </button>
        </section>
      </main>
    )
  }

  let body
  if (normalizedPath === '/') body = renderHome()
  else if (guidePage) body = renderGuidePage(guidePage)
  else if (normalizedPath === '/privacy') body = renderPrivacy()
  else if (normalizedPath === '/terms') body = renderTerms()
  else if (normalizedPath === '/checkout/done') body = <CheckoutDoneBridge />
  else body = renderNotFound()

  return (
    <div className="ehw-shell">
      {renderHeader()}
      {body}
      {renderCheckoutOverlay()}
      <footer className="ehw-footer">
        <div>
          <strong>Extreme Heat Watch</strong>
          <span>Heat compliance scheduling, risk notices, and rule reminders for teams that operate in public heat.</span>
        </div>
        <nav aria-label="Footer">
          <a href="/privacy" onClick={headerLink('/privacy')}>
            Privacy
          </a>
          <a href="/terms" onClick={headerLink('/terms')}>
            Terms
          </a>
          <a href="/excessive-heat-warning-what-to-do" onClick={headerLink('/excessive-heat-warning-what-to-do')}>
            Warning actions
          </a>
          <a href="mailto:support@aigeamy.com">support@aigeamy.com</a>
        </nav>
      </footer>
    </div>
  )
}
