# Extreme Heat Watch

Extreme Heat Watch is a Cloudflare-first SaaS site for heat compliance scheduling, risk notifications, and OSHA/state rule reminders for enterprises, schools, and live events.

The project includes a conversion-focused homepage, useful heat-alert guide pages, Creem hosted checkout, first-party analytics events, static prerendered pages, `sitemap.xml`, `robots.txt`, Cloudflare Worker API routing, and Pages Functions compatibility.

## Local Commands

```bash
npm install
npm run test
npm run dev
```

## Cloudflare

The Worker entry is `worker/index.js` and the Pages project deploys the built `dist` directory. Store the Creem live key as the Cloudflare secret `API_PROD_KEY`.

