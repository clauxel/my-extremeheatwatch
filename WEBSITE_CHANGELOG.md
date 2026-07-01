# Website Changelog

## 2026-06-25 - Cloudflare route repair attempt

- Ran local tests and production build successfully while investigating the live `extremeheatwatch.site` checkout failure.
- Created the Cloudflare zone, deployed Worker/Assets version `2e880463-465f-4d0a-8334-defac8c61822`, and bound apex/www Worker routes.
- Production custom-domain activation is blocked because Spaceship rejected the nameserver update: the domain is locked to prevent or mitigate abusive activity.
- Payment click status remains `production_blocked_registrar_locked` until the registrar lock is cleared and nameservers can be set to the Cloudflare zone.

## 2026-06-03 - Sitemap canonical cleanup

- Rechecking and redeploying Cloudflare Worker/Assets after HTTPS fetch failures on the canonical host.
- Deployment: pending Worker redeploy and live recheck.

## 2026-06-08 16:06:51 CST - SEO/GEO + Build Checklist Repair

Scope: repaired P0/P1 checklist issues for extremeheatwatch.site.

Touched files:
  - extremeheatwatch/dist/index.html
  - extremeheatwatch/dist/robots.txt

Verification: ran the shared SEO/GEO patrol fixer from the latest all-sites checklist input; 9router build also passed after shared route guard changes.

Deploy/Git status: pending commit, push, deploy, and post-deploy checklist rerun.

Follow-ups: re-run the all-sites SEO/GEO + build checklist after production deployment and keep any DNS/account-only blockers in the issue ledger.

## 2026-07-01 - MiroFish contextual reference

- Added one contextual related-resource link to MiroFish AI Simulator with UTM tracking for extremeheatwatch.site.
- Placement rule: secondary Resources/Source context when available, otherwise the homepage tail; no hero, nav, pricing, checkout, or primary CTA links were changed.
- SEO safety: brand anchor only, one link per canonical site surface, visible editorial context, and no keyword-stuffed footer/sitewide block.
- Verification pending: run the site build/deploy workflow and live link checks after all portfolio edits are applied.
