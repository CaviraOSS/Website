<script>
	import { page } from "$app/stores";
	import Lenis from "lenis";
	import "lenis/dist/lenis.css";
	import icons from "$lib/icons";
	import Cursor from "$lib/includes/Cursor.svelte";
	import Footer from "$lib/includes/Footer.svelte";
	import people from "../people";

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

	const person = people.find((p) => p.user === $page.params.user);
</script>

<Cursor />

<div class="relative w-screen min-h-svh bg-black text-zinc-300 flex flex-col antialiased selection:bg-zinc-800 selection:text-white">
	<div class="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_50%_50%_at_50%_0%,rgba(255,255,255,0.04),transparent)]"></div>

	<main class="relative z-10 max-w-5xl mx-auto w-full px-6 sm:px-10 md:px-16 py-16 sm:py-24 space-y-20">
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
				<div class="flex items-center gap-2.5 self-start sm:self-center">
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

			<div class="grid grid-cols-1 gap-8">
				{#each person.projects as project}
					<a href={project.link} target="_blank" rel="noopener noreferrer" class="py-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-8">
						<div class="space-y-1">
							<div class="flex items-center gap-3">
								<h3 class="text-base font-medium text-white">
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

						<div class="flex items-center justify-between gap-2 sm:gap-4">
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
