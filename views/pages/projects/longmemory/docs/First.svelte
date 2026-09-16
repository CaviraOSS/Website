<script>
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import icons from "$lib/icons/index.js";
</script>

<div class="mx-96 flex flex-col p-12">
	<img src="/assets/images/52.png" alt="" class="absolute w-auto h-svh top-0 z-0 opacity-80" />
	<div class="absolute z-10 w-full h-svh top-0 bg-gradient-to-tr from-black via-black [mask-image:linear-gradient(to_top_right,black,transparent)] backdrop-blur-md"></div>
	<div class="my-20 z-10">
		<h1 class="text-2xl text-zinc-400">LongMemory</h1>
		<h1 class="text-4xl mt-1 font-medium text-zinc-100">Documentation</h1>
	</div>
	<p class="z-10 max-w-xl my-auto text-xl">
		Welcome to the LongMemory documentation!<br/>
		This illustration looks cool, right?
	</p>
	<div class="mt-auto pb-20 z-10 text-xl">
		<button class="group flex items-center bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white px-5 py-2 rounded-full duration-100 transition-all">
			<span class="">Get started</span>
			{@html icons.get("chevronRight", "size-5 ml-2 transition-all duration-300")}
			{@html icons.get("chevronRight", "size-5 -ml-2 transition-all duration-300 w-1 group-hover:w-5 opacity-80")}
			{@html icons.get("chevronRight", "size-5 -ml-2 transition-all duration-300 w-1 group-hover:w-5 opacity-40")}
		</button>
	</div>
</div>

<div class="fixed bottom-0 h-36 w-full pointer-events-none bg-gradient-to-t from-black z-0"></div>
