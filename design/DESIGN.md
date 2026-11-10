# SeatReady design

Reference: `seatready-concept.png`, generated with the built-in Image Gen tool. Full primary booking screen, 1536 × 1024.

## Visual system

- True white main canvas; pale sage #f1f4ed sidebar and recommendation surface; forest #20543e primary action; #202320 ink; #62665f secondary text; #d3d6cf rules.
- Georgia bold display typography, Arial/system sans-serif interface. Heading 60px at the reference width; section heading 36px; body 20px; labels 17px; buttons 18px. Smaller responsive variants preserve hierarchy.
- Sidebar 18.6vw (220–286px), header 72px, content gutter 34px. Two-column booking desk with 56/44 proportions, 20px gap, 16–20px surface radii. Fine borders, no shadows, no photos or gradients.
- Simple typographic S mark; outlined arrow/check glyphs from Lucide. Native HTML controls and text, no rasterised UI.
- Required workflow extends the same visual system for recommendation, quote review, payment state, catalogue, booking list and connections.

## Allowed initial copy

SeatReady; Training, thoughtfully booked.; Booking desk; Course catalogue; Bookings; Connections; Sample catalogue • Sandbox only; New enquiry; Find their next step.; Turn a training enquiry into a clear course recommendation and a booking.; Understand; Recommend; Book; Tell us what they need; Start with an enquiry. We’ll help with the rest.; Training enquiry; Seats; Budget per person (USD); Preferred format; Any; Online; In person; Find a course; Sample course data. No real bookings or charges.; A good fit starts here.; Your course match, transparent pricing and next steps will appear here.; The right level; A course that fits their experience.; A clear price; A quote from the course catalogue.; A considered booking; Review every detail before checkout.; You stay in control.; Try an example; AI for beginners; Excel for a team; No suitable course.

Intentional functional additions: an inline provider error only when needed; live AI vs explicit sample-mode attribution after a result; quote expiry, availability and truthful sandbox status; disabled checkout with explanation until PayPal credentials are configured. Form constraints and accessible error states are required additions. At narrow widths the sidebar becomes a compact top navigation and the main columns stack.

## Implementation comparison, 10 November 2026

The concept and rendered desktop image were inspected directly with `view_image`. The primary screen follows the reference's sidebar, header, serif hierarchy, two-column form/recommendation layout, sage surface and forest actions. No decorative imagery is required; all controls are native UI. Chrome was used for the first live AI and quote-review checks. After the Chrome connection timed out during a resize, the in-app browser completed responsive and console checks. No external Playwright browser was needed.

| Comparison | Evidence and correction |
| --- | --- |
| Copy | Initial heading, nav, form labels, actions and example names match the reference. The extra privacy sentence is an intentional functional disclosure. |
| Layout | Sidebar/header and two primary surfaces retain the reference structure. Textarea height and recommendation-panel stretch were corrected. |
| Typography | Serif heading scale, tracking, sans-serif labels and button type were adjusted in the browser. Mobile headings wrap without clipping. |
| Palette | White canvas, pale sage panels, forest actions and fine neutral rules use shared CSS tokens. No additional gradients or image overlays. |
| Spacing | Form gutters, field spacing and action height were tuned against the concept. Mobile field labels reserve equal height so inputs align. |
| Icons and controls | Numbered progress circles and simple outlined arrows/checks keep the reference's restrained treatment. Controls are keyboard focusable. |
| Responsive | 1536×1024 CSS desktop viewport and 390×844 phone viewport checked. Phone content stacks with no horizontal page overflow. Native browser captures omit the scrollbar area; full-page screenshots extend to the actual content height. |

Intentional differences: data-transmission disclosure, live AI wording, variable recommendation text, connection/error/expiry/payment states and responsive navigation. No outstanding material visual mismatch in the primary booking screen. PayPal's embedded checkout UI still needs a configured sandbox account before its appearance and transaction behaviour can be verified.

The concept was produced with the built-in Image Gen tool. Its brief specified the complete SeatReady booking screen, the exact initial copy, white/sage/forest palette, serif headings, sans-serif controls, four navigation destinations, two-column enquiry/empty-result layout, three numbered steps and sample-enquiry buttons. The generated image is a design reference, not a shipped UI image.
