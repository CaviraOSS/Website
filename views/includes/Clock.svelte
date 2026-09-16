<script>
	import { onMount } from "svelte";

	let now = $state(new Date());

	let totalSecs = $state(0);
	let totalMins = $state(0);
	let totalHours = $state(0);

	let isInitialized = false;

	const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
	const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
	const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
	const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
	const SECONDS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

	onMount(() => {
		const initDate = new Date();
		now = initDate;

		totalSecs = initDate.getSeconds();
		totalMins = initDate.getMinutes();
		totalHours = initDate.getHours();
		isInitialized = true;

		let lastSec = initDate.getSeconds();

		const interval = setInterval(() => {
			const current = new Date();
			now = current;
			const s = current.getSeconds();

			if (s !== lastSec) {
				const diff = (s - lastSec + 60) % 60;
				totalSecs += diff;

				if (s === 0) {
					totalMins += 1;
					if (current.getMinutes() === 0) {
						totalHours += 1;
					}
				}
				lastSec = s;
			}
		}, 200);

		return () => clearInterval(interval);
	});

	let secAngle = $derived(-totalSecs * (360 / 60));
	let minAngle = $derived(-totalMins * (360 / 60));
	let hourAngle = $derived(-totalHours * (360 / 24));

	let dayIndex = $derived((now.getDay() + 6) % 7);
	let dayAngle = $derived(-dayIndex * (360 / 7));

	let monthIndex = $derived(now.getMonth());
	let monthAngle = $derived(-monthIndex * (360 / 12));

	let year = $derived(now.getFullYear());

	const R_MONTH = 85;
	const R_DAY = 135;
	const R_HOUR = 195;
	const R_MIN = 260;
	const R_SEC = 330;
</script>

