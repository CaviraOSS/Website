<script>
	import { onMount } from "svelte";
	import Lenis from "lenis";
	import "lenis/dist/lenis.css";
	import icons from "$lib/icons";
	import Loader from "$lib/includes/Loader.svelte";
	import Cursor from "$lib/includes/Cursor.svelte";
	import Aside from "$lib/includes/Aside.svelte";
	import Clock from "$lib/includes/Clock.svelte";

	let textWrapper = $state(null);
	let scrollProgress = $state(0);

	const text = "We’re devoted to building open, reliable tools that support the development of intelligent systems and help shape the future of technology.";
	const words = text.split(" ");

	$effect(() => {
		const lenis = new Lenis({
			autoRaf: true,
			duration: 1.3,
			easing: (t) => Math.min(1, 1.001 - Math.pow(1.8, -10 * t)),
			orientation: "vertical",
			gestureOrientation: "vertical",
			smoothWheel: true,
			wheelMultiplier: 1,
			smoothTouch: false,
			touchMultiplier: 2,
		});

		const handleScroll = () => {
			if (!textWrapper) return;
			const start = textWrapper.offsetTop;
			const distance = textWrapper.offsetHeight - window.innerHeight;

			let p = (window.scrollY - start) / distance;
			scrollProgress = Math.max(0, Math.min(1, p));
		};

		lenis.on("scroll", handleScroll);
		window.addEventListener("scroll", handleScroll);

		handleScroll();

		return () => {
			lenis.destroy();
			window.removeEventListener("scroll", handleScroll);
		};
	});

	const projects = [
		{
			year: 2026,
			name: "Akashic",
			division: "OSS",
			type: "AI, OSINT, OPSEC",
		},
		{
			year: 2026,
			name: "Minecraft manager",
			division: "LABS",
			type: "Productivity",
		},
		{
			year: 2025,
			name: "LongMemory",
			division: "OSS",
			type: "AI",
			link: "/projects/longmemory",
		},
		{
			year: 2025,
			name: "PageLM",
			division: "OSS",
			type: "AI, Ed Tech",
		},
		{
			year: 2024,
			name: "Aternity",
			division: "LABS",
			type: "Productivity",
		},
		{
			year: 2024,
			name: "SonarX",
			division: "LABS",
			type: "Cybersecurity",
		},
		{
			year: 2024,
			name: "IdleStop",
			division: "LABS",
			type: "Productivity",
		},
		{
			year: 2024,
			name: "MOTD",
			division: "LABS",
			type: "Productivity",
		},
		{
			year: 2024,
			name: "Admin logs",
			division: "LABS",
			type: "Productivity",
		},
		{
			year: 2024,
			name: "Subdomains manager",
			division: "LABS",
			type: "Productivity",
		},
	];
</script>

