import assert from "node:assert/strict";
import {
	formatStarCount,
	githubRepositoriesForProjects,
	githubRepositoryFromUrl,
} from "../views/pages/people/github.js";

assert.equal(
	githubRepositoryFromUrl("https://github.com/CaviraOSS/PageLM"),
	"caviraoss/pagelm",
);
assert.equal(
	githubRepositoryFromUrl("https://github.com/CaviraOSS/PageLM/?tab=readme#overview"),
	"caviraoss/pagelm",
);
assert.equal(githubRepositoryFromUrl("https://cavira.app/projects/longmemory"), null);
assert.equal(formatStarCount(999), "999");
assert.equal(formatStarCount(1200), "1.2k");
assert.equal(formatStarCount(2062), "2.1k");
assert.deepEqual(
	githubRepositoriesForProjects([
		{ github: "CaviraOSS/PageLM" },
		{ link: "https://github.com/caviraoss/pagelm/?tab=readme" },
		{ link: "https://cavira.app/projects/longmemory" },
	]),
	["caviraoss/pagelm"],
);
assert.deepEqual(
	githubRepositoriesForProjects([{ github: "CaviraOSS/LongMemory" }]),
	["caviraoss/longmemory"],
);

console.log("GitHub profile helper checks passed.");
