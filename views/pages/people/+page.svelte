<script>
	import { onMount } from "svelte";
	import Lenis from "lenis";
	import "lenis/dist/lenis.css";
	import icons from "$lib/icons";
	import Cursor from "$lib/includes/Cursor.svelte";
	import Footer from "$lib/includes/Footer.svelte";
	import people from "./people";

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

		return () => {
			lenis.destroy();
		};
	});
</script>

<Cursor />

<div class="bg-black min-h-svh text-neutral-300 flex flex-col antialiased">
	<main class="max-w-7xl mx-auto w-full px-6 sm:px-10 md:px-16 py-12 sm:py-16">
		<h1 class="text-4xl text-white">People</h1>
		<p class="text-lg text-neutral-400">Meet the people behind our work.</p>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
			{#each people as person}
				<a href="/people/{person.user}" class="group relative flex flex-col justify-between rounded-xl overflow-hidden border border-zinc-900 hover:border-zinc-800 transition-all duration-500 hover:bg-zinc-900/20">
					<div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

					<div class="relative w-full aspect-[5/4] overflow-hidden bg-zinc-900">
						<img src={person.image} alt={person.name} class="w-full h-full object-cover absolute grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out" />
					</div>

					<div class="p-5">
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

						{#if person.links && Object.keys(person.links).length > 0}
							<div class="flex flex-wrap items-center gap-4 mt-4">
								{#each Object.entries(person.links) as [k, v]}
									<a href={v} target="_blank" rel="noopener noreferrer" class="group/link inline-flex items-center gap-1 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors capitalize">
										<span class="transition-transform duration-200 ease-out group-hover/link:-translate-y-0.5">{k}</span>
										{@html icons.get("arrowTop", "size-4 rotate-45 opacity-60 group-hover/link:opacity-100 transition-all duration-200 ease-out group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5")}
									</a>
								{/each}
							</div>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	</main>

	<Footer />
</div>
