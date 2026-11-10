<script>
	import { page } from "$app/stores";
	import Lenis from "lenis";
	import "lenis/dist/lenis.css";
	import Cursor from "$lib/includes/Cursor.svelte";
	import people from "../people";
	import { formatStarCount, githubRepositoriesForProjects } from "../github";

	const SPEED = 60;
	const SNAP_FORWARD_THRESHOLD = 0.26;
	const SNAP_BACKWARD_THRESHOLD = 0.84;

	let offset = $state(0);
	let scrollY = $state(0);
	let screenWidth = $state(1920);
	let screenHeight = $state(1080);
	let treeWidth = $state(500);
	let projectStars = $state({});
	let heroPointerX = $state(0);
	let heroPointerY = $state(0);
	const requestedRepositories = new Set();

	let totalTreeDistance = $derived(screenWidth + treeWidth);
	let groundCycleWidth = $derived(screenWidth * 2);

	let maxScroll = $derived(screenHeight * 2.5);
	let scrollProgress = $derived(Math.min(1, Math.max(0, scrollY / (maxScroll || 1))));

	let moveUpProgress = $derived(Math.min(1, scrollProgress / 0.25));
	let svgTranslateY = $derived(-37 * moveUpProgress);

	let zoomProgress = $derived(Math.max(0, Math.min(1, (scrollProgress - 0.22) / 0.7)));
	let aspectRatio = $derived(screenWidth / (screenHeight || 1));
	let targetMaxScale = $derived(Math.max(55, aspectRatio * 34));
	let svgScale = $derived(1 + Math.pow(zoomProgress, 3) * targetMaxScale);

	let mainRevealProgress = $derived(Math.max(0, Math.min(1, (zoomProgress - 0.35) / 0.4)));
	let mainScale = $derived(0.92 + 0.08 * mainRevealProgress);

	let svgOpacity = $derived(zoomProgress > 0.62 ? Math.max(0, 1 - (zoomProgress - 0.62) / 0.28) : 1);
	let skyOpacity = $derived(1 - Math.max(0, Math.min(1, (zoomProgress - 0.25) / 0.45)));
	let mainPinY = $derived(scrollY < maxScroll ? scrollY - maxScroll : 0);

	const person = $derived(people.find((p) => p.user === $page.params.user));
	const repositories = $derived(githubRepositoriesForProjects(person?.projects));
	const detailPanels = $derived((person?.details || []).filter((detail) => detail.text || detail.items?.length));
	const skillGroups = $derived((person?.skillGroups || []).filter((group) => group.items?.length));

	function updateHeroParallax(event) {
		if (
			person?.user !== "nullure" ||
			!window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
			window.matchMedia("(prefers-reduced-motion: reduce)").matches
		) return;

		heroPointerX = (event.clientX / window.innerWidth - 0.5) * 2;
		heroPointerY = (event.clientY / window.innerHeight - 0.5) * 2;
	}

	$effect(() => {
		for (const repository of repositories) {
			if (requestedRepositories.has(repository)) continue;
			requestedRepositories.add(repository);

			fetch(`https://api.github.com/repos/${repository}`, {
				headers: { Accept: "application/vnd.github+json" },
			})
				.then((response) => (response.ok ? response.json() : null))
				.then((data) => {
					if (Number.isFinite(data?.stargazers_count)) {
						projectStars[repository] = data.stargazers_count;
					}
				})
				.catch(() => {});
		}
	});

	$effect(() => {
		const lenis = new Lenis({
			autoRaf: true,
			duration: 1.15,
			easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
			orientation: "vertical",
			gestureOrientation: "vertical",
			smoothWheel: true,
			wheelMultiplier: 1,
			touchMultiplier: 1.5,
		});

		let scrollTimeout;
		let isAutoScrolling = false;
		let lastScrollY = window.scrollY;
		let scrollDirection = 0;

		lenis.on("scroll", (e) => {
			scrollDirection = e.scroll > lastScrollY ? 1 : e.scroll < lastScrollY ? -1 : scrollDirection;
			lastScrollY = e.scroll;
			scrollY = e.scroll;

			if (isAutoScrolling) return;
			clearTimeout(scrollTimeout);

			if (scrollY > 5 && scrollY < maxScroll - 5) {
				scrollTimeout = setTimeout(() => {
					const currentProgress = scrollY / (maxScroll || 1);

					if (scrollDirection >= 0 && currentProgress >= SNAP_FORWARD_THRESHOLD && currentProgress < 0.98) {
						isAutoScrolling = true;
						const remainingRatio = 1 - currentProgress;
						lenis.scrollTo(maxScroll, {
							duration: Math.max(0.8, remainingRatio * 1.5),
							easing: (t) => 1 - Math.pow(1 - t, 3),
							onComplete: () => {
								isAutoScrolling = false;
							},
						});
					} else if (scrollDirection < 0 && currentProgress <= SNAP_BACKWARD_THRESHOLD && currentProgress > 0.02) {
						isAutoScrolling = true;
						lenis.scrollTo(0, {
							duration: Math.max(0.8, currentProgress * 1.5),
							easing: (t) => 1 - Math.pow(1 - t, 3),
							onComplete: () => {
								isAutoScrolling = false;
							},
						});
					}
				}, 130);
			}
		});

		const cancelAutoScroll = () => {
			clearTimeout(scrollTimeout);
			if (isAutoScrolling) {
				isAutoScrolling = false;
				lenis.stop();
				lenis.start();
			}
		};

		window.addEventListener("wheel", cancelAutoScroll, { passive: true });
		window.addEventListener("touchstart", cancelAutoScroll, { passive: true });

		return () => {
			clearTimeout(scrollTimeout);
			window.removeEventListener("wheel", cancelAutoScroll);
			window.removeEventListener("touchstart", cancelAutoScroll);
			lenis.destroy();
		};
	});

	$effect(() => {
		if (person?.user === "nullure") return;

		let animationFrameId;
		let lastTime = performance.now();

		function loop(currentTime) {
			const deltaTime = (currentTime - lastTime) / 1000;
			lastTime = currentTime;
			offset += SPEED * deltaTime;
			animationFrameId = requestAnimationFrame(loop);
		}

		animationFrameId = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(animationFrameId);
	});
