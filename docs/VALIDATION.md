# Validation evidence

Verified on 10 November 2026. All payments below are PayPal sandbox tests; all courses and prices are fictional.

| Check | Result |
| --- | --- |
| Automated tests | 14/14 pass |
| Production build | Pass |
| Live OpenAI recommendation | Three beginners, online, USD 200 per-person budget → AI for the Everyday Workday |
| Server quote | 3 × USD 149 = USD 447 |
| No match | Advanced scuba enquiry → no course, no checkout |
| Human review gate | PayPal enabled only after review checkbox |
| Popup cancellation | Explicit cancellation message; no paid booking |
| Within-page checkout | PayPal SDK v6 modal completed in the in-app browser |
| Remote PayPal order | 5HG26045R1326072H — COMPLETED |
| Verified capture | 6XA00257DP2081319 — USD 447, exactly one capture |
| Capture retry, twice | HTTP 200, paid, same capture reference both times |
| Local booking record | Persisted as Sandbox paid with capture reference |
| Credentials | Server-only `.env.local`, permission 0600, excluded from Git |

The Malaysian sandbox buyer saw PayPal's test MYR conversion; the merchant amount verified by SeatReady was USD 447. No live payment occurred.

Provider error cases, expired-quote behavior, session isolation, and late reconciliation are covered by automated provider-stub tests. No claim is made that every bank decline or network failure was exercised against PayPal's live sandbox.

The prototype has no public customer authentication, webhook worker, refund administration or account recovery. It is designed to run locally. A new clone starts with an empty database and needs its own API configuration.