<Cursor />
<div class="bg-black min-h-svh w-screen text-neutral-300 overflow-clip relative hidden md:block">
	<div class="absolute w-screen h-screen z-50 pointer-events-none">
		<Loader />
	</div>
	<Aside />

	<section class="w-full h-svh flex sticky top-0 z-0">
		<div class="w-full h-full flex flex-col items-end justify-between p-8 md:p-20 md:pt-8">
			<div class="absolute top-1/2 -translate-y-1/2 left-0 w-full scale-150 z-0">
				<Clock />
				<div class="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black"></div>
			</div>
			<div class="text-4xl max-w-4xl text-left w-full font-funnel flex items-end z-10">
				<h1>cavira</h1>
				<span class="text-stone-500 text-2xl">.app</span>
			</div>
			<h1 class="text-6xl md:text-9xl mt-10 text-stone-200 font-bricolage tracking-tight ml-auto max-w-5xl text-right z-20">
				Building tools to push humanity toward the next
				<span class="inline-flex italic"> Era </span>
			</h1>
			<div class="w-full max-w-4xl relative z-20">
				<div class="flex items-center justify-between">
					<span class="text-lg text-zinc-400 uppercase tracking-wider">Explore</span>
					<div class="w-full bg-gradient-to-l from-white/50 h-px"></div>
				</div>
				<div class="flex items-center justify-between text-3xl font-bricolage z-10 mt-10">
					{#each [{ href: "https://github.com/CaviraOSS", text: "OSS" }, { href: "https://builtbybit.com/creators/cavira.551679/", text: "LABS" }, { href: "mailto:hi@cavira.app", text: "hi@cavira.app" }] as item, i}
						<div transition:fly={{ x: 50, duration: 400, delay: 150 + i * 70, easing: cubicOut }}>
							<a href={item.href} target={item.href.startsWith('http') ? '_blank' : '_self'} class="text-left group text-zinc-400 hover:text-white transition-colors duration-300 flex items-center gap-4 overflow-hidden py-1">
								<span class="relative overflow-hidden inline-block h-[1.10em]">
									<span class="block transition-transform duration-300 ease-out group-hover:-translate-y-full pr-1">{item.text}</span>
									<span class="block absolute top-0 left-0 transition-transform duration-300 ease-out translate-y-full group-hover:translate-y-0 text-white font-medium">{item.text}</span>
								</span>
								{@html icons.get("arrowTop", "size-6 rotate-45 text-stone-500 group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200 -ml-2")}
							</a>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<section bind:this={textWrapper} class="w-full h-[250vh] relative z-10 bg-black">
		<div class="w-full h-svh sticky top-0 flex flex-col justify-center mx-auto p-8 md:p-20">
			<p class="text-3xl md:text-5xl lg:text-7xl mt-10 font-light leading-[1.3] tracking-wide text-center mx-auto max-w-6xl flex flex-wrap justify-center gap-x-[0.3em] gap-y-[0.2em]">
				{#each words as word, i}
					{@const wordStart = (i / words.length) * 0.8}
					{@const wordEnd = wordStart + 0.2}
					{@const wordP = Math.max(0, Math.min(1, (scrollProgress - wordStart) / (wordEnd - wordStart)))}
					{@const blurAmount = Math.sin(wordP * Math.PI) * 4}

					<span
						class="inline-block will-change-[filter,color,transform]"
						style="
                            color: color-mix(in srgb, #ffffff {wordP * 100}%, #3f3f46);
                            filter: blur({blurAmount}px);
                            transform: translateY({(1 - wordP) * 4}px);
                        ">
						{word}
					</span>
				{/each}
			</p>
		</div>
	</section>

	<section id="projects" class="w-full min-h-svh sticky top-0 z-20 p-10 bg-black flex flex-col">
		<h1 class="text-4xl">Projects</h1>
		<div class="relative w-full m-auto flex-shrink-0 bg-black py-28 flex flex-col items-center justify-center select-none font-sans overflow-hidden">
			<div class="absolute inset-0 pointer-events-none flex items-center justify-center" style="-webkit-mask-image: radial-gradient(ellipse 65% 70% at 50% 50%, #000 25%, transparent 100%); mask-image: radial-gradient(ellipse 65% 70% at 50% 50%, #000 25%, transparent 100%);">
				<div class="w-full max-w-7xl h-[300%] border-x border-white/50 relative"></div>
			</div>
			<div class="absolute top-28 h-px w-full bg-gradient-to-r from-transparent via-white to-transparent"></div>

			<div class="relative z-10 w-full max-w-7xl bg-black p-6 md:p-10 md:pb-4 flex flex-col font-sans select-none border border-white/20">
				<div class="grid grid-cols-12 text-sm uppercase tracking-widest text-zinc-400 pb-4 mb-2">
					<span class="col-span-2 md:col-span-1">Year</span>
					<span class="col-span-5 md:col-span-6">Project</span>
					<span class="col-span-2 md:col-span-3 text-left">Division</span>
					<span class="col-span-3 md:col-span-2 text-right">Type</span>
				</div>

				<div class="group/table flex flex-col">
					{#each projects as project, i}
						<a href={project.link} class="group/row grid grid-cols-12 items-center py-3 border-b border-zinc-900 text-zinc-400 transition-all duration-300 ease-out group-hover/table:opacity-25 hover:!opacity-100 hover:border-zinc-700/80 cursor-pointer">
							<span class="col-span-2 md:col-span-1 font-mono text-xs md:text-sm text-zinc-400 group-hover/row:text-zinc-300 transition-colors">{project.year}</span>
							<div class="col-span-5 md:col-span-6 flex items-center gap-2">
								<span class="text-lg md:text-2xl font-normal font-funnel group-hover/row:text-white group-hover/row:translate-x-1.5 transition-all duration-300"> {project.name} </span>
								{@html icons.get("arrowTop", "opacity-0 size-6 rotate-45 ml-2 -translate-x-2 group-hover/row:opacity-100 group-hover/row:translate-x-0 transition-all duration-300 text-zinc-400")}
							</div>
							<span class="col-span-2 md:col-span-3 text-left text-sm uppercase tracking-wider text-zinc-400 group-hover/row:text-zinc-300">{project.division}</span>
							<span class="col-span-3 md:col-span-2 text-right font-mono text-xs md:text-sm text-zinc-400 group-hover/row:text-zinc-300">{project.type}</span>
						</a>
					{/each}
				</div>
			</div>
			<div class="absolute bottom-28 h-px w-full bg-gradient-to-r from-transparent via-white to-transparent"></div>
		</div>
	</section>

	<section id="footer" class="w-full min-h-svh sticky top-0 z-20 p-10 bg-black flex flex-col">
		<h1 class="text-4xl">THE END</h1>
		<div class="relative h-[50vh] w-full flex flex-col items-center justify-center">
			<span class="text-2xl">Reach us at</span>
			<a href="mailto:hi@cavira.app" class="text-4xl hover:text-white hover:underline underline-offset-4">hi@cavira.app</a>
		</div>
		<div class="w-full flex items-center absolute bottom-0 left-4">
			{@html icons.get("Cavira", "w-full text-zinc-600 bottom-0 py-8")}
			<div class="h-[20vh] mx-10 w-px bg-white/20 rounded-full"></div>
			<div class="w-96 h-[40vh] flex-shrink-0 flex flex-col justify-between py-10 px-4">
				<div class="flex flex-col gap-1 -ml-4 w-full pr-8">
					<a href="https://cavira.app/discord" target="_blank" class="w-full px-4 py-2 hover:bg-stone-900 rounded-full flex items-center">
						{@html icons.get("discord", "size-6")}
						<span class="ml-2">Discord</span>
						{@html icons.get("arrowTop", "size-5 rotate-45 ml-auto")}
					</a>
					<a href="https://github.com/CaviraOSS" target="_blank" class="w-full px-4 py-2 hover:bg-stone-900 rounded-full flex items-center">
						{@html icons.get("github", "size-6")}
						<span class="ml-2">GitHub</span>
						{@html icons.get("arrowTop", "size-5 rotate-45 ml-auto")}
					</a>
					<a href="https://www.linkedin.com/company/caviraoss" target="_blank" class="w-full px-4 py-2 hover:bg-stone-900 rounded-full flex items-center">
						<div class="size-6"></div>
						<span class="ml-2">LinkedIn</span>
						{@html icons.get("arrowTop", "size-5 rotate-45 ml-auto")}
					</a>
				</div>
				<div class="flex items-center gap-2 text-xl">
					<span class="text-zinc-400">&copy; 2026</span>
					<span class="text-zinc-300">Cavira</span>
				</div>
			</div>
		</div>
	</section>
</div>
<main class="bg-black text-zinc-300 h-svh flex items-center justify-center p-6 sm:p-12 antialiased overflow-y-auto md:hidden">
	<div class="max-w-3xl w-full my-auto space-y-12">
		<header class="space-y-3">
			<div class="flex items-center gap-1">
				<img src="./assets/logo.png" alt="logo" class="size-8 sm:size-10" />
				<h1 class="text-3xl sm:text-4xl text-white font-medium tracking-tight">Cavira</h1>
			</div>
			<p class="text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed font-light">We're a team of misfits who love to create amazing things across multiple domains.</p>
		</header>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-12">
			<section>
				<h2 class="text-sm text-zinc-400">Projects</h2>

				<div class="space-y-4 mt-2">
					<a href="/projects/longmemory" target="_blank" class="group block space-y-1">
						<span class="font-medium text-base text-zinc-200 group-hover:text-white">LongMemory</span>
						<p class="text-xs sm:text-sm text-zinc-400 group-hover:text-zinc-300 leading-relaxed font-light">View the LongMemory project.</p>
					</a>
					<a href="https://github.com/CaviraOSS" target="_blank" class="group block space-y-1">
						<span class="font-medium text-base text-zinc-200 group-hover:text-white">GitHub <span class="text-zinc-400">(9)</span></span>
						<p class="text-xs sm:text-sm text-zinc-400 group-hover:text-zinc-300 leading-relaxed font-light">View all of our open-source projects on GitHub, including tools, libraries, and utilities that we've built for the community.</p>
					</a>
					<a href="https://builtbybit.com/creators/cavira.551679/" target="_blank" class="group block space-y-1">
						<span class="font-medium text-base text-zinc-200 group-hover:text-white">BuiltByBit <span class="text-zinc-400">(7)</span></span>
						<p class="text-xs sm:text-sm text-zinc-400 group-hover:text-zinc-300 leading-relaxed font-light">View all of our projects on BuiltByBit.</p>
					</a>
				</div>
			</section>

			<section>
				<h2 class="text-sm text-zinc-400">Contact us</h2>

				<div class="space-y-4 mt-2">
					<a href="mailto:hi@cavira.app" target="_blank" class="group block space-y-1">
						<div class="text-zinc-200 group-hover:text-white font-medium text-base transition-colors">Email</div>
						<p class="text-xs sm:text-sm text-zinc-400 group-hover:text-zinc-300 font-light">hi@cavira.app</p>
					</a>

					<a href="https://github.com/CaviraOSS" target="_blank" rel="noopener noreferrer" class="group block space-y-1">
						<div class="text-zinc-200 group-hover:text-white font-medium text-base transition-colors">GitHub</div>
						<p class="text-xs sm:text-sm text-zinc-400 group-hover:text-zinc-300 font-light">github.com/CaviraOSS</p>
					</a>

					<a href="https://cavira.app/discord" target="_blank" rel="noopener noreferrer" class="group block space-y-1">
						<div class="text-zinc-200 group-hover:text-white font-medium text-base transition-colors">Discord</div>
						<p class="text-xs sm:text-sm text-zinc-400 group-hover:text-zinc-300 font-light">cavira.app/discord</p>
					</a>
				</div>
			</section>
		</div>
	</div>
</main>
