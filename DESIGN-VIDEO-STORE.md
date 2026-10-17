# Kyoo video store — design exploration (2026-10-17)

## Brief
Replace the generic streaming-service UI with the feeling of choosing a physical DVD/Blu-ray from a neighbourhood video shop. Real cover artwork is the product; no fake renting or payments. Phone-first web interface and desktop, without sacrificing television focus, playback, filtering, or watch progress.

## Diverge

### A. Midnight video
- Base `#102035`, counter `#172D46`, lettering `#F3F0E7`, subtitles `#ADBECB`, signage `#EEC978`, shelf rule `#3C5772`.
- Barlow Condensed sign typography, DM Sans labels.
- Wireframe: `[logo | shelves | my list | search] / [marquee: title + controls | wide artwork] / [continue-watching cases →] / [new arrivals →]`.
- Strong visual hierarchy, works at night, but without details looks like an ordinary streamer.

### B. Corner rental shop
- Base `#2A1E19`, cardboard `#3A2922`, parchment `#FFF1D8`, sun-faded orange `#EFB05E`, ticket red `#C9523F`.
- Fraunces/DM Sans with thick cases, drop shadows and round staff stickers.
- Wireframe: `[shop sign] / [featured title + circular sticker | window display] / [physical cases on a wooden shelf]`.
- Evokes a real shop; too much serif + faux-aging risks kitsch.

### C. Collector's catalogue
- Base `#EEE6D7`, inset paper `#DED5C4`, ink `#221E1B`, oxblood `#8D312E`, lines `#BEB2A3`.
- Libre Franklin/Fraunces.
- Wireframe: `[catalogue header] / [title index | film art] / [archival grid, metadata]`.
- Excellent information clarity; leans library/archive, not video rental.

## Converge: midnight shopfront + physical cases
Adopt A's indigo storefront, amber practical accents and clean sign typography; borrow B's shelf depth, tactile disc-case bevels and thicker inset poster edges; keep C's carefully aligned metadata and readable hierarchy. No fake rent/return transactions, fabricated format labels or theatrical decoration that blocks browsing.

### Final system
- Base `#101D30` (midnight blue); elevated `#192D45` (card stock); deep `#0B1523` (case edge).
- Text `#F5EFE1` (cream); muted `#A9B8C7` (dusty pale-blue); primary `#F0C875` (warm amber); hairline `#344B62`.
- Display: Barlow Condensed 700/800, substantial size for media titles/section headers. Body: DM Sans 400/500/700.
- Navigation like a store sign; featured title as display window; case art as physical boxes with subtle dark spines; section headings like shelf placards. Practical metadata under each case.
- Mobile: one-column feature window with readable copy, peeking horizontal rows, thumb-friendly controls and safe-area breathing room. Focus and reduced motion matter.
- Data: continue watching, recently added and titles currently present, rather than dozens of empty random genres.
- Accessibility: strong text contrast, labelled buttons, actual link navigation and focus rings.

## Screenshots
Explorations and screenshot captures are kept outside the source tree in `/srv/kyoo/design-review/`: `design-concept-a.png`, `design-concept-b.png`, `design-concept-c.png`, `design-explorations.html`, plus desktop and iPhone snapshots of the home, browse, and detail screens. They are not shipped in the frontend bundle.

### First implementation critique
Real-browser screenshots showed the new midnight storefront reads clearly on desktop and iPhone. Two flaws emerged: the mobile browse controls squeezed into a tall single-column stack, and default chip text became illegible over warm amber. Reworked browse controls into a compact mobile multi-row layout, changed chips to deep-blue with cream lettering and retained amber for active decisions. Also moved mobile administration under the profile menu and created a matching disc PWA icon.

### Second implementation critique
The follow-up phone screenshot showed that the default watchlist filter was an oversized outlined capsule that competed with the art; it is now a restrained underlined shelf-index tab strip with horizontally scrollable choices. A broken-looking circular avatar in the profile header was replaced by a membership-card disc mark while leaving the account avatar and settings accessible in the navigation. Test runs successfully navigated from the home shelf link to Browse, changed media type to Series, and opened a series case without browser errors.

### Third implementation critique
A mobile screenshot of Settings exposed a much more serious responsive fault in the inherited layout: full-size dropdowns compressed long descriptions into an unreadable narrow column. Updated the shared Preference component so settings labels and descriptions use the full width on phones, with dropdown controls below them, while preserving side-by-side rows on larger screens. Replaced oversized oval buttons with compact squared video-shop controls, and kept setting behavior unchanged.
