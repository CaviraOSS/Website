<script>
	import { page } from "$app/state";
	import { site, page_meta, canonical, structured_data, serialize_schema } from "$lib/utils/site";
	let { children } = $props();
	const meta = $derived(page_meta(page.url.pathname));
	const url = $derived(canonical(meta.path));
</script>

<svelte:head>
	<title>{meta.title}</title>
	<meta name="description" content={meta.description} />
	<meta name="robots" content={page.status >= 400 ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />
	<meta name="theme-color" content="#000000" />
	<link rel="canonical" href={url} />
	<link rel="sitemap" type="application/xml" href="/sitemap.xml" />
	<link rel="alternate" type="text/plain" title="AI-readable site index" href="/llms.txt" />
	{#if meta.markdown}<link rel="alternate" type="text/markdown" title="Markdown documentation" href={meta.markdown} />{/if}
	<meta property="og:type" content={meta.article ? "article" : "website"} />
	<meta property="og:site_name" content={site.name} />
	<meta property="og:locale" content="en_US" />
	<meta property="og:title" content={meta.title} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={`${site.origin}/assets/logo.png`} />
	<meta property="og:image:alt" content="Cavira" />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={meta.title} />
	<meta name="twitter:description" content={meta.description} />
	<meta name="twitter:image" content={`${site.origin}/assets/logo.png`} />
	<meta name="twitter:image:alt" content="Cavira" />
	{@html `<script type="application/ld+json">${serialize_schema(structured_data(meta))}</script>`}
</svelte:head>

{@render children()}