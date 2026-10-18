<script>
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import Cursor from "$lib/includes/Cursor.svelte";
	import icons from "$lib/icons/index.js";
	//import Loader from "$lib/includes/Loader.svelte";
	import ThisPage from "./ThisPage.svelte";
	import DocsTemplate from "$lib/includes/DocsTemplate.svelte";

	const pages = import.meta.glob("./*.svelte", { eager: true });

	let links = $state([]);
	let activeLink = $state("0.0");
	let expanded = $state({ 0: true });
	let currentPage = $state("First");
	let Page = $derived(pages[`./${currentPage}.svelte`]?.default || null);

	const [linkIdx, itemIdx] = $derived(activeLink.split(".").map(Number));
	const activeGroup = $derived(links[linkIdx]);
	const details = $derived(activeGroup?.items?.[itemIdx]);

	onMount(async () => {
		links = await fetch("/test.json").then((res) => res.json());
		const pid = $page.url.searchParams.get("pid");
		if (pid?.includes(".")) activeLink = pid;
	});

	$effect(() => {
		if (activeGroup) expanded[linkIdx] = true;
		if (details) {
			const url = new URL(location.href);
			url.searchParams.set("pid", activeLink);
			history.replaceState(null, "", url.toString());
		}
	});
</script>

<Cursor />
<!-- <div class="absolute w-screen h-screen z-50 pointer-events-none">
	<Loader />
</div> -->
<div class="bg-black min-h-svh w-screen text-zinc-300 overflow-x-hidden relative flex font-funnel">
	<aside class="w-96 z-10 flex-shrink-0 border-r border-zinc-900 h-svh fixed top-0 left-0 flex flex-col justify-between">
		<div class="w-full p-4 flex items-center border-b border-zinc-900 relative z-20">
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<img onclick={() => location.href = "/"} src="/assets/logo.png" alt="" class="size-12" />
			<div class="w-px bg-zinc-800 h-6 ml-2 mr-4"></div>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div onclick={() => location.href = "./"} class="flex flex-col -space-y-1">
				<h1 class="text-zinc-400">LongMemory</h1>
				<h1 class="text-xl">Documentation</h1>
			</div>
			<button class="p-3 bg-white/5 border border-white/5 hover:bg-white/10 ml-auto rounded-xl">
				{@html icons.get("search", "size-5")}
			</button>
		</div>

		<div class="h-full w-full overflow-y-auto p-4 pb-8 [mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)]">
			{#each links as link, i}
				<div class="flex flex-col mb-4">
					<button class="w-full px-4 py-2 rounded-full flex items-center focus:bg-stone-900 transition-all duration-300 {linkIdx === i ? 'bg-stone-900' : 'hover:bg-stone-900'}" onclick={() => (expanded[i] = !expanded[i])}>
						<h1 class="text-lg text-zinc-400 font-medium">{i + 1}.</h1>
						<span class="ml-2">{link.label}</span>
						{@html icons.get("chevronRight", "size-5 ml-auto transition-all duration-300 " + (expanded[i] ? "rotate-90" : ""))}
					</button>

					<div class="flex flex-col border-l border-stone-900 ml-4 {expanded[i] ? 'h-auto' : 'h-0 overflow-hidden'}">
						{#each link.items as item, x}
							<button
								class="border-l w-full -ml-px px-5 py-2 flex items-center transition-all duration-300 {linkIdx === i && itemIdx === x ? 'border-zinc-100 text-zinc-100 font-medium' : 'border-zinc-900 hover:border-zinc-500'}"
								onclick={() => {
									(activeLink = `${i}.${x}`), (currentPage = item?.file || null);
								}}
							>
								<span>{item.text}</span>
							</button>
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
		<div class="mx-96 flex flex-col p-12">
			<div class="my-20">
				<h1 class="text-2xl text-zinc-400">{activeGroup?.label || ""}</h1>
				<h1 class="text-4xl mt-1 font-medium text-zinc-100">{details.text}</h1>
			</div>

			{#each details.data as item, x}
				<h1 id="section-{x}" class="text-3xl mb-4 text-zinc-200 font-medium scroll-mt-6">{item.heading}</h1>

				<DocsTemplate {item} {x} />
			{/each}
			<div class="pb-8"></div>
		</div>

		<div class="fixed bottom-0 h-36 w-full pointer-events-none bg-gradient-to-t from-black z-0"></div>

		<ThisPage data={details} />
	{:else if details?.file}
		<Page onGetStarted={() => (activeLink = "0.1")} />
	{:else}
		<div class="my-auto ml-96 pl-20">
			<h1 class="text-4xl text-zinc-200">404: Page Not Found</h1>
			<h1 class="text-4xl text-zinc-400 mt-2 font-medium">We're sorry, but the requested content is not available.</h1>
		</div>
	{/if}
</div>