<div class="relative w-full max-w-3xl aspect-square mr-auto ml-0 flex items-center justify-start select-none overflow-hidden rounded-full bg-black lg:-ml-10">
	<div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center_left,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.02)_50%,transparent_80%)] pointer-events-none z-10"></div>
	<div class="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.85)_85%,rgba(0,0,0,1)_100%)]"></div>
	<div class="absolute top-1/2 left-[58%] right-10 h-8 -translate-y-1/2 bg-white/5 border border-white/10 rounded-xl z-30 pointer-events-none"></div>

	<svg viewBox="-400 -400 800 800" class="w-full h-full text-zinc-400">
		<g class="fill-none">
			<circle r={R_MONTH} stroke="rgba(255, 255, 255, 0.025)" stroke-width="36" />
			<circle r={R_MONTH - 18} stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" stroke-dasharray="2 4" />

			<circle r={R_DAY} stroke="rgba(255, 255, 255, 0.04)" stroke-width="40" />
			<circle r={R_DAY - 20} stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" stroke-dasharray="3 5" />

			<circle r={R_HOUR} stroke="rgba(255, 255, 255, 0.02)" stroke-width="46" />
			<circle r={R_HOUR - 23} stroke="rgba(255, 255, 255, 0.12)" stroke-width="1" />

			<circle r={R_MIN} stroke="rgba(255, 255, 255, 0.035)" stroke-width="50" />
			<circle r={R_MIN - 25} stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" stroke-dasharray="2 6" />

			<circle r={R_SEC} stroke="rgba(255, 255, 255, 0.015)" stroke-width="50" />
			<circle r={R_SEC - 25} stroke="rgba(255, 255, 255, 0.15)" stroke-width="1" />
			<circle r={R_SEC + 25} stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" stroke-dasharray="1 4" />
		</g>

		<g class="text-center">
			<circle r="48" class="fill-zinc-950 stroke-white/20" stroke-width="1" />
			<circle r="52" class="fill-none stroke-white/10" stroke-width="1" stroke-dasharray="2 4" />
			<text text-anchor="middle" dominant-baseline="central" class="fill-white text-lg font-light">
				{year}
			</text>
		</g>

		<g style="transform: rotate({monthAngle}deg); transition: {isInitialized ? 'transform 0.6s cubic-bezier(0.34, 1.3, 0.64, 1)' : 'none'};" class="will-change-transform">
			{#each MONTHS as month, i}
				{@const angle = 90 + i * (360 / 12)}
				<g transform="rotate({angle}) translate(0, {-R_MONTH})">
					<line y1="-10" y2="-14" class="stroke-white/20" stroke-width="1" />
					<text transform="rotate({-(angle + monthAngle)})" text-anchor="middle" dominant-baseline="central" class="text-[12px] font-bricolage transition-colors duration-300 {i === monthIndex ? 'fill-white font-semibold scale-110 -rotate-90' : 'fill-zinc-600'}">
						{month}
					</text>
				</g>
			{/each}
		</g>

		<g style="transform: rotate({dayAngle}deg); transition: {isInitialized ? 'transform 0.6s cubic-bezier(0.34, 1.3, 0.64, 1)' : 'none'};" class="will-change-transform">
			{#each DAYS as day, i}
				{@const angle = 90 + i * (360 / 7)}
				<g transform="rotate({angle}) translate(0, {-R_DAY})">
					<line y1="-12" y2="-16" class="stroke-white/25" stroke-width="1" />
					<text transform="rotate({-(angle + dayAngle)})" text-anchor="middle" dominant-baseline="central" class="text-[12px] font-bricolage transition-colors duration-300 {i === dayIndex ? 'fill-white font-bold' : 'fill-zinc-600'}">
						{day}
					</text>
				</g>
			{/each}
		</g>

		<g style="transform: rotate({hourAngle}deg); transition: {isInitialized ? 'transform 0.4s cubic-bezier(0.34, 1.4, 0.64, 1)' : 'none'};" class="will-change-transform">
			{#each HOURS as hour, i}
				{@const angle = 90 + i * (360 / 24)}
				<g transform="rotate({angle}) translate(0, {-R_HOUR})">
					<line y1="-12" y2="-18" class="stroke-white/30" stroke-width="1" />
					<text transform="rotate({-(angle + hourAngle)})" text-anchor="middle" dominant-baseline="central" class="text-[13px] transition-colors duration-300 {i === now.getHours() ? 'fill-white font-bold' : 'fill-zinc-500'}">
						{hour}
					</text>
				</g>
			{/each}
		</g>

		<g style="transform: rotate({minAngle}deg); transition: {isInitialized ? 'transform 0.4s cubic-bezier(0.34, 1.4, 0.64, 1)' : 'none'};" class="will-change-transform">
			{#each MINUTES as min, i}
				{@const angle = 90 + i * (360 / 60)}
				<g transform="rotate({angle}) translate(0, {-R_MIN})">
					{#if i % 5 === 0}
						<line y1="-12" y2="-20" class="stroke-white/40" stroke-width="1.5" />
					{:else}
						<line y1="-12" y2="-16" class="stroke-white/15" stroke-width="1" />
					{/if}
					<text transform="rotate({-(angle + minAngle)})" text-anchor="middle" dominant-baseline="central" class="text-[13px] transition-colors duration-300 {i === now.getMinutes() ? 'fill-white font-bold' : 'fill-zinc-600'}">
						{min}
					</text>
				</g>
			{/each}
		</g>

		<g style="transform: rotate({secAngle}deg); transition: {isInitialized ? 'transform 0.35s cubic-bezier(0.34, 1.45, 0.64, 1)' : 'none'};" class="will-change-transform">
			{#each SECONDS as sec, i}
				{@const angle = 90 + i * (360 / 60)}
				<g transform="rotate({angle}) translate(0, {-R_SEC})">
					{#if i % 5 === 0}
						<line y1="-14" y2="-22" class="stroke-white/50" stroke-width="1.5" />
					{:else}
						<line y1="-14" y2="-18" class="stroke-white/20" stroke-width="1" />
					{/if}
					<text transform="rotate({-(angle + secAngle)})" text-anchor="middle" dominant-baseline="central" class="text-[11px] transition-colors duration-300 {i === now.getSeconds() ? 'fill-white font-bold scale-125 -rotate-90' : 'fill-zinc-600'}">
						{sec}
					</text>
				</g>
			{/each}
		</g>
	</svg>
</div>