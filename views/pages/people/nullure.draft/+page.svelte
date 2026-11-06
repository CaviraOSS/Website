<script>
	import Lenis from "lenis";
	import "lenis/dist/lenis.css";
	import icons from "$lib/icons";
	import Cursor from "$lib/includes/Cursor.svelte";
	import Footer from "$lib/includes/Footer.svelte";

	const SPEED = 60;
	const AUTO_COMPLETE_THRESHOLD = 0.28;

	let offset = $state(0);
	let scrollY = $state(0);
	let screenWidth = $state(1920);
	let screenHeight = $state(1080);
	let treeWidth = $state(500);
	let totalTreeDistance = $derived(screenWidth + treeWidth);
	let groundCycleWidth = $derived(screenWidth * 2);
	let maxScroll = $derived(screenHeight * 2.5);
	let scrollProgress = $derived(Math.min(1, Math.max(0, scrollY / (maxScroll || 1))));
	let moveUpProgress = $derived(Math.min(1, scrollProgress / 0.25));
	let svgTranslateY = $derived(-37 * moveUpProgress);
	let zoomProgress = $derived(Math.max(0, Math.min(1, (scrollProgress - 0.25) / 0.6)));
	let aspectRatio = $derived(screenWidth / (screenHeight || 1));
	let targetMaxScale = $derived(Math.max(45, aspectRatio * 28));
	let svgScale = $derived(1 + Math.pow(zoomProgress, 3) * targetMaxScale);
	let svgOpacity = $derived(zoomProgress > 0.78 ? Math.max(0, 1 - (zoomProgress - 0.78) / 0.2) : 1);
	let newSectionProgress = $derived(Math.max(0, Math.min(1, (scrollProgress - 0.65) / 0.3)));

	$effect(() => {
		const lenis = new Lenis({
			autoRaf: true,
			duration: 1.1,
			easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
			orientation: "vertical",
			gestureOrientation: "vertical",
			smoothWheel: true,
			wheelMultiplier: 1,
			touchMultiplier: 1.5,
		});

		let scrollTimeout;
		let isAutoScrolling = false;

		lenis.on("scroll", (e) => {
			scrollY = e.scroll;

			if (isAutoScrolling) return;
			clearTimeout(scrollTimeout);

			scrollTimeout = setTimeout(() => {
				const currentProgress = scrollY / (maxScroll || 1);

				if (currentProgress >= AUTO_COMPLETE_THRESHOLD && currentProgress < 0.98) {
					isAutoScrolling = true;
					const remainingRatio = 1 - currentProgress;
					lenis.scrollTo(maxScroll, {
						duration: Math.max(0.8, remainingRatio * 1.8),
						easing: (t) => 1 - Math.pow(1 - t, 3),
						onComplete: () => {
							isAutoScrolling = false;
						},
					});
				}
			}, 140);
		});

		const cancelAutoScroll = () => {
			if (isAutoScrolling) {
				isAutoScrolling = false;
				clearTimeout(scrollTimeout);
			}
		};

		window.addEventListener("wheel", cancelAutoScroll, { passive: true });
		window.addEventListener("touchstart", cancelAutoScroll, { passive: true });

		return () => {
			clearTimeout(scrollTimeout);
			window.removeEventListener("wheel", cancelAutoScroll);
			window.removeEventListener("touchstart", cancelAutoScroll);
			lenis.destroy();
		};
	});

	$effect(() => {
		let animationFrameId;
		let lastTime = performance.now();

		function loop(currentTime) {
			const deltaTime = (currentTime - lastTime) / 1000;
			lastTime = currentTime;
			offset += SPEED * deltaTime;
			animationFrameId = requestAnimationFrame(loop);
		}

		animationFrameId = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(animationFrameId);
	});

	const projects = [
		{ title: "Yokoso", src: "/assets/images/idk/rec.mp4", href: "#" },
		{ title: "watashino", src: "/assets/images/idk/rec.mp4", href: "#" },
		{ title: "Portfolio", src: "/assets/images/idk/rec.mp4", href: "#" },
		{ title: "Discover", src: "/assets/images/idk/rec.mp4", href: "#" },
		{ title: "Ho lee sheet", src: "/assets/images/idk/rec.mp4", href: "#" },
		{ title: "On fire", src: "/assets/images/idk/rec.mp4", href: "#" },
		{ title: "Your mom", src: "/assets/images/idk/rec.mp4", href: "#" },
		{ title: "eeeeeee", src: "/assets/images/idk/rec.mp4", href: "#" },
	];

	let activeIndex = $state(0);
	let targetRingRotation = $state(0);
	let currentRingRotation = $state(0);

	let panelWidth = $derived(Math.min(Math.max(screenWidth * 0.42, 320), 680));
	let panelHeight = $derived(panelWidth * 0.62);
	let ringRadius = $derived(Math.round(panelWidth / 2 / Math.tan(Math.PI / projects.length) + 18));

	let cameraTiltX = $derived((1 - newSectionProgress) * -32);
	let cameraPushZ = $derived(-350 * (1 - newSectionProgress));
	let cameraLiftY = $derived((1 - newSectionProgress) * -180);

	let prevProject = $derived(projects[(activeIndex - 1 + projects.length) % projects.length]);
	let currentProject = $derived(projects[activeIndex]);
	let nextProject = $derived(projects[(activeIndex + 1) % projects.length]);

	function rotateGallery(dir) {
		activeIndex = (activeIndex + dir + projects.length) % projects.length;
		targetRingRotation -= dir * (360 / projects.length);
	}

	$effect(() => {
		let raf;
		function updateRing() {
			currentRingRotation += (targetRingRotation - currentRingRotation) * 0.08;
			raf = requestAnimationFrame(updateRing);
		}
		raf = requestAnimationFrame(updateRing);
		return () => cancelAnimationFrame(raf);
	});
