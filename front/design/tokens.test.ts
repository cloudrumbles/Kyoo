import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { designTokens } from "./tokens";
import { generateTokenCss } from "../scripts/generate-design-tokens";

const root = join(import.meta.dir, "..");

describe("Kyoo design tokens", () => {
	test("generated CSS exactly matches the canonical source", () => {
		const actual = readFileSync(join(root, "src/design/tokens.generated.css"), "utf8");
		expect(actual).toBe(generateTokenCss());
	});

	test("changing a brand token changes its CSS, Tailwind and Uniwind outputs", () => {
		const altered = {
			...designTokens,
			colors: { ...designTokens.colors, accent: "#ce7650" },
		} as unknown as typeof designTokens;
		const css = generateTokenCss(altered);
		expect(css).toContain("--kyoo-color-accent: #ce7650;");
		expect(css).toContain("--color-kyoo-accent: #ce7650;");
		expect(css).toContain("--color-accent: #ce7650;");
		expect(css).not.toContain("--color-accent: #f0c875;");
	});

	test("changes to type, spacing and surfaces propagate to the generated stylesheet", () => {
		const altered = {
			...designTokens,
			colors: { ...designTokens.colors, background: "#331d24" },
			fonts: { ...designTokens.fonts, display: '"Georgia", serif' },
			layout: { ...designTokens.layout, pagePadding: "65px" },
		} as unknown as typeof designTokens;
		const css = generateTokenCss(altered);
		expect(css).toContain("--color-background: #331d24;");
		expect(css).toContain('--font-headers: "Georgia", serif;');
		expect(css).toContain("--kyoo-layout-page-padding: 65px;");
	});

	test("3D renderer uses scene tokens for geometry, camera, light, materials and performance", () => {
		const stage = readFileSync(join(root, "src/ui/home/store-stage.web.tsx"), "utf8");
		expect(stage).toContain('import { designTokens } from "../../../design/tokens"');
		for (const expected of [
			"S.case.width", "S.case.height", "S.case.depth",
			"S.camera.fieldOfView", "S.camera.distance",
			"S.lights.key.intensity", "S.materials.woodRoughness",
			"S.motion.easing", "S.performance.dprMobile",
		]) expect(stage).toContain(expected);
		expect(stage).not.toMatch(/#[\da-f]{6}\b/i);
	});

	test("changing 3D geometry and lighting tokens updates the values consumed by the scene", () => {
		const updated = {
			...designTokens.scene,
			case: { ...designTokens.scene.case, width: 1.8 },
			lights: {
				...designTokens.scene.lights,
				key: { ...designTokens.scene.lights.key, intensity: 0.8 },
			},
		};
		expect(updated.case.width + updated.case.gap).toBeCloseTo(2.01);
		expect(updated.lights.key.intensity).toBe(0.8);
		expect(updated.case.width).not.toBe(designTokens.scene.case.width);
	});
});
