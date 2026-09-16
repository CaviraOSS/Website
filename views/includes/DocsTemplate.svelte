<script>
	import Copy from "$lib/components/Copy.svelte";
	const { item, x } = $props();
</script>

{#if item.paragraphs}
	{#each item.paragraphs as block}
		{#if typeof block === "string"}
			<p class="mb-4 text-lg">{block}</p>
		{:else if block?.data}
			<div class="bg-black rounded-xl mb-4 p-1 overflow-x-auto border border-white/10">
				<div class="w-full flex items-center justify-between p-2 pt-1">
					<span class="text-zinc-400 pl-1">{block.lang}</span>
					<Copy data={block.data} />
				</div>
				<pre class="p-4 bg-white/5 shadow-lg border border-white/5 rounded-t-xl rounded-b-lg"><code class="font-metrophobic">{block.data}</code></pre>
			</div>
		{/if}
	{/each}
{/if}

{#if item.subitems}
	{#each item.subitems as sub, y}
		<div class="ml-2 mt-4 mb-2">
			<h2 id="section-{x}-{y}" class="text-2xl mb-4 text-zinc-200 font-medium scroll-mt-6">{sub.heading}</h2>
			{#if sub.paragraphs}
				{#each sub.paragraphs as block}
					{#if typeof block === "string"}
						<p class="mb-4 text-lg">{block}</p>
					{:else if block?.data}
						<div class="bg-black rounded-xl mb-4 p-1 overflow-x-auto border border-white/10">
							<div class="w-full flex items-center justify-between p-2 pt-1">
								<span class="text-zinc-400 pl-1">{block.lang}</span>
								<Copy data={block.data} />
							</div>
							<pre class="p-4 bg-white/5 shadow-lg border border-white/5 rounded-t-xl rounded-b-lg"><code class="font-metrophobic">{block.data}</code></pre>
						</div>
					{/if}
				{/each}
			{/if}
		</div>
	{/each}
{/if}

<div class="mb-8 border-b border-zinc-900/40 pb-4"></div>