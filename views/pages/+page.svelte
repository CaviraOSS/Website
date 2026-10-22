<script>
	import { onMount } from "svelte";
	import Lenis from "lenis";
	import "lenis/dist/lenis.css";
	import icons from "$lib/icons";
	import Loader from "$lib/includes/Loader.svelte";
	import Cursor from "$lib/includes/Cursor.svelte";
	/* import Aside from "$lib/includes/Aside.svelte"; */
	import Clock from "$lib/includes/Clock.svelte";

	let textWrapper = $state(null);
	let scrollProgress = $state(0);

	const text = "We are devoted to building open, reliable tools that support the development of intelligent systems and help shape the future of technology.";
	const words = text.split(" ");

	$effect(() => {
		const lenis = new Lenis({
			autoRaf: true,
			duration: 1.1,
			easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
			orientation: "vertical",
			gestureOrientation: "vertical",
			smoothWheel: true,
			wheelMultiplier: 1,
			touchMultiplier: 1.5,
		});

		const handleScroll = () => {
			if (!textWrapper) return;
			const start = textWrapper.offsetTop;
			const distance = textWrapper.offsetHeight - window.innerHeight;

			if (distance <= 0) return;
			const progress = (window.scrollY - start) / distance;
			scrollProgress = Math.max(0, Math.min(1, progress));
		};

		lenis.on("scroll", handleScroll);
		window.addEventListener("scroll", handleScroll, { passive: true });
		handleScroll();

		return () => {
			lenis.destroy();
			window.removeEventListener("scroll", handleScroll);
		};
	});

	const primaryLinks = [
		{ label: "Open Source", href: "https://github.com/CaviraOSS", text: "OSS" },
		{ label: "Commercial Tools", href: "https://builtbybit.com/creators/cavira.551679/", text: "LABS" },
		{ label: "Direct Inquiries", href: "mailto:hi@cavira.app", text: "Contact" },
	];

	const projects = [
		{
			year: 2026,
			name: "Akashic",
			division: "OSS",
			type: "AI, OSINT, OPSEC",
		},
		{
			year: 2026,
			name: "Minecraft Manager",
			division: "LABS",
			type: "Productivity",
		},
		{
			year: 2025,
			name: "LongMemory",
			division: "OSS",
			type: "AI Research",
			link: "/projects/longmemory",
		},
		{
			year: 2025,
			name: "PageLM",
			division: "OSS",
			type: "AI, EdTech",
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
			name: "Admin Logs",
			division: "LABS",
			type: "Productivity",
		},
		{
			year: 2024,
			name: "Subdomains Manager",
			division: "LABS",
			type: "Productivity",
		},
	];
</script>

<Cursor />
<!-- <Aside /> -->
<div class="absolute w-screen h-screen z-50 pointer-events-none">
	<Loader />
</div>

