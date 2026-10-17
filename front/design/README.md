# Kyoo design tokens

**Edit one file:** [tokens.ts](./tokens.ts)

The token system is shared by the web interface, native-compatible Tailwind/Uniwind classes, and the on-demand Three.js room. Do not edit `src/design/tokens.generated.css`: it is generated from `design/tokens.ts`.

## What changes what

| Token | Controls |
| --- | --- |
| `colors.accent` | Gold buttons, interactive accents, focus indicators and case progress (CSS + 3D) |
| `colors.background` / `colors.surface` | Page, navigation, shelf interface and related elements |
| `colors.walnut`, `colors.woodTop`, `colors.enamel` | Wood / enamel 3D shop materials |
| `fonts.body` / `fonts.display` | Interface typography and printed case artwork |
| `type.heroDesktop`, `type.shelfMobile` | CSS headings at different viewports |
| `layout.roomHeight`, `layout.roomHeightMobile` | Height of the display alcove |
| `scene.case.width` / `height` / `depth` / `gap` | 3D case dimensions and spacing |
| `scene.camera` | Lens and viewing position |
| `scene.lights` / `scene.materials` | Light colours/intensity and surface finishes |
| `scene.motion` | Physical movement easing and swipe behaviour |
| `scene.performance` | DPR cap, nearby cover loading and other performance limits |

The `colors` section is **semantic**, not a list of disconnected hex swatches. For example, changing `accent` applies wherever the primary shop accent has meaning. Changing `brass` changes the shop's metal accent without changing unrelated text.

## How to edit

From `front/`:

```sh
# 1. Edit design/tokens.ts
bun run tokens
bun run tokens:check
bun test design/tokens.test.ts
bun run web
```

`bun run web` and `bun run dev` already regenerate the CSS, so the standalone tokens command is optional. The generated CSS is checked into Git so tests and tooling can inspect it.

There are two outputs from the same source:

- **CSS + Tailwind/Uniwind**: `src/design/tokens.generated.css` exports `--kyoo-color-accent` for traditional CSS, `--color-kyoo-accent` for classes like `bg-kyoo-accent`, and existing aliases like `--color-accent`. This includes the layout and type properties.
- **Three.js**: `src/ui/home/store-stage.web.tsx` imports `designTokens` directly. Rendering parameters are consumed as numbers and material colours, not duplicated CSS literals.

Changes to a token require rebuilding/reloading the application; this is a source-of-truth configuration system rather than an in-browser theme editor. Changing a token and rebuilding changes the relevant interface **and** the 3D shop.

## Extending the system

Add a semantic property to `design/tokens.ts`, refer to it as `var(--kyoo-color-your-name)` in ordinary CSS or `bg-kyoo-your-name` / `text-kyoo-your-name` in Tailwind/Uniwind, and reference `designTokens.colors.yourName` inside Three.js. The generator transforms camelCase into kebab-case. Layout, typography and shape tokens are likewise exposed as `--kyoo-layout-*`, `--kyoo-type-*` and `--kyoo-shape-*`.

Performance parameters stay explicit; raising DPR or adding light effects can cost substantial GPU time on iPhone.
