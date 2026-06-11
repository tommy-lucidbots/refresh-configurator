# Lucid Refresh Pricing Configurator

Customer-facing pricing builder for the Lucid Bots Refresh subscription program. Next.js app: customers pick a tier, add capability, see a live monthly price (with optional state-tax estimate), and submit their build. On submit, the server generates a branded PDF summary and emails it to the Refresh inbox via Resend.

## Stack
- Next.js 14 (App Router)
- Resend for transactional email
- @react-pdf/renderer for server-side PDF generation

## Local development
```bash
npm install
cp .env.example .env.local   # fill in real values
npm run dev                  # http://localhost:3000
```

## Environment variables
| Var | What it is |
| --- | --- |
| `RESEND_API_KEY` | Resend API key. Reuse the Refresh Portal key or create a new one. |
| `RESEND_FROM_EMAIL` | Verified sender, e.g. `Refresh Builder <refresh@refresh.lucidbots.com>`. Domain must be verified in Resend. |
| `REFRESH_INBOX` | Destination inbox, e.g. `refresh@lucidbots.com`. |

## How submissions work
1. Customer fills name, email, phone in the "Lock in this configuration" modal.
2. The browser POSTs the config to `/api/submit`.
3. The server validates, re-computes pricing from `app/lib/data.js` (never trusts client math), generates the PDF, and emails it via Resend with the PDF attached.
4. Each submission is a separate email with a unique subject (`New Refresh build: {name} — {package}`), so they don't thread in Gmail.

## Editing pricing or copy
All pricing, tiers, add-ons, descriptions, and state tax rates live in **`app/lib/data.js`**. Change them there; both the UI and the PDF/email read from the same place. State tax rates should be reviewed once or twice a year.

## Deploy
Connect the repo to Vercel (recommended, matches the other Lucid tools) or Netlify. Set the three environment variables in the host's dashboard. Pushes to the main branch auto-deploy.
