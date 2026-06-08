# Website Changelog

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
