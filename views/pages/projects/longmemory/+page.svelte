<script>
	import { onMount, onDestroy } from "svelte";
	import * as THREE from "three";
	import Lenis from "lenis";
	import "lenis/dist/lenis.css";
	import Cursor from "$lib/includes/Cursor.svelte";
	import icons from "$lib/icons";
	import Dropdown from "$lib/components/Dropdown.svelte";

	$effect(() => {
		const lenis = new Lenis({
			autoRaf: true,
			duration: 1.3,
			easing: (t) => Math.min(1, 1.001 - Math.pow(1.8, -10 * t)),
			orientation: "vertical",
			gestureOrientation: "vertical",
			smoothWheel: true,
			wheelMultiplier: 1,
			smoothTouch: false,
			touchMultiplier: 2,
		});

		return () => {
			lenis.destroy();
		};
	});

	const count = 120;
	const activeIndex = 42;

	const bars = Array.from({ length: count }, (_, i) => {
		const trend = 25 + Math.pow(i / count, 1.3) * 60;
		const noise = (Math.sin(i * 0.8) + Math.cos(i * 1.7)) * 8 + Math.random() * 8;
		return Math.min(100, Math.max(15, Math.round(trend + noise)));
	});

	let container;
	let animationFrameId;
	let cleanupScene;

	onMount(() => {
		if (!container) return;

		const scene = new THREE.Scene();
		scene.fog = new THREE.FogExp2(0x000000, 0.022);

		const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
		camera.position.set(0, 0, 42);

		const renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
			powerPreference: "high-performance",
		});
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.setClearColor(0x000000, 0);
		container.appendChild(renderer.domElement);

		const systemGroup = new THREE.Group();
		scene.add(systemGroup);

		const ringGroup = new THREE.Group();
		systemGroup.add(ringGroup);

		const ringConfigs = [
			{ radius: 14.0, segments: 140, dashSize: 0.8, gapSize: 0.4, rotX: 1.1, rotY: 0.3, speed: 0.04, color: 0x3f3f46 },
			{ radius: 11.2, segments: 120, dashSize: 1.6, gapSize: 0.8, rotX: -0.7, rotY: 0.6, speed: -0.06, color: 0x52525b },
			{ radius: 8.5, segments: 90, dashSize: 0.4, gapSize: 0.3, rotX: 0.4, rotY: -0.8, speed: 0.08, color: 0x71717a },
			{ radius: 5.8, segments: 70, dashSize: 2.2, gapSize: 1.2, rotX: 1.4, rotY: 0.9, speed: -0.05, color: 0xa1a1aa },
		];

		const ringMeshes = ringConfigs.map((cfg) => {
			const geom = new THREE.BufferGeometry();
			const points = [];
			for (let i = 0; i <= cfg.segments; i++) {
				const theta = (i / cfg.segments) * Math.PI * 2;
				points.push(new THREE.Vector3(Math.cos(theta) * cfg.radius, Math.sin(theta) * cfg.radius, 0));
			}
			geom.setFromPoints(points);

			const mat = new THREE.LineDashedMaterial({
				color: cfg.color,
				dashSize: cfg.dashSize,
				gapSize: cfg.gapSize,
				transparent: true,
				opacity: 0.55,
				blending: THREE.AdditiveBlending,
			});

			const line = new THREE.Line(geom, mat);
			line.computeLineDistances();
			line.rotation.x = cfg.rotX;
			line.rotation.y = cfg.rotY;

			ringGroup.add(line);
			return { mesh: line, speed: cfg.speed };
		});

		const strandCount = 7;
		const pointsPerStrand = 90;
		const strandMeshes = [];

		const strandMaterial = new THREE.LineBasicMaterial({
			color: 0xd4d4d8,
			transparent: true,
			opacity: 0.8,
			blending: THREE.AdditiveBlending,
		});

		for (let s = 0; s < strandCount; s++) {
			const geom = new THREE.BufferGeometry();
			const positions = new Float32Array(pointsPerStrand * 3);
			geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));

			const line = new THREE.Line(geom, strandMaterial);
			systemGroup.add(line);
			strandMeshes.push({
				line,
				seed: s * 1.84,
				scaleRadius: 2.8 + s * 1.1,
				pitch: 0.35 + (s % 3) * 0.12,
			});
		}

		const coreParticleCount = 95;
		const corePositions = new Float32Array(coreParticleCount * 3);
		const coreAnchors = [];

		for (let i = 0; i < coreParticleCount; i++) {
			const u = Math.random();
			const v = Math.random();
			const theta = u * 2.0 * Math.PI;
			const phi = Math.acos(2.0 * v - 1.0);
			const r = Math.cbrt(Math.random()) * 4.2;

			const x = r * Math.sin(phi) * Math.cos(theta);
			const y = r * Math.sin(phi) * Math.sin(theta);
			const z = r * Math.cos(phi);

			corePositions[i * 3] = x;
			corePositions[i * 3 + 1] = y;
			corePositions[i * 3 + 2] = z;

			coreAnchors.push({
				x,
				y,
				z,
				phase: Math.random() * Math.PI * 2,
				freq: 0.6 + Math.random() * 0.8,
			});
		}

		const coreGeometry = new THREE.BufferGeometry();
		coreGeometry.setAttribute("position", new THREE.BufferAttribute(corePositions, 3));

		const createReticleTexture = () => {
			const canvas = document.createElement("canvas");
			canvas.width = 32;
			canvas.height = 32;
			const ctx = canvas.getContext("2d");
			ctx.strokeStyle = "rgba(244, 244, 245, 0.9)";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(16, 8);
			ctx.lineTo(16, 24);
			ctx.moveTo(8, 16);
			ctx.lineTo(24, 16);
			ctx.stroke();
			return new THREE.CanvasTexture(canvas);
		};

		const reticleTexture = createReticleTexture();

		const coreMaterial = new THREE.PointsMaterial({
			size: 1,
			map: reticleTexture,
			transparent: true,
			opacity: 2,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
		});

		const corePoints = new THREE.Points(coreGeometry, coreMaterial);
		systemGroup.add(corePoints);

		let targetX = 0;
		let targetY = 0;
		let currentX = 0;
		let currentY = 0;

		const onMouseMove = (e) => {
			const rect = container.getBoundingClientRect();
			targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
			targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
		};

		window.addEventListener("mousemove", onMouseMove);

		const onResize = () => {
			if (!container) return;
			const w = container.clientWidth;
			const h = container.clientHeight;
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			renderer.setSize(w, h);
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		};

		window.addEventListener("resize", onResize);

		const clock = new THREE.Clock();

		const animate = () => {
			animationFrameId = requestAnimationFrame(animate);
			const time = clock.getElapsedTime();

			currentX += (targetX - currentX) * 0.035;
			currentY += (targetY - currentY) * 0.035;

			systemGroup.rotation.y = currentX * 0.45 + time * 0.012;
			systemGroup.rotation.x = currentY * 0.35 + Math.sin(time * 0.15) * 0.04;

			ringMeshes.forEach(({ mesh, speed }) => {
				mesh.rotation.z += speed * 0.1;
			});

			strandMeshes.forEach(({ line, seed, scaleRadius, pitch }) => {
				const pos = line.geometry.attributes.position.array;
				for (let i = 0; i < pointsPerStrand; i++) {
					const t = (i / pointsPerStrand) * Math.PI * 4 - Math.PI * 2;
					const wave = Math.sin(t * 1.5 + time * 0.6 + seed);
					const envelope = Math.cos((i / pointsPerStrand - 0.5) * Math.PI);

					const r = scaleRadius + wave * 1;
					const x = Math.cos(t + time * 0.1 + seed) * r * envelope;
					const y = t * 3.8 + Math.cos(time * 0.4 + seed) * 1.2;
					const z = Math.sin(t + time * 0.1 + seed) * (r * 0.7) * envelope;

					pos[i * 3] = x;
					pos[i * 3 + 1] = y;
					pos[i * 3 + 2] = z;
				}
				line.geometry.attributes.position.needsUpdate = true;
			});

			const corePos = coreGeometry.attributes.position.array;
			for (let i = 0; i < coreParticleCount; i++) {
				const anc = coreAnchors[i];
				const pulse = 1 + Math.sin(time * anc.freq + anc.phase) * 0.07;
				corePos[i * 3] = anc.x * pulse;
				corePos[i * 3 + 1] = anc.y * pulse;
				corePos[i * 3 + 2] = anc.z * pulse;
			}
			coreGeometry.attributes.position.needsUpdate = true;

			renderer.render(scene, camera);
		};

		animate();

		cleanupScene = () => {
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("resize", onResize);
			cancelAnimationFrame(animationFrameId);

			ringMeshes.forEach(({ mesh }) => {
				mesh.geometry.dispose();
				mesh.material.dispose();
			});

			strandMeshes.forEach(({ line }) => {
				line.geometry.dispose();
				line.material.dispose();
			});

			coreGeometry.dispose();
			coreMaterial.dispose();
			reticleTexture.dispose();
			renderer.dispose();
			if (renderer.domElement?.parentNode) {
				renderer.domElement.parentNode.removeChild(renderer.domElement);
			}
		};
	});

	onDestroy(() => {
		if (cleanupScene) cleanupScene();
	});
