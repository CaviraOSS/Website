<script>
	import { fly, fade } from "svelte/transition";
	import { cubicOut, cubicInOut } from "svelte/easing";
	import icons from "$lib/icons";

	let menuOpen = $state(false);

	function handleKeydown(e) {
		if (e.key === "Escape" && menuOpen) {
			menuOpen = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="fixed top-6 right-6 p-3 z-40">
	<button
		onclick={() => (menuOpen = true)}
		class="bg-stone-900/80 hover:bg-stone-800 border border-stone-800/80 backdrop-blur-md rounded-full px-6 py-2.5 text-zinc-200 flex items-center gap-2.5 text-base font-medium shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 group"
		aria-label="Open Menu"
	>
		{@html icons.get("compass", "size-5 transition-transform duration-500 group-hover:rotate-45")}
		<span>Menu</span>
	</button>
</div>

{#if menuOpen}
	<button tabindex="-1" onclick={() => (menuOpen = false)} transition:fade={{ duration: 400, easing: cubicInOut }} class="fixed inset-0 bg-stone-950/60 backdrop-blur-md z-50 w-full h-full border-none cursor-default" aria-label="Close menu backdrop"></button>

	<div transition:fly={{ x: "100%", duration: 500, easing: cubicOut }} class="fixed right-0 top-0 h-svh max-w-xl w-full z-50 pointer-events-auto border-l border-stone-800/60 bg-stone-950/50 backdrop-blur-2xl shadow-2xl flex flex-col justify-between overflow-hidden">
		<img src="/assets/logo.png" alt="logo" transition:fade={{ duration: 700, delay: 200 }} class="size-80 m-auto absolute top-1/2 -translate-y-1/2 right-4 opacity-10 pointer-events-none select-none blur-[1px]" />

		<div class="w-full p-8 flex items-center justify-between z-10">
			<h1 class="text-2xl font-bricolage tracking-wide text-zinc-100">Cavira</h1>
			<button onclick={() => (menuOpen = false)} class="bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-full px-5 py-2 text-zinc-300 hover:text-white flex items-center gap-2 text-base transition-all duration-300 active:scale-95" aria-label="Close Menu">
				{@html icons.get("cross", "size-5")}
				<span>Close</span>
			</button>
		</div>

		<div class="flex flex-col gap-6 text-6xl px-10 font-bricolage z-10 my-auto">
			{#each ["Projects", "Contact", "About"] as item, i}
				<div transition:fly={{ x: 50, duration: 400, delay: 150 + i * 70, easing: cubicOut }}>
					<button class="text-left group text-zinc-400 hover:text-white transition-colors duration-300 flex items-center gap-4 overflow-hidden py-1">
						<span class="text-lg font-mono text-stone-600 group-hover:text-stone-400 transition-colors">0{i + 1}</span>

						<span class="relative overflow-hidden inline-block h-[1.10em]">
							<span class="block transition-transform duration-300 ease-out group-hover:-translate-y-full">{item}</span>
							<span class="block absolute top-0 left-0 transition-transform duration-300 ease-out translate-y-full group-hover:translate-y-0 text-white font-medium">{item}</span>
						</span>
					</button>
				</div>
			{/each}
		</div>

		<div transition:fade={{ duration: 400, delay: 350 }} class="w-full p-8 flex items-end justify-between text-lg z-10 border-t border-stone-900/80">
			<div class="flex flex-col">
				<span class="text-white font-medium">Cavira</span>
				<span class="text-zinc-400 uppercase">Family</span>
			</div>

			{#each ["OSS", "LABS", "TECH"] as link}
				<a href="https://github.com/CaviraOSS/Longmemory" target="_blank" rel="noopener noreferrer" class="text-zinc-400 hover:text-white transition-colors duration-200 flex items-center gap-1.5 group font-mono">
					<span>{link}</span>
					{@html icons.get("arrowTop", "size-4 rotate-45 text-stone-500 group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200")}
				</a>
			{/each}
		</div>
	</div>
{/if}