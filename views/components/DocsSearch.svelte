<script>
	import { tick } from "svelte";
	import icons from "$lib/icons";
	import { create_docs_search } from "$lib/utils/docs-search";

	let { open = $bindable(false), links = [], loading = false, error = "", onselect = () => {}, onretry = () => {} } = $props();
	let dialog;
	let input;
	let query = $state("");
	let active = $state(0);
	const index = $derived(create_docs_search(links));
	const results = $derived(index.recall(query));

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) show();
		else if (!open && dialog.open) dialog.close();
	});

	$effect(() => {
		query;
		active = 0;
	});

	function show() {
		query = "";
		active = 0;
		open = true;
		if (dialog && !dialog.open) dialog.showModal();
		input?.focus();
	}

	function close() {
		open = false;
		dialog?.close();
	}

	function choose(result) {
		close();
		onselect(result);
	}

	async function keydown(event) {
		if (event.key === "Escape" && !event.isComposing) {
			event.preventDefault();
			close();
			return;
		}
		if (event.isComposing || loading || error) return;
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault();
			if (!results.length) return;
			active = (active + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length;
			await tick();
			dialog.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
		} else if (event.key === "Enter" && results[active]) {
			event.preventDefault();
			choose(results[active]);
		}
	}

	function shortcut(event) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
			event.preventDefault();
			if (dialog?.open) close();
			else show();
		}
	}

	function backdrop(event) {
		if (event.target !== dialog) return;
		const bounds = dialog.getBoundingClientRect();
		if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
	}
</script>

<svelte:window onkeydown={shortcut} />

<dialog bind:this={dialog} id="longmemory-doc-search" aria-labelledby="docs-search-title" onclose={() => { if (!dialog.open) open = false; }} onclick={backdrop} class="fixed inset-0 m-auto w-[calc(100%-1.5rem)] max-w-2xl max-h-[calc(100svh-2rem)] overflow-hidden rounded-lg border border-zinc-800 bg-black p-0 text-zinc-200 shadow-2xl font-funnel">
	<div class="flex items-center justify-between gap-4 border-b border-zinc-800 px-4 py-3">
		<div class="flex items-center gap-3 min-w-0">
			{@html icons.get("Longmemory", "h-4 w-auto max-w-[120px] text-zinc-100")}
			<h2 id="docs-search-title" class="text-sm text-zinc-400">Documentation search</h2>
		</div>
		<button type="button" onclick={close} aria-label="Close search" title="Close search" class="size-9 shrink-0 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900">
			{@html icons.get("cross", "size-5")}
		</button>
	</div>
	<div class="flex items-center gap-3 px-5 py-4 border-b border-zinc-900">
		{@html icons.get("search", "size-5 shrink-0 text-zinc-500")}
		<input bind:this={input} bind:value={query} onkeydown={keydown} type="search" maxlength="300" placeholder="Search documentation..." aria-label="Search documentation" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls="docs-search-results" aria-activedescendant={results[active] && !loading && !error ? `docs-result-${active}` : undefined} class="min-w-0 w-full bg-transparent text-base text-zinc-100 placeholder:text-zinc-600 outline-none" />
	</div>
	<div class="min-h-0 overflow-y-auto overscroll-contain max-h-[55svh] p-2">
		{#if loading}
			<p role="status" class="px-3 py-8 text-sm text-zinc-500">Loading documentation...</p>
		{:else if error}
			<div role="alert" class="px-3 py-8 text-sm text-zinc-400"><p>{error}</p><button type="button" onclick={onretry} class="mt-3 text-zinc-100 underline underline-offset-4">Retry</button></div>
		{:else}
			<ul id="docs-search-results" role="listbox" aria-label="Documentation results" class="space-y-1">
				{#each results as result, position (result.id)}
					<li role="presentation">
						<button type="button" role="option" id="docs-result-{position}" aria-selected={active === position} onpointermove={() => (active = position)} onclick={() => choose(result)} class="w-full min-w-0 rounded-md px-3 py-3 text-left border transition-colors {active === position ? 'border-zinc-700 bg-zinc-900' : 'border-transparent hover:bg-zinc-950'}">
							<span class="block text-[11px] text-zinc-500 mb-1 break-words">{result.group} / {result.title}</span>
							<span class="block text-sm text-zinc-100 font-medium break-words">{result.heading}</span>
							{#if result.excerpt}<span class="block mt-1 text-xs leading-relaxed text-zinc-400 break-words">{result.excerpt}</span>{/if}
						</button>
					</li>
				{/each}
			</ul>
			{#if !results.length}<p role="status" class="px-3 py-8 text-sm text-zinc-500">No matching documentation.</p>{/if}
		{/if}
	</div>
	<div class="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-900 px-5 py-3 text-[11px] text-zinc-500">
		<span>LongMemory lexical recall</span><span>{index.size} indexed sections</span>
	</div>
</dialog>

<style>
	dialog[open] { display: flex; flex-direction: column; }
	dialog, dialog :global(*) { cursor: auto !important; }
	dialog input { cursor: text !important; }
	dialog button { cursor: pointer !important; }
	dialog::backdrop { background: rgb(0 0 0 / 0.8); backdrop-filter: blur(4px); }
</style>