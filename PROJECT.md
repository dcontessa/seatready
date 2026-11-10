# SeatReady project brief

## Problem

A training enquiry often describes a goal rather than a course title. Staff must interpret it, check the learner's level, confirm a format and budget, calculate a group price and follow up for payment. SeatReady brings the first matching and booking steps into one reviewable workflow.

## Audience

Independent trainers and small training providers who manage enquiries themselves. The initial product is an operator-facing booking desk; it is not a public autonomous payment agent.

## First product slice

Enquiry → constrained AI course match → trusted catalogue quote → operator review → PayPal sandbox checkout → verified booking record.

AI explains a plausible match or asks for clarification. It cannot create catalogue facts, change prices, grant discounts, take payment or send a message. The operator stays responsible for suitability and confirming the details.

## Current evidence

- User selected the SeatReady concept in chat.
- SeatReady submitted to the PayPal AI Hackathon on 10 November 2026: submission `1292628`, project `1537688`.
- Local source is in the existing `PayPal-AI` folder.
- Live OpenAI matching verified with fictional enquiries.
- PayPal sandbox buyer payment of USD 447 verified on 10 November 2026, including capture validation, cancellation, and repeated capture requests returning the same reference.
- Fourteen automated tests and the production build pass.

## Hackathon delivery

Devpost confirmed “Project submitted!” on 10 November 2026 after the entrant explicitly confirmed eligibility and agreement to the rules and terms.

- Project: https://devpost.com/software/seatready
- Demo: https://youtu.be/gJBsN4zNfUQ (1:59, unlisted)
- Public MIT repository: https://github.com/dcontessa/seatready
- Rendered video backup: https://github.com/dcontessa/seatready/releases/tag/v0.1.0
- Separate personal clone created on branch `personal-use`; no personal feature changes have been made.

The app remains a local prototype with fictional course data and sandbox-only payments. It is not publicly deployed or ready to accept real payments.
