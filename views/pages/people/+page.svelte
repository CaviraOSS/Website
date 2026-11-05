<script>
	import { onMount } from "svelte";
	import Lenis from "lenis";
	import "lenis/dist/lenis.css";
	import icons from "$lib/icons";
	import Loader from "$lib/includes/Loader.svelte";
	import Cursor from "$lib/includes/Cursor.svelte";
	import Footer from "$lib/includes/Footer.svelte";

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

	const people = [
		{
			name: "Elvoro",
			user: "recabasic",
			role: "Developer & Designer",
			bio: "The everything guy.",
			image: "https://avatars.githubusercontent.com/u/102372274?v=4",
			links: {
				x: "https://x.com/recabasic",
				github: "https://github.com/recabasic",
				discord: "https://discord.com/users/863452735998656512",
			},
		},
		{
			name: "Morven",
			user: "nullure",
			role: "Developer",
			bio: "The everything guy.",
			image: "https://avatars.githubusercontent.com/u/81895400?v=4",
			links: {
				x: "https://x.com/nullure",
				github: "https://github.com/nullure",
				discord: "https://discord.com/users/838359128295342100",
			},
		},
		{
			name: "EXPress-016",
			user: "",
			role: "Developer",
			bio: "The everything guy.",
			image: "https://avatars.githubusercontent.com/u/74526510?v=4",
			links: {
				x: "https://x.com/EXPress_016",
				github: "https://github.com/EXPress-016",
				discord: "https://discord.com/users/435680396634488842",
			},
		},
	];
</script>

<Cursor />

<div class="bg-black text-neutral-300 min-h-svh w-full flex flex-col antialiased selection:bg-neutral-800 selection:text-white">
	<main class="max-w-7xl mx-auto w-full px-6 sm:px-10 md:px-16 py-12 sm:py-16">
		<h1 class="text-4xl text-white">People</h1>
		<p class="text-lg text-neutral-400">Meet the people behind our work.</p>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
			{#each people as person}
				<div class="group relative flex flex-col justify-between border border-zinc-900 hover:border-zinc-800 p-5 transition-all duration-500 hover:bg-zinc-900/20">
					<div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

					<div>
						<div class="relative w-full h-52 mb-5 overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/5">
							<img src={person.image} alt={person.name} class="w-full h-full object-cover object-center grayscale-[25%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out" />
							<div class="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent opacity-60"></div>
						</div>

						<div class="flex items-baseline justify-between gap-2">
							<h2 class="text-lg font-medium tracking-tight text-zinc-100 group-hover:text-white transition-colors">
								{person.name}
							</h2>
							{#if person.user}
								<span class="text-xs font-mono text-zinc-500 group-hover:text-zinc-400 transition-colors">
									@{person.user}
								</span>
							{/if}
						</div>

						<p class="text-xs font-medium uppercase tracking-wider text-zinc-400 mt-1">
							{person.role}
						</p>

						<p class="mt-3 text-sm leading-relaxed text-zinc-500 font-normal">
							{person.bio}
						</p>
					</div>

					{#if person.links && Object.keys(person.links).length > 0}
						<div class="flex flex-wrap items-center gap-4 mt-6 border-t border-zinc-900/80">
							{#each Object.entries(person.links) as [k, v]}
								<a href={v} target="_blank" rel="noopener noreferrer" class="group/link inline-flex items-center gap-1 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors capitalize">
									<span class="transition-transform duration-200 ease-out group-hover/link:-translate-y-0.5">{k}</span>
									{@html icons.get('arrowTop', 'size-4 rotate-45 opacity-60 group-hover/link:opacity-100 transition-all duration-200 ease-out group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5')}
								</a>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</main>

	<Footer />
</div>
