# SeatReady

An AI-assisted booking desk for training providers. Turn an enquiry into a course recommendation, review a server-priced seat quote, and continue to PayPal sandbox checkout.

This is a local hackathon prototype. All courses, dates, prices and capacities are fictional. Live payments are disabled.

## Run

The project uses Node's built-in SQLite support. Development was verified on Node 26.7.0.

```sh
npm ci
cp -n .env.example .env.local
chmod 600 .env.local
npm run dev
```

On a fresh clone, enter your own credentials in `.env.local` before starting. If `.env.local` already exists, keep it instead of replacing it. The repository includes only an empty configuration template; keys and local booking records are excluded.

Open **http://localhost:5180**. The API binds to `127.0.0.1:4181`; the frontend proxies `/api` requests to it. Keep the same hostname when returning to your booking records, since the browser session cookie is host-specific.

```sh
npm test
npm run build
npm start
```

After building, `npm start` serves the built app at **http://localhost:4181**. Do not expose this single-operator prototype directly to the internet.

## What works

- Live OpenAI Responses API recommendations, limited to eligible catalogue course IDs.
- Deterministic checks of seat count, current availability, delivery format and budget.
- Server-calculated prices in integer cents. Client-provided prices are rejected.
- Explicit no-match and follow-up-question states; an unrelated enquiry does not have to become a booking.
- An explicitly labelled keyword sample matcher, available after a provider error. It never silently substitutes for AI.
- Quote review and expiry, with a human review step before enabling checkout.
- PayPal sandbox Orders API creation/capture, JavaScript SDK v6 checkout, stable idempotency keys, matching amount/currency/quote/capture verification, and read-only payment reconciliation. A sandbox buyer payment of **USD 447** was verified on 10 November 2026; two capture retries returned the same completed capture.
- A within-page checkout option for in-app browsers where PayPal's popup does not appear.
- Persistent SQLite quotes and payment records, scoped to a browser session; JSON record download.
- Responsive booking desk, catalogue, bookings and connections views.

## Private configuration

Keep credentials in the local, ignored `.env.local` file. Never put secrets in browser code, screenshots, chat, source control or a `VITE_` variable. The API reads `.env.local` on startup. Restart the app after changing credentials.

Supported server configuration:

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Private OpenAI key for live course matching |
| `OPENAI_MODEL` | Optional model override; default `gpt-4.1-mini` |
| `PAYPAL_CLIENT_ID` | Sandbox app client ID |
| `PAYPAL_CLIENT_SECRET` | Private sandbox app secret |

Create a PayPal **sandbox** merchant app in the Developer Dashboard and enter its credentials locally. Use a separate sandbox personal account as the buyer; the dashboard supplies its test login. Restart SeatReady after configuration. This app intentionally has no live PayPal endpoint or live-mode switch. Every fresh clone needs its own local configuration.

## Demo path

1. Open Booking desk. The sample AI enquiry is prefilled.
2. Click **Find a course**. The expected sample course is **AI for the Everyday Workday**, subject to AI judgement and current sample availability.
3. Review the quote: 3 seats × USD 149 = USD 447.
4. Click **Review booking**, review the details, and tick the sandbox review checkbox.
5. Choose PayPal and sign in with a sandbox buyer. If the popup does not appear, close its overlay and choose **Use checkout on this page**. A Malaysian test buyer may see PayPal's MYR conversion; the merchant order remains USD 447.
6. Approve the sandbox payment. SeatReady displays **Sandbox payment confirmed** with a capture reference only after server verification. Inspect **Bookings** for **Sandbox paid** and download the JSON record. Cancelling checkout must leave the quote unpaid.
7. Try **No suitable course**. An advanced scuba-diving enquiry should produce no course and no checkout.

## Architecture and boundaries

`src/` contains the React UI. `server/catalogue.mjs` owns the sample courses and prices. `server/domain.mjs` validates input and verifies payment evidence. `server/providers.mjs` calls OpenAI and PayPal from the server. `server/store.mjs` persists local data under ignored `.data/`. `server/app.mjs` handles session scoping, local-origin checks, rate limiting and API routes.

Quotes last 15 minutes. Starting checkout reserves sample seats; paid bookings consume capacity. An ambiguous capture keeps its seats reserved rather than risking overselling. Use **Check payment** in Bookings to reconcile a completed remote transaction without initiating a new charge. If a provider never resolves an ambiguous payment, administrative reconciliation is still required; this prototype has no background webhook worker, customer authentication, account recovery, refunds or production administration.

Enquiry text and the eligible sample catalogue are sent to OpenAI. Requests use `store: false`. The app does not collect learner contact details. Use fictional enquiries during the demo. Local browser-session cookies are not a substitute for production authentication.

## Validation

Fourteen automated tests cover input/price tampering, eligibility filters, unrelated enquiries, invented course IDs, session isolation, capacity reservation, quote expiry, payment evidence, disallowed origins, disconnected PayPal, idempotency and late-payment reconciliation. Automated tests use provider stubs and require no credentials. Separate live checks verified OpenAI matching, no-match behavior, PayPal order creation, cancellation, sandbox buyer approval, completed capture, and idempotent retries. See [validation evidence](docs/VALIDATION.md).

The browser build was checked for accidental inclusion of the saved key; none was present. HTTP requests for `.env.local`, including Vite's filesystem route, returned 403 without exposing the key.

## Project and sources

- [SeatReady Devpost draft](https://devpost.com/submit-to/31302-paypal-ai-hackathon/manage/submissions/1292628-seatready/project-overview). Name and pitch were saved earlier in this chat; no final submission was made.
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [PayPal checkout integration](https://developer.paypal.com/checkout/integrate/)
- [PayPal Orders v2](https://developer.paypal.com/docs/api/orders/v2/)
- Visual reference and design system: `design/seatready-concept.png` and `design/DESIGN.md`.

The application runs locally using the complete instructions above. The editable demo source is in [videos/seatready-demo](videos/seatready-demo). Final Devpost submission status is recorded separately after verification.