</script>

<svelte:window onpointermove={updateHeroParallax} />

<Cursor />

{#if person}
	<div class="relative w-full bg-black selection:bg-white/20 selection:text-white overflow-x-clip">
		<div class="relative w-full h-[350svh] pointer-events-none">
			<div bind:clientWidth={screenWidth} bind:clientHeight={screenHeight} class="sticky top-0 h-svh w-full overflow-hidden">
				{#if person.user === "nullure"}
					<div class="nullure-hero-scene" style:opacity={skyOpacity} style:visibility={skyOpacity <= 0.01 ? "hidden" : "visible"}>
						<div class="nullure-hero-stars"></div>
						<div class="nullure-hero-moon-halo"></div>
						<img
							src="/assets/images/idk/nullure-hero-moon.webp"
							alt=""
							class="nullure-hero-moon"
							style:transform="translate3d({heroPointerX * -10}px, {heroPointerY * -6}px, 0)" />
						<div class="nullure-hero-fog"></div>
						<img
							src="/assets/images/idk/nullure-hero-castle.png"
							alt=""
							class="nullure-hero-castle"
							style:transform="translate3d({heroPointerX * 8}px, {heroPointerY * 5}px, 0)" />
						<img
							src="/assets/images/idk/nullure-hero-cliff.webp"
							alt=""
							class="nullure-hero-cliff"
							style:transform="translate3d({heroPointerX * 14}px, {heroPointerY * 8}px, 0)" />
						<div class="nullure-hero-vignette"></div>
					</div>
				{:else}
					<div class="absolute inset-0 z-10 will-change-[opacity]" style:opacity={skyOpacity} style:visibility={skyOpacity <= 0.01 ? "hidden" : "visible"}>
						<div class="absolute h-[84%] w-full bg-cover bg-center top-0 left-0 bg-[url('/assets/images/idk/53.png')]"></div>

						<div bind:clientWidth={treeWidth} class="absolute h-[70%] w-[35%] bg-cover bg-no-repeat top-[38%] left-full bg-[url('/assets/images/idk/54.png')] will-change-transform" style:transform="translate3d(-{(offset * 0.6) % totalTreeDistance}px, 0, 0)"></div>

						<div class="absolute h-[22%] bottom-0 left-0 flex w-[400vw] will-change-transform" style:transform="translate3d(-{offset % groundCycleWidth}px, 0, 0)">
							<div class="h-full w-screen shrink-0 bg-cover bg-[url('/assets/images/idk/55.png')]"></div>
							<div class="h-full w-screen shrink-0 bg-cover bg-[url('/assets/images/idk/55.png')] -scale-x-100"></div>
							<div class="h-full w-screen shrink-0 bg-cover bg-[url('/assets/images/idk/55.png')]"></div>
							<div class="h-full w-screen shrink-0 bg-cover bg-[url('/assets/images/idk/55.png')] -scale-x-100"></div>
						</div>
					</div>
				{/if}

				<div class="absolute inset-0 bg-gradient-to-t from-black via-transparent z-30 overflow-hidden pointer-events-none" style:opacity={svgOpacity} style:visibility={svgOpacity <= 0.01 ? "hidden" : "visible"}>
					<div class="relative w-full h-svh text-zinc-300 flex flex-col justify-end items-center pb-[4vh]">
						<div class="h-[18vh] flex items-center justify-center will-change-transform" style:transform="translateY({svgTranslateY}vh)">
							<svg class="h-full w-auto overflow-visible will-change-transform" style:transform-origin={person.transform_origin} style:transform="scale({svgScale})" viewBox={person.viewbox} fill="none" xmlns="http://www.w3.org/2000/svg">
								{@html person.svg}
							</svg>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div
			class="relative z-20 -mt-[100svh] min-h-svh bg-black text-zinc-100 will-change-[transform,opacity]"
			class:nullure-profile={person.user === "nullure"}
			style:opacity={mainRevealProgress}
			style:transform="translate3d(0, {mainPinY}px, 0) scale({mainScale})"
			style:transform-origin="50% 50svh"
			style:pointer-events={zoomProgress > 0.75 ? "auto" : "none"}>
			<div class="pointer-events-none absolute top-0 inset-x-0 h-96 z-0 bg-[radial-gradient(ellipse_50%_50%_at_50%_0%,rgba(255,255,255,0.05),transparent)]"></div>

			<main class="relative z-20 max-w-5xl mx-auto w-full px-6 sm:px-10 md:px-16 pt-16 sm:pt-24 pb-48 space-y-20">
				<header class="flex flex-col sm:flex-row sm:items-center justify-between gap-8 pb-12 border-b border-white/[0.08]">
					<div class="flex items-start sm:items-center gap-6">
						<div class="relative shrink-0">
							<img src={person.image} alt={person.name} class="size-20 sm:size-24 rounded-2xl object-cover border border-white/10 shadow-2xl" />
						</div>

						<div class="space-y-2">
							<div class="flex flex-wrap items-baseline gap-3">
								<h1 class="text-2xl sm:text-3xl font-medium tracking-tight text-white">
									{person.name}
								</h1>
								{#if person.user}
									<span class="text-lg font-mono text-zinc-400">
										@{person.user}
									</span>
								{/if}
							</div>

							{#if person.bio}
								<p class="text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed pt-1">
									{person.bio}
								</p>
							{/if}

							{#if person.facts?.length}
								<div class="flex flex-wrap gap-2 pt-3">
									{#each person.facts as fact}
										<span
											class="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300">
											{#if fact.icon}
												<span aria-hidden="true" class="text-zinc-500">{fact.icon}</span>
											{/if}
											<span class="sr-only">{fact.label}: </span>
											<span>{fact.value}</span>
										</span>
									{/each}
								</div>
							{/if}
						</div>
					</div>

					{#if person.links}
						<div class="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
							{#each Object.entries(person.links) as [platform, url]}
								<a href={url} target="_blank" rel="noopener noreferrer" class="px-3.5 py-2 rounded-lg bg-zinc-950 border border-white/[0.08] hover:border-white/25 text-sm font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-all duration-200">
									{platform}
								</a>
							{/each}
						</div>
					{/if}
				</header>

				<section class="grid grid-cols-1 md:grid-cols-12 gap-10">
					<div class="md:col-span-5 space-y-4">
						<h2 class="text-sm font-mono uppercase text-zinc-400">Core Roles</h2>
						<div class="flex flex-wrap gap-2">
							{#each person.skills as skill}
								<span class="px-3 py-1.5 rounded-md bg-zinc-900/70 border border-white/[0.07] text-sm font-medium text-zinc-200">
									{skill}
								</span>
							{/each}
						</div>
					</div>

					<div class="md:col-span-7 space-y-4">
						<h2 class="text-sm font-mono uppercase text-zinc-400">Domains & Capabilities</h2>
						<div class="flex flex-wrap gap-2">
							{#each person.experience as domain}
								<span class="px-3 py-1.5 rounded-md bg-zinc-950 border border-white/[0.05] text-sm text-zinc-400 hover:text-zinc-200 hover:border-white/15 transition-colors">
									{domain}
								</span>
							{/each}
						</div>
					</div>

					<div class="md:col-span-12 space-y-5">
						<h2 class="text-sm font-mono uppercase text-zinc-400">Tech Stack</h2>
						{#if skillGroups.length}
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
								{#each skillGroups as group}
									<div class="space-y-3 border-l border-white/[0.08] pl-4">
										<h3 class="text-sm font-medium text-zinc-300">{group.title}</h3>
										<div class="flex flex-wrap gap-2">
											{#each group.items as stack}
												<span class="px-3 py-1.5 rounded-md bg-zinc-900/70 border border-white/[0.07] text-sm font-medium text-zinc-200">
													{stack}
												</span>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="flex flex-wrap gap-2">
								{#each person.stack as stack}
									<span class="px-3 py-1.5 rounded-md bg-zinc-900/70 border border-white/[0.07] text-sm font-medium text-zinc-200">
										{stack}
									</span>
								{/each}
							</div>
						{/if}

						{#if person.learning?.length}
							<div class="flex flex-wrap items-center gap-2 pt-1">
								<span class="text-xs font-mono uppercase tracking-wider text-zinc-500">Currently learning</span>
								{#each person.learning as topic}
									<span class="px-3 py-1.5 rounded-md border border-white/[0.1] bg-white/[0.03] text-sm text-zinc-300">{topic}</span>
								{/each}
							</div>
						{/if}
					</div>
				</section>

				{#if detailPanels.length}
					<section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{#each detailPanels as detail}
							<article class="rounded-xl border border-white/[0.07] bg-zinc-950/70 p-5 space-y-3">
								<h2 class="text-xs font-mono uppercase tracking-wider text-zinc-400">{detail.title}</h2>
								{#if detail.text}
									<p class="text-sm leading-relaxed text-zinc-300">{detail.text}</p>
								{/if}
								{#if detail.items?.length}
									<div class="flex flex-wrap gap-2">
										{#each detail.items as item}
											<span class="rounded-md border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-300">{item}</span>
										{/each}
									</div>
								{/if}
							</article>
						{/each}
					</section>
				{/if}

				<section class="space-y-6">
					<div class="flex items-center justify-between">
						<h2 class="text-sm font-mono uppercase text-zinc-400">Selected Works</h2>
						<span class="text-sm font-mono text-zinc-400">0{person.projects.length}</span>
					</div>

					<div class="divide-y divide-white/[0.06] border-y border-white/[0.06]">
						{#each person.projects as project}
							{@const repository = githubRepositoriesForProjects([project])[0]}
							<a href={project.link} target="_blank" rel="noopener noreferrer" class="group py-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-8">
								<div class="space-y-1">
									<div class="flex items-center gap-3">
										<h3 class="text-base font-medium text-white group-hover:text-zinc-200 transition-colors">
											{project.name}
										</h3>
										<span class="text-sm text-zinc-400">•</span>
										<span class="text-sm text-zinc-300">{project.tag}</span>
										{#if repository && projectStars[repository] !== undefined}
											<span class="inline-flex items-center gap-1 rounded-md border border-white/[0.1] bg-white/[0.03] px-2 py-0.5 text-xs font-mono text-zinc-300">
												<span aria-hidden="true" class="text-amber-300">★</span>
												<span class="sr-only">GitHub stars: </span>
												{formatStarCount(projectStars[repository])}
											</span>
										{/if}
									</div>
									{#if project.description}
										<p class="text-sm text-zinc-400 max-w-2xl leading-relaxed pt-1">
											{project.description}
										</p>
									{/if}
								</div>

								<div class="flex items-center justify-between gap-2 sm:gap-4 shrink-0">
									<span class="text-sm font-mono text-zinc-400 group-hover:text-white transition-colors">
										{project.link.replace("https://", "")}
									</span>
									<span class="text-sm text-zinc-400 group-hover:text-white group-hover:translate-x-1 transition-all"> → </span>
								</div>
							</a>
						{/each}
					</div>
				</section>

				<section class="space-y-6">
					<h2 class="text-sm font-mono uppercase text-zinc-400">Experience</h2>

					<div class="divide-y divide-white/[0.06] border-y border-white/[0.06]">
						{#each person.history as job}
							<div class="py-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-8">
								<div class="space-y-1">
									<div class="flex items-center gap-3">
										<h3 class="text-base font-medium text-white">
											{job.company}
										</h3>
										<span class="text-sm text-zinc-400">•</span>
										<span class="text-sm text-zinc-300">{job.role}</span>
									</div>
									{#if job.description}
										<p class="text-sm text-zinc-400 max-w-2xl leading-relaxed pt-1">
											{job.description}
										</p>
									{/if}
								</div>

								<span class="text-sm font-mono uppercase tracking-wider text-zinc-400 shrink-0">
									{job.start} — {job.end}
								</span>
							</div>
						{/each}
					</div>
				</section>

				{#if person.quote}
					<footer class="pt-12 pb-8 border-t border-white/[0.08]">
						<figure class="max-w-3xl mx-auto text-center space-y-6">
							<blockquote class="text-xl sm:text-2xl md:text-3xl font-light leading-relaxed tracking-tight text-zinc-200">
								“{person.quote}”
							</blockquote>
							<figcaption class="text-sm font-mono uppercase text-zinc-400">
								— {person?.author || person.name}
							</figcaption>
						</figure>
					</footer>
				{/if}
			</main>
		</div>

		{#if person.user !== "nullure"}
			<div class="fixed bottom-0 inset-x-0 h-[18svh] overflow-hidden z-50 pointer-events-none will-change-[opacity]" style:opacity={mainRevealProgress} style:visibility={mainRevealProgress <= 0.01 ? "hidden" : "visible"}>
				<div class="absolute inset-y-0 left-0 flex w-[400vw] brightness-[0.35] contrast-125 will-change-transform" style:transform="translate3d(-{(offset * 0.4) % groundCycleWidth}px, 0, 0)">
					<div class="h-full w-screen shrink-0 bg-cover bg-[url('/assets/images/idk/55.png')]"></div>
					<div class="h-full w-screen shrink-0 bg-cover bg-[url('/assets/images/idk/55.png')] -scale-x-100"></div>
					<div class="h-full w-screen shrink-0 bg-cover bg-[url('/assets/images/idk/55.png')]"></div>
					<div class="h-full w-screen shrink-0 bg-cover bg-[url('/assets/images/idk/55.png')] -scale-x-100"></div>
				</div>
				<div class="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
				<div class="absolute left-4 bottom-4 text-zinc-400">This foreground visual is a feature, not a bug.</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.nullure-profile {
		isolation: isolate;
		background:
			radial-gradient(ellipse 72% 24% at 12% 0%, rgba(34, 211, 238, 0.075), transparent 72%),
			radial-gradient(ellipse 66% 23% at 50% 0%, rgba(168, 85, 247, 0.065), transparent 70%),
			radial-gradient(ellipse 72% 24% at 88% 0%, rgba(244, 63, 94, 0.07), transparent 72%),
			#000;
	}

	.nullure-profile::before {
		content: "";
		position: absolute;
		inset: 0 0 auto;
		height: 1px;
		pointer-events: none;
		background: linear-gradient(90deg, rgba(34, 211, 238, 0.32), rgba(168, 85, 247, 0.22) 50%, rgba(244, 63, 94, 0.3));
		box-shadow: 0 8px 30px rgba(139, 92, 246, 0.06);
	}

	.nullure-hero-scene {
		position: absolute;
		inset: 0;
		z-index: 10;
		overflow: hidden;
		isolation: isolate;
		background:
			radial-gradient(ellipse 48% 46% at 67% 35%, rgba(104, 8, 19, 0.23), transparent 72%),
			linear-gradient(180deg, #02050f 0%, #07091b 53%, #010207 100%);
		transition: opacity 180ms linear;
	}

	.nullure-hero-stars,
	.nullure-hero-moon-halo,
	.nullure-hero-fog,
	.nullure-hero-vignette,
	.nullure-hero-moon,
	.nullure-hero-castle,
	.nullure-hero-cliff {
		position: absolute;
		pointer-events: none;
	}

	.nullure-hero-stars {
		inset: 0 0 22%;
		z-index: 1;
		opacity: 0.55;
		background-image:
			radial-gradient(circle at 12% 21%, rgba(255, 255, 255, 0.74) 0 1px, transparent 1.6px),
			radial-gradient(circle at 33% 12%, rgba(255, 255, 255, 0.44) 0 1px, transparent 1.4px),
			radial-gradient(circle at 81% 26%, rgba(255, 255, 255, 0.64) 0 1px, transparent 1.6px),
			radial-gradient(circle at 72% 9%, rgba(255, 255, 255, 0.42) 0 1px, transparent 1.5px),
			radial-gradient(circle at 47% 37%, rgba(255, 255, 255, 0.3) 0 1px, transparent 1.4px);
		background-size: 197px 173px, 263px 239px, 229px 207px, 311px 277px, 173px 191px;
	}

	.nullure-hero-moon,
	.nullure-hero-castle,
	.nullure-hero-cliff {
		max-width: none;
	}

	.nullure-hero-moon-halo {
		z-index: 2;
		width: min(58vw, 55rem);
		aspect-ratio: 1;
		right: 0;
		top: -6vh;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(150, 16, 34, 0.38) 0%, rgba(113, 8, 22, 0.18) 43%, transparent 71%);
		filter: blur(18px);
		animation: nullure-moon-breathe 9s ease-in-out infinite;
	}

	.nullure-hero-moon {
		z-index: 3;
		width: min(49vw, 46rem);
		height: auto;
		right: 4vw;
		top: -4vh;
		opacity: 0.9;
		mix-blend-mode: screen;
		will-change: transform;
	}

	.nullure-hero-fog {
		z-index: 4;
		inset: 39% -16% 16%;
		opacity: 0.4;
		background:
			radial-gradient(ellipse 36% 20% at 22% 47%, rgba(142, 151, 177, 0.25), transparent 74%),
			radial-gradient(ellipse 44% 24% at 64% 53%, rgba(94, 102, 133, 0.22), transparent 73%),
			radial-gradient(ellipse 32% 18% at 89% 42%, rgba(122, 34, 45, 0.13), transparent 74%);
		filter: blur(23px);
		animation: nullure-fog-drift 18s ease-in-out infinite alternate;
	}

	.nullure-hero-castle {
		z-index: 5;
		width: min(23vw, 22rem);
		height: auto;
		left: 27vw;
		bottom: 27vh;
		opacity: 0.62;
		filter: brightness(1.55) contrast(1.3) drop-shadow(0 0 14px rgba(157, 20, 37, 0.28));
		will-change: transform;
	}

	.nullure-hero-cliff {
		z-index: 6;
		width: max(112vw, 112rem);
		height: auto;
		left: 50%;
		bottom: -26vh;
		translate: -50% 0;
		opacity: 0.93;
		filter: contrast(1.23) brightness(0.52) sepia(0.18) saturate(0.72) drop-shadow(0 -8px 13px rgba(119, 13, 29, 0.2));
		mask-image: linear-gradient(to bottom, transparent 0%, black 20%, black 100%);
		-webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 20%, black 100%);
		will-change: transform;
	}

	.nullure-hero-vignette {
		z-index: 7;
		inset: 0;
		background:
			linear-gradient(180deg, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.1) 54%, rgba(0, 0, 0, 0.68) 100%),
			radial-gradient(ellipse at center, transparent 24%, rgba(0, 0, 0, 0.52) 100%);
	}

	@keyframes nullure-moon-breathe {
		0%, 100% { opacity: 0.62; transform: scale(0.98); }
		50% { opacity: 0.94; transform: scale(1.03); }
	}

	@keyframes nullure-fog-drift {
		0% { transform: translate3d(-2%, 1%, 0) scale(1); }
		100% { transform: translate3d(3%, -2%, 0) scale(1.07); }
	}

	@media (max-width: 640px) {
		.nullure-hero-moon-halo {
			width: 94vw;
			right: -2vw;
			top: 3vh;
		}

		.nullure-hero-moon {
			width: 76vw;
			right: 4vw;
			top: 5vh;
		}

		.nullure-hero-castle {
			width: 43vw;
			left: 17vw;
			bottom: 30vh;
		}

		.nullure-hero-cliff {
			width: 208vw;
			bottom: -10vh;
		}

		.nullure-hero-fog {
			inset: 44% -42% 18%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.nullure-hero-moon-halo,
		.nullure-hero-fog {
			animation: none;
		}
	}
</style>
