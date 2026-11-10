import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const hero = readFileSync("views/pages/people/[user]/+page.svelte", "utf8");
const assets = [
	"static/assets/images/idk/nullure-hero-castle.png",
	"static/assets/images/idk/nullure-hero-moon.webp",
	"static/assets/images/idk/nullure-hero-cliff.webp",
];

for (const asset of assets) {
	assert.equal(existsSync(asset), true, `${asset} should exist`);
}

assert.match(hero, /person\.user === "nullure"/);
assert.match(hero, /nullure-hero-moon\.webp/);
assert.match(hero, /nullure-hero-castle\.png/);
assert.match(hero, /nullure-hero-cliff\.webp/);
assert.match(hero, /prefers-reduced-motion/);
assert.match(hero, /\(hover: hover\) and \(pointer: fine\)/);
assert.match(hero, /max-width: none/);
assert.match(hero, /person\?\.user === "nullure"\) return/);
assert.match(hero, /width: min\(49vw, 46rem\)/);
assert.match(hero, /bottom: -26vh/);
assert.match(hero, /nullure-profile/);

const moonChannels = execFileSync("identify", ["-format", "%[channels]", assets[1]], { encoding: "utf8" });
assert.match(moonChannels, /a/, "moon asset should have an alpha channel");

console.log("Nullure Gothic hero checks passed.");
