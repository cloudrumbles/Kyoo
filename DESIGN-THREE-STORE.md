# Kyoo: interactive video shop (three.js)

## Purpose
Actually experience a video shop instead of receiving another streaming-homepage layout. The user walks along a shelf of cases, reaches for one, turns it over, and watches the actual local media. The metadata and artwork must come from Kyoo, not fabricated recommendations.

## Divergence

| Approach | What it feels like | Main problem |
| --- | --- | --- |
| First-person aisle | Walking between actual shelves, WASD / gyro | motion sickness, controls, GPU/power costs on iPhone |
| Counter turntable | One case on a slowly rotating table | too restrictive for browsing |
| The shelf | Eye-level film cases; slide, pick up, inspect, flip | needs good depth/lighting and straightforward controls |

**Converge:** physical shelf + turntable. The shelf is a three-dimensional scene with real case geometry and texture, warm shop lighting and perspective; lifting a chosen case borrows the close-reading moment of a turntable. Use physical depth for core interactions, not a 3D background ornamented with Netflix cards.

## Token system
- midnight aisle #0b1523, enamel navy #142840, indigo shelving #24374c
- brass #d9ad62, old paper #f4ecdc, worn ink #a9bdca, rental blue plastic #285b8d
- Barlow Condensed for shop signage; DM Sans for navigation and metadata
- camera straight on and slightly high; central chosen case, neighbouring cases visibly receding
- layout: navigation / compact shop sign / 3D shelf / low-information inspector / shelves switcher
- typography left-aligned. No hype labels or decorative stats.

## Interaction
- Swipe/arrow to move along a shelf.
- Tap/click a case to bring it forward.
- Turn over to read back cover (3D flip), return or play/open details.
- Switch between *Continue watching*, *Box sets*, and *New arrivals*.
- Long catalogues still available at Browse. No media content or controls simulated.

## Performance commitments
- one Three.js renderer, mounted only on the web home screen
- cap DPR at 1.5 (1.25 for narrow phones), no shadow maps/postprocessing/HDR/particles
- simple reused geometries and materials
- cover textures rasterized to 320×480-ish, released on shelf changes
- event-driven RAF only during transitions, on user input, and when image loads; page-hidden stops renders
- resize with ResizeObserver; proper disposal on unmount; handle WebGL context loss
- 2D DOM controls remain readable and operable even if WebGL isn't available
- respect reduced-motion, keyboard control, touch swipes, and pointer interactions

## Acceptance
- real media retrieved from Kyoo and navigates to real playback/detail routes
- screen still looks like a physical shop when artworks haven't loaded
- test screenshot on desktop & mobile emulation and revise after critique
- no ongoing requestAnimationFrame loop at rest, low GPU memory
- no native/TV regression: original implementation is the platform fallback.

## Visual iterations and verification

First browser screenshot review: the first WebGL render used 20 draw calls, three textures, and stopped at 21 frames on an emulated 390px-wide phone. It was a genuine 3D shelf, but the case covers were too small and the shop sign's overhead trim intersected the heading. The second pass moved the camera closer, made the cases larger, recast the rail above the title, exposed shelf navigation in a compact three-column mobile index, and minimized the heading above the scene.

Second browser screenshot review: the enlarged case looks tangible and its back cover rotates into view; however, the lifted case crossed the 3D shelf header. Hide that heading while inspecting. The landing shelf now opens on actual box sets (stronger poster artwork), with continue watching one shelf over. The primary action falls back to opening details when direct playback isn't available, rather than displaying a disabled gold button.

Performance measurements (Chrome mobile emulation at device pixel ratio 3): capped effective renderer pixel ratio **1.25**, 20 draw calls and 3 textures on the first shelf; no new requestAnimationFrame ticks during a 1.6-second idle interval. Desktop measured 24 draw calls and 3 textures. Up to seven nearby artwork images are requested per shelf, rather than fetching every offscreen case. No shadow mapping, animation loops at rest, particle effects, HDR, bloom, or expensive physical environment maps. The split Three.js chunk is served with gzip for much smaller transfer size.

Browser QA covers left/right case navigation, case lift, back-cover flip, shelf switching, box-set content, and the user profile/menu navigation. iPhone Safari hardware is not available on the Linux VM, so browser tests are mobile Chromium emulation, not a claimed real-device Safari measurement. All 3D code is web-only; the native implementation remains unchanged.