<div class="bg-black text-neutral-300 min-h-screen w-full flex flex-col antialiased selection:bg-neutral-800 selection:text-white">
	<header class="relative min-h-[92svh] md:min-h-screen flex flex-col justify-between p-6 sm:p-10 md:p-14 lg:p-16 border-b border-neutral-900 overflow-hidden">
		<div class="absolute top-1/2 -translate-y-1/2 -left-40 xl:left-0 w-full scale-150 z-0 pointer-events-none">
			<Clock />
			<div class="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black"></div>
		</div>

		<div class="w-full flex items-center justify-between z-10">
			<a href="/" class="flex items-baseline text-2xl sm:text-3xl font-funnel font-medium tracking-tight text-white group">
				cavira<span class="text-neutral-500 font-normal text-xl sm:text-2xl transition-colors group-hover:text-neutral-400">.app</span>
			</a>

			<nav class="flex items-center gap-6 text-xs sm:text-sm text-neutral-400 font-mono">
				<a href="#statement" class="hidden sm:inline hover:text-white transition-colors">Statement</a>
				<a href="#projects" class="hover:text-white transition-colors">Projects</a>
				<a href="#contact" class="hover:text-white transition-colors">Contact</a>
			</nav>
		</div>

		<div class="relative z-10 my-auto py-12 md:py-16 max-w-5xl self-end text-right">
			<h1 class="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bricolage font-normal tracking-tight text-white leading-[1.08] text-balance">
				Building tools to push humanity toward the next
				<span class="font-serif italic text-neutral-300">Era</span>
			</h1>
		</div>

		<div class="relative z-10 w-full max-w-4xl self-end">
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-px border border-neutral-900">
				{#each primaryLinks as item}
					<a href={item.href} target={item.href.startsWith("http") ? "_blank" : "_self"} rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined} class="hover:bg-neutral-950 p-5 sm:p-6 flex flex-col justify-between transition-colors group">
						<div class="flex items-center justify-between text-xs font-mono text-neutral-500 group-hover:text-neutral-300 transition-colors mb-4">
							<span>{item.label}</span>
							{@html icons.get("arrowTop", "size-4 rotate-45 text-neutral-600 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all")}
						</div>

						<span class="text-xl sm:text-2xl font-bricolage text-neutral-200 group-hover:text-white transition-colors">
							{item.text}
						</span>
					</a>
				{/each}
			</div>
		</div>
	</header>

	<section id="statement" bind:this={textWrapper} class="relative bg-black w-full min-h-[160vh] md:min-h-[200vh]">
		<div class="sticky top-0 min-h-screen flex flex-col justify-center items-center px-6 sm:px-12 md:px-16 py-12 max-w-5xl mx-auto">
			<p class="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-snug sm:leading-tight text-center flex flex-wrap justify-center gap-x-[0.25em] gap-y-[0.15em] select-none">
				{#each words as word, i}
					{@const wordStart = (i / words.length) * 0.75}
					{@const wordEnd = wordStart + 0.25}
					{@const wordP = Math.max(0, Math.min(1, (scrollProgress - wordStart) / (wordEnd - wordStart)))}

					<span class="inline-block transition-colors duration-75" style="color: color-mix(in srgb, #ffffff {wordP * 100}%, #262626);">
						{word}
					</span>
				{/each}
			</p>
		</div>
	</section>

	<section id="projects" class="relative bg-black w-full border-t border-neutral-900 py-16 sm:py-20 md:py-24 px-6 sm:px-10 md:px-16">
		<div class="max-w-6xl mx-auto">
			<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-neutral-900">
				<div>
					<h2 class="text-2xl sm:text-3xl font-bricolage text-white">Projects Archive</h2>
					<p class="text-sm text-neutral-500 mt-1">Open-source software, experimental tools, and production utilities.</p>
				</div>
				<span class="font-mono text-xs text-neutral-500">
					{projects.length} Entries
				</span>
			</div>

			<div class="w-full mt-2 divide-y divide-neutral-900">
				<div class="hidden sm:grid sm:grid-cols-12 py-3 text-xs font-mono uppercase tracking-wider text-neutral-500">
					<span class="col-span-2">Year</span>
					<span class="col-span-5">Name</span>
					<span class="col-span-2">Division</span>
					<span class="col-span-3 text-right">Domain</span>
				</div>

				{#each projects as project}
					<svelte:element this={project.link ? "a" : "div"} href={project.link} class="grid grid-cols-1 sm:grid-cols-12 py-3.5 sm:py-3.5 items-start sm:items-center gap-1 sm:gap-0 group transition-colors {project.link ? 'hover:bg-neutral-950/80 cursor-pointer' : ''}">
						<div class="sm:col-span-5 sm:order-2 flex items-center gap-2">
							<span class="text-base sm:text-xl font-medium text-neutral-200 group-hover:text-white transition-colors">
								{project.name}
							</span>
							{#if project.link}
								{@html icons.get("arrowTop", "size-4 rotate-45 text-neutral-500 group-hover:text-white transition-all")}
							{/if}
						</div>

						<div class="sm:hidden text-xs font-mono text-neutral-500">
							<span>{project.year}</span>,
							<span>{project.division}</span>,
							<span>{project.type}</span>
						</div>

						<span class="hidden sm:inline font-mono text-xs text-neutral-500 sm:col-span-2 sm:order-1">
							{project.year}
						</span>

						<div class="hidden sm:block sm:col-span-2 sm:order-3">
							<span class="inline-block text-[11px] font-mono px-2 py-0.5 border border-neutral-800 text-neutral-400">
								{project.division}
							</span>
						</div>

						<span class="hidden sm:inline font-mono text-xs text-neutral-500 sm:col-span-3 sm:text-right sm:order-4">
							{project.type}
						</span>
					</svelte:element>
				{/each}
			</div>
		</div>
	</section>

	<footer id="contact" class="bg-black w-full border-t border-neutral-900 py-16 sm:py-20 px-6 sm:px-10 md:px-16 mt-auto">
		<div class="max-w-6xl mx-auto flex flex-col gap-14">
			<div class="space-y-4">
				<span class="text-neutral-500 uppercase tracking-wider block">Get in touch</span>
				<a href="mailto:hi@cavira.app" class="text-3xl sm:text-5xl md:text-6xl font-bricolage text-white hover:text-neutral-300 transition-colors inline-block break-all"> hi@cavira.app </a>
			</div>

			<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-8 border-t border-neutral-900 text-neutral-500">
				<span>Cavira</span>
				<div class="flex items-center gap-6">
					<a href="https://github.com/CaviraOSS" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">GitHub</a>
					<a href="https://cavira.app/discord" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">Discord</a>
					<a href="https://builtbybit.com/creators/cavira.551679/" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">BuiltByBit</a>
				</div>
				<span aria-label="Established in 2025">MMXXV</span>
			</div>
		</div>
	</footer>
</div>
