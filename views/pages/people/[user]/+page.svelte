<script>
	import { page } from "$app/stores";
	import Lenis from "lenis";
	import "lenis/dist/lenis.css";
	import Cursor from "$lib/includes/Cursor.svelte";
	import people from "../people";

	const SPEED = 60;
	const SNAP_FORWARD_THRESHOLD = 0.26;
	const SNAP_BACKWARD_THRESHOLD = 0.84;

	let offset = $state(0);
	let scrollY = $state(0);
	let screenWidth = $state(1920);
	let screenHeight = $state(1080);
	let treeWidth = $state(500);

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

<Cursor />

{#if person}
	<div class="relative w-full bg-black selection:bg-white/20 selection:text-white overflow-x-clip">
		<div class="relative w-full h-[350svh] pointer-events-none">
			<div bind:clientWidth={screenWidth} bind:clientHeight={screenHeight} class="sticky top-0 h-svh w-full overflow-hidden">
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

					<div class="md:col-span-12 space-y-4">
						<h2 class="text-sm font-mono uppercase text-zinc-400">Tech Stack</h2>
						<div class="flex flex-wrap gap-2">
							{#each person.stack as stack}
								<span class="px-3 py-1.5 rounded-md bg-zinc-900/70 border border-white/[0.07] text-sm font-medium text-zinc-200">
									{stack}
								</span>
							{/each}
						</div>
					</div>
				</section>

				<section class="space-y-6">
					<div class="flex items-center justify-between">
						<h2 class="text-sm font-mono uppercase text-zinc-400">Selected Works</h2>
						<span class="text-sm font-mono text-zinc-400">0{person.projects.length}</span>
					</div>

					<div class="divide-y divide-white/[0.06] border-y border-white/[0.06]">
						{#each person.projects as project}
							<a href={project.link} target="_blank" rel="noopener noreferrer" class="group py-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-8">
								<div class="space-y-1">
									<div class="flex items-center gap-3">
										<h3 class="text-base font-medium text-white group-hover:text-zinc-200 transition-colors">
											{project.name}
										</h3>
										<span class="text-sm text-zinc-400">•</span>
										<span class="text-sm text-zinc-300">{project.tag}</span>
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
	</div>
{/if}
