<script>
	import icons from "$lib/icons/index.js";
	const { data } = $props();
	let copied = $state(false);
	let timeout;

	function handleCopy() {
		navigator.clipboard.writeText(data);
		copied = true;

		clearTimeout(timeout);
		timeout = setTimeout(() => {
			copied = false;
		}, 2000);
	}
</script>

<button onclick={handleCopy} class="p-2 px-4 text-xs bg-white/5 hover:bg-white/10 hover:text-white rounded-full flex items-center gap-2 duration-100 transition-all">
	{@html icons.get(copied ? "clipboardSuccess" : "clipboard", "size-4")}
	<span>{copied ? "Copied" : "Copy"}</span>
</button>
