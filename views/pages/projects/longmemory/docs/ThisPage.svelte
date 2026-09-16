<script>
	const { data } = $props();

	const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
</script>

<aside class="w-96 fixed right-0 top-0 h-svh flex flex-col p-8 pt-28 overflow-y-auto z-10">
	<!-- <h2 class="text-sm font-semibold text-zinc-500 mb-4">On This Page</h2> -->
	<div class="flex flex-col border-l border-zinc-900">
		{#each data.data as item, x}
			<button class="border-l -ml-px border-transparent hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 text-left pl-5 py-1.5 text-md truncate transition-all duration-200" onclick={() => scrollTo(`section-${x}`)}>
				{item.heading}
			</button>

			{#if item.subitems}
				{#each item.subitems as sub, y}
					<button class="border-l -ml-px border-transparent hover:border-zinc-400 text-zinc-400 hover:text-zinc-300 text-left pl-8 pr-4 py-1 text-md truncate transition-all duration-200" onclick={() => scrollTo(`section-${x}-${y}`)}>
						{sub.heading}
					</button>
				{/each}
			{/if}
		{/each}
	</div>
</aside>