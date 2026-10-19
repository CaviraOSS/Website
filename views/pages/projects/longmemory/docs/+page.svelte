<script>
	import { onMount, tick } from "svelte";
	import { goto } from "$app/navigation";
	import { groups, guides, guide_for_pid, docs_href } from "$lib/utils/site";
	import Cursor from "$lib/includes/Cursor.svelte";
	import icons from "$lib/icons/index.js";
	//import Loader from "$lib/includes/Loader.svelte";
	import ThisPage from "./ThisPage.svelte";
	import DocsTemplate from "$lib/includes/DocsTemplate.svelte";
	import DocsSearch from "$lib/components/DocsSearch.svelte";

	const pages = import.meta.glob("./*.svelte", { eager: true });
	let { data = { pid: "0.0" } } = $props();

	const links = groups;
	let activeLink = $derived(data.pid ?? "0.0");
	let expanded = $state({ 0: true });
	let search_open = $state(false);
	let nav_open = $state(false);

	const [linkIdx, itemIdx] = $derived(activeLink.split(".").map(Number));
	const activeGroup = $derived(links[linkIdx]);
	const details = $derived(activeGroup?.items?.[itemIdx]);
	const Page = $derived(pages[`./${details?.file ?? "First"}.svelte`]?.default || null);

	async function read_location() {
		const url = new URL(location.href);
		if (url.searchParams.has("pid")) {
			const guide = guide_for_pid(url.searchParams.get("pid"));
			await goto(docs_href(guide.pid, url.hash.slice(1) || null), { replaceState: true, keepFocus: true, noScroll: true });
		}
		activeLink = guides.find(guide => guide.path === location.pathname.replace(/\/$/, ""))?.pid ?? "0.0";
		await tick();
		const target = document.getElementById(location.hash.slice(1));
		target?.scrollIntoView({ block: "start" });
	}

	async function open_page(pid, anchor = null) {
		nav_open = false;
		await goto(docs_href(pid, anchor), { keepFocus: true, noScroll: true });
		await tick();
		const target = document.getElementById(anchor ?? "docs-content");
		target?.focus({ preventScroll: true });
		if (anchor) target?.scrollIntoView({ block: "start" });
		else window.scrollTo({ top: 0 });
	}

	onMount(() => {
		read_location();
	});

	$effect(() => {
		if (activeGroup) expanded[linkIdx] = true;
	});
</script>

<svelte:window onpopstate={read_location} />
<Cursor />
<DocsSearch bind:open={search_open} {links} onselect={(result) => open_page(result.pid, result.anchor)} />
<!-- <div class="absolute w-screen h-screen z-50 pointer-events-none">
	<Loader />
