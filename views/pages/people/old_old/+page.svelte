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
					<svg class="h-full w-auto overflow-visible" style:transform-origin="47.92% 50%" style:transform="scale({svgScale})" viewBox="0 0 691 164" fill="none" xmlns="http://www.w3.org/2000/svg">
						<g opacity="0.75">
							<path d="M0 146.872V161.217H86.9115V2.78329H0V17.1279H71.0314V74.0783H2.36056V88.423H71.0314V146.872H0Z" fill="currentColor" />
							<path d="M171.462 146.872V161.217H89.9158V2.78329H105.796V146.872H171.462Z" fill="currentColor" />
							<path d="M247.215 2.78329V161.217H227.257L116.097 2.78329H135.839L230.906 140.235H231.335V2.78329H247.215Z" fill="currentColor" />
							<path
								d="M390.351 23.9791C406.946 39.9652 415.244 59.3055 415.244 82C415.244 104.695 406.946 124.035 390.351 140.021C373.755 156.007 354.012 164 331.122 164C308.661 164 289.061 156.043 272.323 140.128C255.584 124.213 247.215 105.123 247.215 82.8564C247.215 59.8764 255.405 40.322 271.786 24.1932C288.167 8.0644 307.946 0 331.122 0C354.012 0 373.755 7.99304 390.351 23.9791ZM379.192 129.851C392.64 116.648 399.364 100.769 399.364 82.2141C399.364 63.6588 392.675 47.7084 379.299 34.3629C365.922 21.0174 349.863 14.3446 331.122 14.3446C312.238 14.3446 296.179 21.0531 282.945 34.47C269.712 47.8869 263.095 64.0157 263.095 82.8564C263.095 101.126 269.855 116.827 283.374 129.958C296.894 143.09 312.81 149.655 331.122 149.655C349.72 149.655 365.744 143.054 379.192 129.851Z"
								fill="currentColor" />
							<path
								d="M522.971 53.953C522.971 67.2271 518.465 78.3603 509.452 87.3525C500.439 96.3446 489.208 101.269 475.76 102.125L520.611 161.217H500.653L446.789 89.4935C464.529 89.4935 475.903 88.7084 480.91 87.1384C488.779 84.7119 495.109 80.537 499.902 74.6136C504.695 68.6902 507.091 61.6606 507.091 53.5248C507.091 47.3873 505.517 41.4996 502.37 35.8616C499.222 30.2237 495.002 25.9774 489.709 23.1227C482.269 19.1262 471.969 17.1279 458.807 17.1279H431.124V161.217H415.244V2.78329H455.588C473.328 2.78329 486.347 4.78155 494.644 8.77807C503.514 13.0601 510.453 19.1976 515.46 27.1906C520.467 35.1836 522.971 44.1044 522.971 53.953Z"
								fill="currentColor" />
							<path
								d="M666.107 23.9791C682.702 39.9652 691 59.3055 691 82C691 104.695 682.702 124.035 666.107 140.021C649.511 156.007 629.769 164 606.878 164C584.417 164 564.817 156.043 548.079 140.128C531.34 124.213 522.971 105.123 522.971 82.8564C522.971 59.8764 531.162 40.322 547.542 24.1932C563.923 8.0644 583.702 0 606.878 0C629.769 0 649.511 7.99304 666.107 23.9791ZM654.948 129.851C668.396 116.648 675.12 100.769 675.12 82.2141C675.12 63.6588 668.432 47.7084 655.055 34.3629C641.679 21.0174 625.62 14.3446 606.878 14.3446C587.994 14.3446 571.935 21.0531 558.701 34.47C545.468 47.8869 538.851 64.0157 538.851 82.8564C538.851 101.126 545.611 116.827 559.131 129.958C572.65 143.09 588.566 149.655 606.878 149.655C625.477 149.655 641.5 143.054 654.948 129.851Z"
								fill="currentColor" />
						</g>
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