</script>

<svelte:window bind:scrollY />

<Cursor />

<div class="relative w-screen h-[350svh] bg-black">
	<div bind:clientWidth={screenWidth} bind:clientHeight={screenHeight} class="sticky top-0 h-svh w-screen overflow-hidden">
		<div class="absolute inset-0 z-0 will-change-[opacity]" style:opacity={1 - newSectionProgress}>
			<div class="absolute h-[84%] w-screen bg-cover bg-center top-0 left-0 bg-[url('/assets/images/idk/53.png')]"></div>

			<div bind:clientWidth={treeWidth} class="absolute h-[70%] w-[35%] bg-cover bg-no-repeat top-[38%] left-full bg-[url('/assets/images/idk/54.png')] will-change-transform" style:transform="translate3d(-{(offset * 0.6) % totalTreeDistance}px, 0, 0)"></div>

			<div class="absolute h-[22%] bottom-0 left-0 flex w-[400vw] will-change-transform" style:transform="translate3d(-{offset % groundCycleWidth}px, 0, 0)">
				<div class="h-full w-screen shrink-0 bg-cover bg-[url('/assets/images/idk/55.png')]"></div>
				<div class="h-full w-screen shrink-0 bg-cover bg-[url('/assets/images/idk/55.png')] -scale-x-100"></div>
				<div class="h-full w-screen shrink-0 bg-cover bg-[url('/assets/images/idk/55.png')]"></div>
				<div class="h-full w-screen shrink-0 bg-cover bg-[url('/assets/images/idk/55.png')] -scale-x-100"></div>
			</div>
		</div>

		<div class="absolute inset-0 bg-gradient-to-t from-black via-transparent z-20 overflow-hidden pointer-events-none" style:opacity={svgOpacity} style:visibility={svgOpacity <= 0.01 ? "hidden" : "visible"}>
			<div class="relative w-screen h-svh text-zinc-300 flex flex-col justify-end items-center pb-[4vh]">
				<div class="h-[18vh] flex items-center justify-center" style:transform="translateY({svgTranslateY}vh)">
					<svg class="h-full w-auto overflow-visible" style:transform-origin="52% 30%" style:transform="scale({svgScale})" viewBox="0 0 811 152" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M217.841 0V146.841H203.836V15.8747H203.457L115.45 146.841H103.148V15.0809H102.77L17.6014 146.841H0L97.0916 0H117.153V119.854H117.532L198.536 0H217.841Z" fill="currentColor" />
						<path
							d="M350.221 22.2245C365.57 37.0409 373.244 54.9661 373.244 76C373.244 97.0339 365.57 114.959 350.221 129.775C334.873 144.592 316.613 152 295.443 152C274.67 152 256.543 144.625 241.062 129.875C225.581 115.124 217.841 97.4308 217.841 76.7937C217.841 55.4952 225.416 37.3716 240.566 22.423C255.716 7.47432 274.008 0 295.443 0C316.613 0 334.873 7.40818 350.221 22.2245ZM339.901 120.35C352.338 108.113 358.557 93.396 358.557 76.1984C358.557 59.0009 352.371 44.2176 340 31.8486C327.629 19.4795 312.776 13.295 295.443 13.295C277.978 13.295 263.126 19.5126 250.887 31.9478C238.647 44.3829 232.528 59.3316 232.528 76.7937C232.528 93.7267 238.78 108.279 251.283 120.449C263.787 132.62 278.507 138.705 295.443 138.705C312.644 138.705 327.463 132.587 339.901 120.35Z"
							fill="currentColor" />
						<path
							d="M472.956 47.4256C472.956 59.7285 468.788 70.047 460.453 78.3812C452.117 86.7154 441.73 91.2794 429.293 92.0731L470.773 146.841H452.315L402.499 80.3655C418.906 80.3655 429.425 79.6379 434.056 78.1828C441.333 75.9339 447.188 72.0644 451.621 66.5744C456.053 61.0844 458.27 54.5692 458.27 47.0287C458.27 41.3403 456.814 35.8834 453.903 30.658C450.992 25.4325 447.089 21.497 442.193 18.8512C435.313 15.1471 425.786 13.295 413.614 13.295H388.011V146.841H373.324V0H410.636C427.043 0 439.084 1.85205 446.758 5.55614C454.962 9.5248 461.379 15.2132 466.01 22.6214C470.641 30.0296 472.956 38.2976 472.956 47.4256Z"
							fill="currentColor" />
						<path d="M577.551 0V146.841H559.093L456.285 0H474.544L562.467 127.394H562.864V0H577.551Z" fill="currentColor" />
						<path d="M661.107 133.546V146.841H580.726V0H661.107V13.295H595.413V66.0783H658.924V79.3734H595.413V133.546H661.107Z" fill="currentColor" />
						<path d="M811 0V146.841H792.567L683.214 17.6606H682.716V146.841H664.282V0H689.192L792.069 121.838H792.567V0H811Z" fill="currentColor" />
					</svg>
				</div>
			</div>
		</div>

		<div class="absolute inset-0 z-30 bg-black text-zinc-100 overflow-hidden select-none will-change-[opacity]" style:opacity={newSectionProgress} style:pointer-events={newSectionProgress > 0.8 ? "auto" : "none"}>
			<div class="relative w-full h-full flex items-center justify-center" style:perspective="1300px">
				<div class="relative flex items-center justify-center" style:transform-style="preserve-3d" style:transform="translate3d(0px, {cameraLiftY}px, {cameraPushZ}px) rotateX({cameraTiltX}deg) rotateY({currentRingRotation}deg)">
					{#each projects as project, i}
						{@const angle = i * (360 / projects.length)}
						<div
							class="absolute bg-zinc-950 border-x-[14px] border-t-[18px] border-black shadow-[0_0_80px_rgba(0,0,0,0.95)] overflow-hidden"
							style:width="{panelWidth}px"
							style:height="{panelHeight}px"
							style:transform-style="preserve-3d"
							style:transform="rotateY({angle}deg) translateZ(-{ringRadius}px)">
							{#if project.src.endsWith(".mp4")}
								<video src={project.src} alt={project.title} class="w-full h-full object-cover brightness-90 scale-x-[-1] transition-transform duration-700 hover:scale-105" draggable="false" autoplay muted loop></video>
							{:else}
								<img src={project.src} alt={project.title} class="w-full h-full object-cover brightness-90 transition-transform duration-700 hover:scale-105" draggable="false" />
							{/if}

							<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30"></div>
						</div>
					{/each}
				</div>
			</div>

			<div class="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
				<h2 class="text-4xl md:text-6xl font-semibold tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
					{currentProject.title}
				</h2>
			</div>

			<div class="absolute h-[18%] bottom-0 left-0 flex w-[400vw] z-10 pointer-events-none brightness-[0.35] contrast-125" style:transform="translate3d(-{(offset * 0.4) % groundCycleWidth}px, 0, 0)">
				<div class="h-full w-screen shrink-0 bg-cover bg-[url('/assets/images/idk/55.png')]"></div>
				<div class="h-full w-screen shrink-0 bg-cover bg-[url('/assets/images/idk/55.png')] -scale-x-100"></div>
				<div class="h-full w-screen shrink-0 bg-cover bg-[url('/assets/images/idk/55.png')]"></div>
				<div class="h-full w-screen shrink-0 bg-cover bg-[url('/assets/images/idk/55.png')] -scale-x-100"></div>
			</div>
			<div class="absolute inset-x-0 bottom-0 h-[18%] bg-gradient-to-t from-black via-black/80 to-transparent z-10 pointer-events-none"></div>

			<div class="absolute bottom-8 inset-x-8 md:inset-x-14 z-30 flex items-end justify-between">
				<button onclick={() => rotateGallery(-1)} class="text-left group cursor-pointer">
					<span class="block text-[11px] tracking-[0.2em] uppercase text-zinc-400 group-hover:text-zinc-200 transition"> Prev </span>
					<span class="block text-lg md:text-xl font-medium text-white mt-0.5 group-hover:-translate-x-1 transition-transform">
						{prevProject.title}
					</span>
				</button>

				<a href={currentProject.href} class="px-6 py-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700/60 backdrop-blur-md text-xs md:text-sm text-zinc-200 flex items-center gap-3 transition">
					<span>View project</span>
				</a>

				<button onclick={() => rotateGallery(1)} class="text-right group cursor-pointer">
					<span class="block text-[11px] tracking-[0.2em] uppercase text-zinc-400 group-hover:text-zinc-200 transition"> Next </span>
					<span class="block text-lg md:text-xl font-medium text-white mt-0.5 group-hover:translate-x-1 transition-transform">
						{nextProject.title}
					</span>
				</button>
			</div>
		</div>
	</div>
</div>

<Footer />