</script>

<svelte:head>
	<title>Longmemory | OSS | Cavira</title>
</svelte:head>

<Cursor />
<div class="bg-black min-h-svh w-screen text-neutral-300 overflow-clip relative p-4 sm:p-8 flex flex-col justify-center items-center font-funnel">
	<div class="fixed z-30 w-full max-w-7xl p-4 bg-black/10 backdrop-blur-xl border border-stone-800 top-4 flex items-center justify-between">
		<h1 class="text-xl font-medium text-white">Longmemory</h1>
		<div class="flex items-center gap-4">
			<a href="./longmemory/docs" class="hover:text-zinc-400 flex items-center gap-2 group">
				<span class="">Docs</span>
				{@html icons.get("chevronRight", "h-4 w-0 group-hover:w-4 transition-all duration-200")}
			</a>
			<a href="https://github.com/CaviraOSS/Longmemory" class="hover:text-zinc-400 flex items-center gap-2 group">
				<span class="">GitHub</span>
				{@html icons.get("arrowTop", "h-4 w-0 group-hover:w-4 transition-all duration-200 rotate-45")}
			</a>
			<a href="#" class="hover:text-zinc-400 flex items-center gap-2 group">
				<span class="">Discord</span>
				{@html icons.get("arrowTop", "h-4 w-0 group-hover:w-4 transition-all duration-200 rotate-45")}
			</a>
		</div>
	</div>
	<div class="relative w-full max-w-7xl flex flex-col justify-between border border-zinc-900 bg-black/60 backdrop-blur-[1px] text-zinc-400 selection:bg-zinc-800 selection:text-zinc-100 overflow-clip shadow-[0_0_80px_rgba(0,0,0,0.9)] mt-16">
		<div bind:this={container} class="pointer-events-none absolute inset-0 z-0 -rotate-90 scale-150"></div>
		<div class="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.85)_70%)]"></div>

		<div class="relative w-full border-b border-stone-900 p-4 py-2 flex items-center justify-between text-sm">
			<h1 class="font-mono w-28 border-r border-stone-800 text-stone-500">[ <span class="text-stone-200">01</span> / 04 ]</h1>
			<span class="font-metrophobic w-28 text-right border-l border-stone-800 uppercase text-xs">[ hero ]</span>
		</div>

		<main class="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-28 sm:py-36 lg:py-56 text-center">
			<h1 class="text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-white max-w-4xl leading-1.5 text-balance mt-6">Memory that feels handcrafted for AI agents.</h1>
			<p class="mt-6 text-base sm:text-lg text-zinc-300 max-w-3xl font-normal leading-relaxed text-balance">Longmemory treats conversations as continuous biological systems—anchoring emotion, contextual drift, and temporal decay with zero synthetic latency.</p>
			<div class="mt-10 flex flex-wrap items-center justify-center gap-4">
				<button class="group relative px-6 py-2.5 rounded-full bg-zinc-100 hover:opacity-60 text-black text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-[0_0_25px_rgba(255,255,255,0.12)] active:scale-95">
					<span>Initialize Memory</span>
					{@html icons.get("chevronRight", "size-4")}
				</button>

				<button class="px-5 py-2.5 rounded-full border border-zinc-800/80 hover:border-zinc-700 bg-zinc-950/70 hover:bg-zinc-900/80 text-zinc-300 text-sm font-mono transition-all duration-200 flex items-center gap-2 backdrop-blur-sm active:scale-95">
					<span class="text-zinc-500">$</span>
					<span>npm install longmemory</span>
				</button>
			</div>
		</main>
	</div>
	<div class="max-w-7xl w-full h-full border border-stone-900 overflow-clip mt-10 bg-black">
		<div class="w-full border-b border-stone-900 p-4 py-2 flex items-center justify-between text-sm">
			<h1 class="font-mono w-28 border-r border-stone-800 text-stone-500">[ <span class="text-stone-200">02</span> / 04 ]</h1>
			<span class="font-metrophobic w-28 text-right border-l border-stone-800 uppercase text-xs">[ features ]</span>
		</div>
		<div class="w-full h-full grid grid-cols-3 grid-rows-2 gap-4">
			<div class="w-full h-full border-r border-b border-stone-900 relative overflow-hidden">
				<div class="p-8 relative z-10">
					<div class="flex items-start justify-between">
						{@html icons.get("watch", "size-8")}
						<div class="flex flex-col items-end">
							<span class="text-xs text-zinc-400">[ <span class="text-zinc-200">01</span> ]</span>
							<span class="text-xs text-zinc-400">[ DYNAMIC ]</span>
						</div>
					</div>
					<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Intelligent decay orchestration</h1>
					<p class="text-zinc-400">Memories decay gracefully along custom curves, while high-signal events trigger <span class="text-zinc-100">reinforcement without manual tuning</span>.</p>
				</div>
				<img src="/assets/images/x1.png" alt="" class="object-cover w-full h-full absolute top-28 rotate-6 left-0 bottom-0 z-0 scale-105" />
				<div class="absolute bottom-0 h-20 w-full bg-gradient-to-t from-black z-10 hidden"></div>
			</div>

			<div class="col-span-2 row-span-2 grid grid-cols-2 grid-rows-6 gap-4">
				<div class="w-full border border-stone-900 border-t-0 relative overflow-hidden row-span-4">
					<div class="p-8 relative z-10">
						<div class="flex items-start justify-between">
							{@html icons.get("layers", "size-8")}
							<div class="flex flex-col items-end">
								<span class="text-xs text-zinc-400">[ <span class="text-zinc-200">03</span> ]</span>
								<span class="text-xs text-zinc-400 uppercase">[ context ]</span>
							</div>
						</div>
						<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Waypoints & graph routing</h1>
						<p class="text-zinc-400">Every memory anchors to a dynamic waypoint graph, powering contextual recall and multi-hop reasoning.</p>
					</div>
					<div class="relative w-full overflow-hidden">
						<div class="w-[85%] mt-4 mx-auto bg-stone-800 h-px"></div>
						<div class="mt-24 px-8 flex flex-col">
							<span class="font-medium"> Please use your imagination to visualize an image related to the text above. </span>
							<span class="text-zinc-400 mt-8"> The project maintainer is too broke to afford me to create an image for this, he owes me around $40 from our last collaboration. On top of that, he even said my designs don't fit his 'expectations'. </span>
						</div>
					</div>
				</div>

				<div class="row-span-6 grid grid-rows-4 gap-4">
					<div class="w-full h-full border-l border-b border-stone-900 relative overflow-hidden">
						<div class="p-8 relative z-10">
							<div class="flex items-start justify-between">
								{@html icons.get("layers", "size-8")}
								<div class="flex flex-col items-end">
									<span class="text-xs text-zinc-400">[ <span class="text-zinc-200">05</span> ]</span>
									<span class="text-xs text-zinc-400 uppercase">[ ingestion ]</span>
								</div>
							</div>
							<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Multimodal pipelines</h1>
							<p class="text-zinc-400">Stream documents, call transcripts, and events through adaptive chunking with automatic context stitching.</p>
						</div>
					</div>
					<div class="w-full h-full border-l border-y border-stone-900 relative overflow-hidden">
						<div class="p-8 relative z-10">
							<div class="flex items-start justify-between">
								{@html icons.get("bookmark", "size-8")}
								<div class="flex flex-col items-end">
									<span class="text-xs text-zinc-400">[ <span class="text-zinc-200">06</span> ]</span>
									<span class="text-xs text-zinc-400 uppercase">[ knowledge ]</span>
								</div>
							</div>
							<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Knowledge management</h1>
							<p class="text-zinc-400">Convert knowledge bases into living graphs the moment documents land, unlocking razor-sharp semantic discovery.</p>
						</div>
					</div>
					<div class="w-full h-full border-l border-t border-stone-900 border-b-0 relative overflow-hidden row-span-2">
						<div class="p-8 relative z-10">
							<div class="flex items-start justify-between">
								{@html icons.get("layers", "size-8")}
								<div class="flex flex-col items-end">
									<span class="text-xs text-zinc-400">[ <span class="text-zinc-200">07</span> ]</span>
									<span class="text-xs text-zinc-400 uppercase">[ providers ]</span>
								</div>
							</div>
							<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Modular embedding engines</h1>
							<p class="text-zinc-400">Swap between OpenAI, Gemini, Voyage, or local models without rewriting your pipeline.</p>
						</div>
						<div class="relative w-full h-full overflow-hidden">
							<img src="/assets/images/x6.png" alt="" class="object-cover w-full h-full object-center absolute top-0 -mt-28 inset-0 z-0 rotate-6 opacity-60" />
							<div class="absolute bottom-0 h-20 w-full bg-gradient-to-t from-black z-10 hidden"></div>
						</div>
					</div>
				</div>

				<div class="w-full h-full border border-stone-900 border-b-0 relative overflow-hidden row-span-2">
					<div class="p-8 relative z-10 mt-2">
						<div class="flex items-start justify-between">
							{@html icons.get("layers", "size-8")}
							<div class="flex flex-col items-end">
								<span class="text-xs text-zinc-400">[ <span class="text-zinc-200">04</span> ]</span>
								<span class="text-xs text-zinc-400 uppercase">[ performance ]</span>
							</div>
						</div>
						<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Cold-start free retrieval</h1>
						<p class="text-zinc-400">SQLite vector search with RAM caching gives you <span class="text-zinc-100">sub-40ms</span> responses without managing manually managing an infrastructure.</p>
					</div>
				</div>
			</div>

			<div class="w-full h-full border-r border-t border-stone-900 relative overflow-hidden">
				<div class="p-8 relative z-10">
					<div class="flex items-start justify-between">
						{@html icons.get("layers", "size-8")}
						<div class="flex flex-col items-end">
							<span class="text-xs text-zinc-400">[ <span class="text-zinc-200">02</span> ]</span>
							<span class="text-xs text-zinc-400 uppercase">[ structure ]</span>
						</div>
					</div>
					<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Multi-sector embeddings</h1>
					<p class="text-zinc-400">Encode conversations into five synchronized dimensional vectors that elegantly <span class="text-zinc-100">preserve nuance across sessions</span>.</p>
				</div>
				<img src="/assets/images/52.png" alt="" class="object-cover w-full h-full object-top-left absolute top-28 left-0 ml-32 mt-36 bottom-0 z-0 scale-150" />
				<div class="absolute bottom-0 h-20 w-full bg-gradient-to-t from-black z-10 hidden"></div>
			</div>
		</div>
	</div>
	<div class="max-w-7xl w-full h-full border border-stone-900 overflow-clip mt-10 bg-black grid grid-cols-3 gap-4">
		<div class="w-full border-b border-stone-900 p-4 py-2 flex items-center justify-between text-sm col-span-3">
			<h1 class="font-mono w-28 border-r border-stone-800 text-stone-500">[ <span class="text-stone-200">03</span> / 04 ]</h1>
			<span class="font-metrophobic w-28 text-right border-l border-stone-800 uppercase text-xs">[ I'm not sure ]</span>
		</div>
		<div class="w-full h-full border-b border-stone-900 relative overflow-hidden col-span-3">
			<div class="p-8 relative z-10 mt-2 bg-black">
				<div class="flex items-start justify-between">
					{@html icons.get("layers", "size-8")}
					<div class="flex flex-col items-end">
						<span class="text-xs text-zinc-400">[ <span class="text-zinc-200">00</span> ]</span>
						<span class="text-xs text-zinc-400 uppercase">[ decay engine ]</span>
					</div>
				</div>
				<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">How memory decay stays graceful and useful</h1>
				<p class="text-zinc-400">Memories fade following curved trajectories, while reinforcement pulses lift critical context back above the retention threshold.</p>
			</div>
			<img src="/assets/images/x5.png" alt="" class="object-cover object-top -mt-20 w-full h-[400px] z-0 skew-x-[25deg] skew-y-[-10deg] rotate-6" />
			<div class="absolute bottom-0 h-64 w-full z-30 bg-gradient-to-b from-transparent to-black"></div>
			<div class="absolute bottom-0 h-80 w-full z-30 bg-gradient-to-l from-transparent via-transparent to-black/50"></div>
		</div>
		<div class="w-full h-full border-r border-t border-stone-900 border-b-0 relative overflow-hidden">
			<div class="p-8 relative z-10 mt-2">
				<div class="flex items-start justify-between">
					{@html icons.get("layers", "size-8")}
					<div class="flex flex-col items-end">
						<span class="text-xs text-zinc-400">[ <span class="text-zinc-200">01</span> ]</span>
						<span class="text-xs text-zinc-400 uppercase">[ awareness ]</span>
					</div>
				</div>
				<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Sector-aware decay</h1>
				<p class="text-zinc-400">Each memory dimension carries its own slope and minimum floor so emotional cues linger longer than transient facts.</p>
			</div>
		</div>
		<div class="w-full h-full border-x border-t border-stone-900 border-b-0 relative overflow-hidden">
			<div class="p-8 relative z-10 mt-2">
				<div class="flex items-start justify-between">
					{@html icons.get("layers", "size-8")}
					<div class="flex flex-col items-end">
						<span class="text-xs text-zinc-400">[ <span class="text-zinc-200">02</span> ]</span>
						<span class="text-xs text-zinc-400 uppercase">[ autonomous ]</span>
					</div>
				</div>
				<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Automatic reinforcement</h1>
				<p class="text-zinc-400">Signal spikes from conversations or tool outcomes fire a pulse that restores strength without manual resets.</p>
			</div>
		</div>
		<div class="w-full h-full border-l border-t border-stone-900 border-b-0 relative overflow-hidden">
			<div class="p-8 relative z-10 mt-2">
				<div class="flex items-start justify-between">
					{@html icons.get("layers", "size-8")}
					<div class="flex flex-col items-end">
						<span class="text-xs text-zinc-400">[ <span class="text-zinc-200">03</span> ]</span>
						<span class="text-xs text-zinc-400 uppercase">[ attribution ]</span>
					</div>
				</div>
				<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Attribution trails</h1>
				<p class="text-zinc-400">Every reinforcement links back to its trigger so agents can explain why context remained in play.</p>
			</div>
		</div>
	</div>
	<div class="max-w-7xl w-full h-full border border-stone-900 overflow-clip mt-10 bg-black">
		<div class="w-full border-b border-stone-900 p-4 py-2 flex items-center justify-between text-sm col-span-3">
			<h1 class="font-mono w-28 border-r border-stone-800 text-stone-500">[ <span class="text-stone-200">04</span> / 04 ]</h1>
			<span class="font-metrophobic w-28 text-right border-l border-stone-800 uppercase text-xs">[ I'm not sure ]</span>
		</div>
		<div class="w-full py-16 px-10">
			<h1 class="text-2xl font-medium text-zinc-100 mb-2 mt-4">Get Started in Minutes</h1>
			<p class="text-zinc-400">Simple, intuitive API that gets you from zero to production-ready memory in just a few lines of code</p>
		</div>
		<div class="w-full h-full grid grid-cols-3 grid-rows-2 gap-4">
			<div class="w-full h-full border-l-0 border border-stone-900 relative overflow-hidden flex">
				<div class="p-8 relative z-10 my-auto">
					<div class="flex items-start justify-between">
						{@html icons.get("textFile", "size-8")}
						<div class="flex flex-col items-end">
							<span class="text-xs text-zinc-400">[ <span class="text-zinc-200">01</span> ]</span>
							<span class="text-xs text-zinc-400">[ conversational ]</span>
						</div>
					</div>
					<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Conversational AI</h1>
					<p class="text-zinc-400">Equip chat products with persistent preferences, tone awareness, and long-tail recollection so they sound brilliantly personal.</p>
				</div>
			</div>

			<div class="col-span-2 row-span-2">
				<div class="w-full border-r-0 border border-stone-900 p-4 py-2 flex items-center justify-between text-sm">
					<div class="flex items-center gap-2 text-stone-400">
						{@html icons.get("code", "size-4")}
						<h1 class="font-mono">GetStarted.js</h1>
					</div>
					<div class="flex items-center gap-2">
						<Dropdown options={["JavaScript"]} selected="JavaScript" />
						<button class="px-3 py-2 hover:bg-stone-900 hover:text-zinc-200 rounded-full duration-100 transition-all">
							{@html icons.get("clipboard", "size-4")}
						</button>
					</div>
				</div>
				<div class="max-h-[500px] w-full overflow-y-auto text-sm font-mono">
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">01</span>
						<span class="text-zinc-500 ml-4">// Add a memory with automatic multi-sector embedding</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">02</span>
						<span class="text-rose-400 ml-4">await</span>
						<span class="text-amber-400 ml-1">fetch</span>
						<span>(</span>
						<span class="text-green-400">'http://localhost:3000/memory/add'</span>
						<span>, &#123;</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">03</span>
						<span class="ml-8 text-zinc-300">method</span>
						<span>:&nbsp;</span>
						<span class="text-green-400">'POST'</span>
						<span>,</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">04</span>
						<span class="ml-8 text-zinc-300">headers</span>
						<span>:&nbsp;&#123;&nbsp;</span>
						<span class="text-green-400">'Content-Type'</span>
						<span>:&nbsp;</span>
						<span class="text-green-400">'application/json'</span>
						<span>&nbsp;&#125;,</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">05</span>
						<span class="ml-8 text-zinc-300">body</span>
						<span>:&nbsp;</span>
						<span class="text-amber-400">JSON</span>
						<span>.</span>
						<span class="text-amber-400">stringify</span>
						<span>(&#123;</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">06</span>
						<span class="ml-12 text-zinc-300">content</span>
						<span>:&nbsp;</span>
						<span class="text-green-400">'User prefers dark mode and minimal UI design'</span>
						<span>,</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">07</span>
						<span class="ml-12 text-zinc-300">metadata</span>
						<span>:&nbsp;&#123;&nbsp;</span>
						<span class="text-zinc-300">source</span>
						<span>:&nbsp;</span>
						<span class="text-green-400">'preferences'</span>
						<span>,&nbsp;</span>
						<span class="text-zinc-300">category</span>
						<span>:&nbsp;</span>
						<span class="text-green-400">'UI'</span>
						<span>&nbsp;&#125;</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">08</span>
						<span class="ml-8">&#125;)</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">09</span>
						<span class="ml-4">&#125;);</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">10</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">11</span>
						<span class="text-zinc-500 ml-4">// Query memories with decay-weighted relevance scoring</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">12</span>
						<span class="text-rose-400 ml-4">const</span>
						<span class="text-zinc-300 ml-1">response</span>
						<span class="ml-1">=</span>
						<span class="text-rose-400 ml-1">await</span>
						<span class="text-amber-400 ml-1">fetch</span>
						<span>(</span>
						<span class="text-green-400">'http://localhost:3000/memory/query'</span>
						<span>, &#123;</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">13</span>
						<span class="ml-8 text-zinc-300">method</span>
						<span>:&nbsp;</span>
						<span class="text-green-400">'POST'</span>
						<span>,</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">14</span>
						<span class="ml-8 text-zinc-300">headers</span>
						<span>:&nbsp;&#123;&nbsp;</span>
						<span class="text-green-400">'Content-Type'</span>
						<span>:&nbsp;</span>
						<span class="text-green-400">'application/json'</span>
						<span>&nbsp;&#125;,</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">15</span>
						<span class="ml-8 text-zinc-300">body</span>
						<span>:&nbsp;</span>
						<span class="text-amber-400">JSON</span>
						<span>.</span>
						<span class="text-amber-400">stringify</span>
						<span>(&#123;</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">16</span>
						<span class="ml-12 text-zinc-300">query</span>
						<span>:&nbsp;</span>
						<span class="text-green-400">'What are user interface preferences?'</span>
						<span>,</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">17</span>
						<span class="ml-12 text-zinc-300">topK</span>
						<span>:&nbsp;</span>
						<span class="text-amber-400">5</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">18</span>
						<span class="ml-8">&#125;)</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">19</span>
						<span class="ml-4">&#125;);</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">20</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">21</span>
						<span class="text-rose-400 ml-4">const</span>
						<span class="ml-1">&#123;&nbsp;</span>
						<span class="text-zinc-300">results</span>
						<span class="ml-1">&nbsp;&#125;</span>
						<span class="ml-1">=</span>
						<span class="text-rose-400 ml-1">await</span>
						<span class="text-zinc-300 ml-1">response</span>
						<span>.</span>
						<span class="text-amber-400">json</span>
						<span>();</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">22</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">23</span>
						<span class="text-zinc-500 ml-4">// Results include memories with decay scores and sector breakdowns</span>
					</div>
				</div>
			</div>

			<div class="w-full h-full border-r border-t border-stone-900 relative overflow-hidden flex">
				<div class="p-8 relative z-10 my-auto">
					<div class="flex items-start justify-between">
						{@html icons.get("users", "size-8")}
						<div class="flex flex-col items-end">
							<span class="text-xs text-zinc-400">[ <span class="text-zinc-200">02</span> ]</span>
							<span class="text-xs text-zinc-400 uppercase">[ assistants ]</span>
						</div>
					</div>
					<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Personal assistants</h1>
					<p class="text-zinc-400">Launch companion agents that accumulate rituals, goals, and collaborative context while staying effortlessly organized.</p>
				</div>
			</div>
		</div>
	</div>

	<div class="max-w-7xl w-full flex flex-col justify-between relative overflow-clip">
		<div class="w-full mt-36 grid grid-cols-3 gap-8 mx-auto">
			<div class="relative col-span-2">
				<h1 class="text-3xl font-medium text-zinc-100">Longmemory</h1>
				<p class="text-zinc-400 mt-4">An open-sourced project under the MIT License.</p>
				<p class="text-zinc-400">(c) 2026 Longmemory, CaviraOSS and contributors.</p>
			</div>
			<div class="relative items-end flex flex-col">
				<h1 class="text-xl text-zinc-400">Resources</h1>
				<div class="flex flex-col gap-2 mt-4 items-end">
					<a href="./longmemory/docs" class="hover:text-zinc-400 flex items-center gap-2 group">
						<span class="">Documentation</span>
						{@html icons.get("chevronRight", "h-4 w-0 group-hover:w-4 transition-all duration-200")}
					</a>
					<a href="https://github.com/CaviraOSS/Longmemory" class="hover:text-zinc-400 flex items-center gap-2 group">
						<span class="">GitHub</span>
						{@html icons.get("arrowTop", "h-4 w-0 group-hover:w-4 transition-all duration-200 rotate-45")}
					</a>
					<a href="#" class="hover:text-zinc-400 flex items-center gap-2 group">
						<span class="">Discord</span>
						{@html icons.get("arrowTop", "h-4 w-0 group-hover:w-4 transition-all duration-200 rotate-45")}
					</a>
				</div>
			</div>
		</div>

		{@html icons.get("Longmemory", "w-full h-auto opacity-30 mt-40")}
	</div>
</div>