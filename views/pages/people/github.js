export function githubRepositoryFromUrl(url) {
	try {
		const parsed = new URL(url);
		const hostname = parsed.hostname.toLowerCase();

		if (hostname !== "github.com" && hostname !== "www.github.com") {
			return null;
		}

		const [owner, repository] = parsed.pathname.split("/").filter(Boolean);
		return normalizeGitHubRepository(`${owner || ""}/${repository || ""}`);
	} catch {
		return null;
	}
}

function normalizeGitHubRepository(repository) {
	return /^[\w.-]+\/[\w.-]+$/.test(repository) ? repository.toLowerCase() : null;
}

export function githubRepositoriesForProjects(projects) {
	return [
		...new Set(
			(projects || [])
				.map((project) => normalizeGitHubRepository(project.github) || githubRepositoryFromUrl(project.link))
				.filter(Boolean),
		),
	];
}

export function formatStarCount(count) {
	if (!Number.isFinite(count) || count < 0) return "0";
	if (count < 1000) return String(Math.round(count));

	const abbreviated = Math.round((count / 1000) * 10) / 10;
	return `${abbreviated.toString().replace(/\.0$/, "")}k`;
}