</div> -->
<div class="bg-black min-h-svh w-full text-zinc-300 overflow-x-hidden relative flex font-funnel">
	<header class="md:hidden fixed inset-x-0 top-0 h-16 z-30 flex items-center justify-between gap-3 px-4 border-b border-zinc-900 bg-black">
		<button type="button" onclick={() => (nav_open = true)} aria-label="Open documentation contents" title="Documentation contents" class="flex items-center gap-2 text-sm text-zinc-400">{@html icons.get("layers", "size-5")}<span>Contents</span></button>
		<button type="button" onclick={() => (search_open = true)} aria-label="Search documentation" aria-haspopup="dialog" aria-controls="longmemory-doc-search" title="Search documentation" class="flex items-center gap-2 px-3 py-2 rounded-md border border-zinc-800">{@html icons.get("search", "size-4")}<span class="text-sm">Search</span></button>
	</header>
	{#if nav_open}<button type="button" aria-label="Close documentation contents" onclick={() => (nav_open = false)} class="md:hidden fixed inset-0 z-30 bg-black/70"></button>{/if}
	<aside class="w-80 xl:w-96 z-40 md:z-10 flex-shrink-0 border-r border-zinc-900 bg-black h-svh fixed top-0 left-0 flex-col justify-between {nav_open ? 'flex' : 'hidden md:flex'}">
		<div class="w-full p-4 flex items-center border-b border-zinc-900 relative z-20">
			<a href="/" aria-label="Cavira home"><img src="/assets/logo.png" alt="Cavira" class="size-12" /></a>
			<div class="w-px bg-zinc-800 h-6 ml-2 mr-4"></div>
			<a href="/projects/longmemory/docs" class="flex flex-col -space-y-1">
				<span class="text-zinc-400">LongMemory</span>
				<span class="text-xl">Documentation</span>
			</a>
			<button type="button" onclick={() => (search_open = true)} aria-label="Search documentation" aria-haspopup="dialog" aria-controls="longmemory-doc-search" title="Search documentation" class="p-2 flex items-center gap-2 bg-white/5 border border-white/5 hover:bg-white/10 ml-auto rounded-md">
				{@html icons.get("search", "size-5")}
				<span class="hidden xl:block text-sm">Search</span>
			</button>
			<button type="button" onclick={() => (nav_open = false)} aria-label="Close documentation contents" title="Close contents" class="md:hidden p-2 ml-1 text-zinc-500">{@html icons.get("cross", "size-5")}</button>
		</div>

		<div class="h-full w-full overflow-y-auto p-4 pb-8 [mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)]">
			{#each links as link, i}
				<div class="flex flex-col mb-4">
					<button class="w-full px-4 py-2 rounded-full flex items-center focus:bg-stone-900 transition-all duration-300 {linkIdx === i ? 'bg-stone-900' : 'hover:bg-stone-900'}" onclick={() => (expanded[i] = !expanded[i])}>
						<span class="text-lg text-zinc-400 font-medium">{i + 1}.</span>
						<span class="ml-2">{link.label}</span>
						{@html icons.get("chevronRight", "size-5 ml-auto transition-all duration-300 " + (expanded[i] ? "rotate-90" : ""))}
					</button>

					<div class="flex flex-col border-l border-stone-900 ml-4 {expanded[i] ? 'h-auto' : 'h-0 overflow-hidden'}">
						{#each link.items as item, x}
							<a
								href={docs_href(`${i}.${x}`)}
								class="border-l w-full -ml-px px-5 py-2 flex items-center transition-all duration-300 {linkIdx === i && itemIdx === x ? 'border-zinc-100 text-zinc-100 font-medium' : 'border-zinc-900 hover:border-zinc-500'}"
								onclick={(event) => { if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); open_page(`${i}.${x}`); } }}
							>
								<span>{item.text}</span>
							</a>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<div class="w-full p-4 border-t border-zinc-900">
			<div class="flex flex-col gap-1 mb-4">
				<a href="#" target="_blank" class="w-full px-4 py-2 hover:bg-stone-900 rounded-full flex items-center">
					{@html icons.get("discord", "size-6")}
					<span class="ml-2">Discord</span>
					{@html icons.get("arrowTop", "size-5 rotate-45 ml-auto")}
				</a>
				<a href="https://github.com/CaviraOSS/LongMemory" target="_blank" class="w-full px-4 py-2 hover:bg-stone-900 rounded-full flex items-center">
					{@html icons.get("github", "size-6")}
					<span class="ml-2">GitHub</span>
					{@html icons.get("arrowTop", "size-5 rotate-45 ml-auto")}
				</a>
			</div>
			<p class="text-sm text-zinc-500 px-4">© 2026 LongMemory licensed under Apache License 2.0.</p>
		</div>
	</aside>
	{#if details?.data}
		<main id="docs-content" tabindex="-1" class="min-w-0 flex-1 md:ml-80 xl:mx-96 flex flex-col px-5 sm:px-8 lg:px-12 pt-20 md:pt-12 outline-none">
			<div class="my-20">
				<p class="text-2xl text-zinc-400">{activeGroup?.label || ""}</p>
				<h1 class="text-4xl mt-1 font-medium text-zinc-100">{details.text}</h1>
			</div>

			{#each details.data as item, x}
				<h2 id="section-{x}" tabindex="-1" class="text-3xl mb-4 text-zinc-200 font-medium scroll-mt-20 md:scroll-mt-6 outline-none">{item.heading}</h2>

				<DocsTemplate {item} {x} />
			{/each}
			<div class="pb-8"></div>
		</main>

		<div class="fixed bottom-0 h-36 w-full pointer-events-none bg-gradient-to-t from-black z-0"></div>

		<div class="hidden xl:block"><ThisPage data={details} /></div>
	{:else if details?.file}
		<Page onGetStarted={() => open_page("0.1")} />
	{:else}
		<div class="my-auto md:ml-80 xl:ml-96 p-8 pt-24">
			<h1 class="text-4xl text-zinc-200">404: Page Not Found</h1>
			<h1 class="text-4xl text-zinc-400 mt-2 font-medium">We're sorry, but the requested content is not available.</h1>
		</div>
	{/if}
</div>
