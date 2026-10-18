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

	let composerText = $state("");
	let messages = $state([]);
	let results = $state(null);
	let busy = $state(false);
	let failure = $state("");

	const samples = [
		{ label: "Priya's profile", text: "Hi, I'm Priya. I'm the backend lead on the payments team, please ping me on Slack instead of email." },
		{ label: "An editor preference", text: "I prefer dark mode for the editor." },
		{ label: "A preference update", text: "Actually, switch me to light mode. Dark mode strains my eyes at night." },
	];

	async function submitComposer() {
		if (busy || !composerText.trim()) return;
		const next = [...messages, { text: composerText.trim(), at: Math.max(Date.now(), (messages.at(-1)?.at ?? 0) + 1) }];
		busy = true;
		failure = "";
		try {
			const { compare } = await import("$lib/utils/memory-lab");
			results = compare(next);
			messages = next;
			composerText = "";
		} catch (error) {
			failure = error instanceof Error ? error.message : "Local processing failed.";
		} finally { busy = false; }
	}

	function fillSample(sample) {
		composerText = sample.text;
	}

	function composer_key(event) {
		if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
			event.preventDefault();
			submitComposer();
		}
	}

	function reset_conversation() {
		messages = [];
		results = null;
		failure = "";
	}

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
			<h1 class="font-mono w-28 border-r border-stone-800 text-stone-500">[ <span class="text-stone-200">01</span> / 05 ]</h1>
			<span class="font-metrophobic w-28 text-right border-l border-stone-800 uppercase text-xs">[ hero ]</span>
		</div>

		<main class="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-28 sm:py-36 lg:py-56 text-center">
			<h1 class="text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-white max-w-4xl leading-1.5 text-balance mt-6">Durable, temporal, governed memory for AI agents.</h1>
			<p class="mt-6 text-base sm:text-lg text-zinc-300 max-w-3xl font-normal leading-relaxed text-balance">Longmemory is a local-first, self-hosted memory engine for LLM applications — not just a vector store. It tracks what's true now, what used to be true, and why, across four distinct recall modes.</p>
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
			<h1 class="font-mono w-28 border-r border-stone-800 text-stone-500">[ <span class="text-stone-200">02</span> / 05 ]</h1>
			<span class="font-metrophobic w-28 text-right border-l border-stone-800 uppercase text-xs">[ features ]</span>
		</div>
		<div class="w-full h-full grid grid-cols-3 grid-rows-2 gap-4">
			<div class="w-full h-full border-r border-b border-stone-900 relative overflow-hidden">
				<div class="p-8 relative z-10">
					<div class="flex items-start justify-between">
						{@html icons.get("watch", "size-8")}
						<div class="flex flex-col items-end">
							<span class="text-xs text-zinc-400">[ <span class="text-zinc-200">01</span> ]</span>
							<span class="text-xs text-zinc-400">[ IMMUTABLE ]</span>
						</div>
					</div>
					<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Hydrograph substrate</h1>
					<p class="text-zinc-400">Every write lands as an immutable node with <span class="text-zinc-100">executable edges, worlds, and entities</span>, not a flat row in a vector index.</p>
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
						<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Four recall modes, one engine</h1>
						<p class="text-zinc-400">Strict, historical, associative, and world-grounded recall run against the same substrate, so each query gets the retrieval contract it actually needs.</p>
					</div>
					<div class="relative w-full overflow-hidden">
						<div class="w-[85%] mt-4 mx-auto bg-stone-800 h-px"></div>
						<div class="mt-24 px-8 flex flex-col">
							<span class="font-medium"> Strict recall applies temporal, contradiction, and confidence gates for answers you can act on. </span>
							<span class="text-zinc-400 mt-8"> Historical and world-grounded recall preserve superseded truth and verify against current external evidence, while associative recall follows semantic, lexical, and graph signals across sessions. </span>
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
							<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Session porter & connectors</h1>
							<p class="text-zinc-400">Import history straight from coding agents and chat tools, then keep ingesting documents and events through the same pipeline.</p>
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
							<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Project memory & governed assets</h1>
							<p class="text-zinc-400">Give coding and workflow agents durable project memory, with governed assets that stay consistent across every session.</p>
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
							<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Eight embedding providers</h1>
							<p class="text-zinc-400">Swap between OpenAI, Gemini, NVIDIA NIM, AWS Bedrock, Ollama, or a local HTTP endpoint without rewriting your pipeline.</p>
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
								<span class="text-xs text-zinc-400 uppercase">[ storage ]</span>
							</div>
						</div>
						<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Local-first, durable storage</h1>
						<p class="text-zinc-400">SQLite keeps nodes, edges, worlds, and temporal history on disk, so recall survives restarts <span class="text-zinc-100">without a separate database service</span>.</p>
					</div>
				</div>
			</div>

			<div class="w-full h-full border-r border-t border-stone-900 relative overflow-hidden">
				<div class="p-8 relative z-10">
					<div class="flex items-start justify-between">
						{@html icons.get("layers", "size-8")}
						<div class="flex flex-col items-end">
							<span class="text-xs text-zinc-400">[ <span class="text-zinc-200">02</span> ]</span>
						<span class="text-xs text-zinc-400 uppercase">[ decay ]</span>
					</div>
				</div>
				<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Decay and reinforcement</h1>
				<p class="text-zinc-400">Confidence decays on a deterministic schedule and <span class="text-zinc-100">strengthens on explicit reinforcement</span>, so memory never needs manual tuning.</p>
				</div>
				<img src="/assets/images/52.png" alt="" class="object-cover w-full h-full object-top-left absolute top-28 left-0 ml-32 mt-36 bottom-0 z-0 scale-150" />
				<div class="absolute bottom-0 h-20 w-full bg-gradient-to-t from-black z-10 hidden"></div>
			</div>
		</div>
	</div>
	<div class="max-w-7xl w-full h-full border border-stone-900 overflow-clip mt-10 bg-black grid grid-cols-3 gap-4">
		<div class="w-full border-b border-stone-900 p-4 py-2 flex items-center justify-between text-sm col-span-3">
			<h1 class="font-mono w-28 border-r border-stone-800 text-stone-500">[ <span class="text-stone-200">03</span> / 05 ]</h1>
			<span class="font-metrophobic w-28 text-right border-l border-stone-800 uppercase text-xs">[ lifecycle ]</span>
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
				<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Memory that ages the way your product needs it to</h1>
				<p class="text-zinc-400">Confidence decays deterministically, reinforcement is explicit, and every change leaves a provenance trail back to its trigger.</p>
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
				<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Deterministic decay</h1>
				<p class="text-zinc-400">Each memory ages on a predictable curve with a configurable floor, so retrieval stays explainable instead of mysterious.</p>
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
				<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Explicit reinforcement</h1>
				<p class="text-zinc-400">Reinforcement events restore strength on demand, driven by real signals from conversations or tool outcomes, never a hidden background job.</p>
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
				<h1 class="text-xl font-medium text-zinc-100 mb-2 mt-4">Full provenance</h1>
				<p class="text-zinc-400">Every reinforcement and decay step links back to its trigger, so agents can explain why a memory is still in play.</p>
			</div>
		</div>
	</div>
	<div class="max-w-7xl w-full h-full border border-stone-900 overflow-clip mt-10 bg-black">
		<div class="w-full border-b border-stone-900 p-4 py-2 flex items-center justify-between text-sm">
			<h1 class="font-mono w-28 border-r border-stone-800 text-stone-500">[ <span class="text-stone-200">04</span> / 05 ]</h1>
			<span class="font-metrophobic w-28 text-right border-l border-stone-800 uppercase text-xs">[ try it ]</span>
		</div>
		<div class="w-full py-12 px-4 sm:px-10">
			<h1 class="text-2xl font-medium text-zinc-100 mb-2 mt-4">One conversation. Five memory architectures.</h1>
			<p class="text-zinc-400 max-w-3xl">Local processing, portable source code, and architecture models. Your conversation stays in this browser.</p>
			<p id="conversation-hint" class="mt-3 text-sm text-zinc-500 max-w-3xl">LongMemory's memory handling becomes clearer in longer chats. Keep the conversation going, revisit earlier topics, and change your preferences to see how it tracks context over time in this local demo.</p>
			<div class="mt-6 space-y-3" role="log" aria-label="Memory conversation">
				{#each messages as message, index}
					<div class="flex justify-end"><div class="max-w-xl min-w-0 rounded-lg bg-zinc-100 text-black px-4 py-3 text-sm whitespace-pre-wrap break-words"><span class="block text-[10px] text-zinc-500 mb-1">m{index + 1}</span>{message.text}</div></div>
				{/each}
			</div>

			<form onsubmit={(event) => { event.preventDefault(); submitComposer(); }} class="mt-8 border-t border-stone-900 pt-5">
				<label for="compare-memory" class="sr-only">Message</label>
				<textarea
					id="compare-memory"
					aria-describedby="conversation-hint"
					bind:value={composerText}
					onkeydown={composer_key}
					rows="3" maxlength="4000" required disabled={busy}
					placeholder="Tell your agent something to remember..."
					class="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 resize-y focus:border-zinc-500 outline-none text-zinc-100 placeholder:text-zinc-600 font-mono text-sm"
				></textarea>
				<div class="mt-3 flex items-center justify-between flex-wrap gap-3">
					<div class="flex flex-wrap gap-2">
						{#each samples as sample (sample.label)}
							<button type="button" disabled={busy} onclick={() => fillSample(sample)} class="py-2 pr-4 text-xs text-zinc-400 hover:text-zinc-100 underline underline-offset-4 disabled:opacity-50">
								{sample.label}
							</button>
						{/each}
					</div>
					<div class="flex items-center gap-3">
						{#if messages.length}<button type="button" onclick={reset_conversation} disabled={busy} class="text-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-40">Clear conversation</button>{/if}
						<button type="submit" disabled={busy || !composerText.trim()} class="shrink-0 min-w-28 justify-center px-4 py-2 rounded-lg bg-zinc-100 hover:opacity-70 text-black text-sm font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-40">
							<span>{busy ? "Processing..." : "Send"}</span>
							{@html icons.get("chevronRight", "size-4")}
						</button>
					</div>
				</div>
			</form>
			{#if failure}<p role="alert" class="mt-4 text-sm text-rose-400">{failure}</p>{/if}
			{#if busy}<p role="status" class="mt-4 text-sm text-zinc-400">Loading local processing code...</p>{/if}
		</div>

		{#if results}
			<div class="px-4 sm:px-10 pb-12 flex flex-col gap-4" aria-live="polite">
				<div class="flex justify-between gap-4 flex-wrap text-xs text-zinc-500"><span>5 local paths / {messages.length} message{messages.length === 1 ? "" : "s"}</span><span>Sorted by local score; equal scores stay tied.</span></div>
				{#each results as result (result.id)}
					<div class="border border-stone-800 rounded-lg p-4 sm:p-5 bg-white/[0.01] min-w-0" data-backend={result.id}>
						<div class="flex items-start justify-between gap-4 flex-wrap">
							<div class="h-6 flex items-center gap-2 min-w-0" aria-label={result.name}>
								{@html icons.get(result.logo, "h-full w-auto max-w-[130px] text-zinc-200")}
								{#if result.id === "supermemory"}<span class="text-sm text-zinc-200">{result.name}</span>{/if}
							</div>
							<span class="text-xs text-zinc-400">{result.score === null ? "Not scored" : `${result.score}/100 local score`}</span>
						</div>
						<p class="mt-3 text-[11px] text-zinc-500">{result.basis}</p>
						{#if result.score !== null}<div role="meter" aria-label={`${result.name} local score`} aria-valuenow={result.score} aria-valuemin="0" aria-valuemax="100" class="mt-3 h-1 w-full bg-stone-900 overflow-hidden"><div class="h-full bg-zinc-200" style:width={`${result.score}%`}></div></div>{/if}
							<div class="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
								<div class="min-w-0">
									<p class="text-xs text-zinc-500 mb-2">Agent context</p>
									<pre class="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words font-mono mb-4">{result.context || "No supported facts extracted by this local path."}</pre>
									<details class="text-xs text-zinc-500"><summary class="cursor-pointer hover:text-zinc-200">Memory representation</summary><pre class="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono">{JSON.stringify(result.stored, null, 2)}</pre></details>
									<a href={result.source} target="_blank" rel="noreferrer" class="inline-flex mt-4 text-xs text-zinc-500 hover:text-zinc-200 underline underline-offset-4">Source / architecture reference</a>
								</div>
								<div class="min-w-0">
									<dl class="space-y-2 text-xs text-zinc-400">
										<div class="flex justify-between gap-3"><dt>Agent readiness</dt><dd>{result.readiness === null ? "N/A" : `${result.readiness}/100`}</dd></div>
										<div class="flex justify-between gap-3"><dt>Fact coverage</dt><dd>{result.metrics.coverage}%</dd></div>
										<div class="flex justify-between gap-3"><dt>Source grounding</dt><dd>{result.metrics.grounding}%</dd></div>
										<div class="flex justify-between gap-3"><dt>Freshness</dt><dd>{result.metrics.freshness === null ? "N/A" : `${result.metrics.freshness}%`}</dd></div>
										<div class="flex justify-between gap-3"><dt>Structured facts</dt><dd>{result.metrics.structure}%</dd></div>
										<div class="flex justify-between gap-3"><dt>Unique facts</dt><dd>{result.metrics.uniqueness}%</dd></div>
										<div class="flex justify-between gap-3"><dt>Token efficiency</dt><dd>{result.efficiency}%</dd></div>
										<div class="flex justify-between gap-3"><dt>Context tokens</dt><dd>{result.context_tokens}</dd></div>
										<div class="flex justify-between gap-3"><dt>Stored JSON tokens</dt><dd>{result.stored_tokens}</dd></div>
										<div class="flex justify-between gap-3"><dt>Cost / 1k recalls*</dt><dd>${result.cost_per_thousand.toFixed(4)}</dd></div>
										<div class="flex justify-between gap-3"><dt>Current / historical facts</dt><dd>{result.active_records} / {result.historical_records}</dd></div>
									</dl>
								</div>
							</div>
					</div>
				{/each}
			</div>
		{/if}

		<details class="px-4 sm:px-10 pb-8 text-xs text-zinc-500 max-w-4xl"><summary class="cursor-pointer hover:text-zinc-200">Scoring and limitations</summary><p class="mt-3 leading-relaxed">Readiness = 35% value-based fact coverage + 15% source grounding + 20% freshness + 20% structure + 10% uniqueness. Coverage checks normalized values and explicit instead-of/rather-than restrictions, not filler wording. Unavailable dimensions are excluded. Local score = 80% readiness + 20% coverage-adjusted token efficiency. These English rule-based subsets are not full product benchmarks or semantic correctness judgments. Supermemory's private engine is not included; its path models public documentation. All paths use the same shared input analysis, with no brand bonuses.</p><p class="mt-3 leading-relaxed">Tokens use GPT-4o's tokenizer. *Cost models sending this context 1,000 times at a standardized $1 per million input tokens, not provider pricing, write/embedding costs, or a bill. Local processing makes no API calls.</p><a href="/memory-lab-notices.txt" target="_blank" rel="noreferrer" class="inline-block mt-3 underline underline-offset-4">Source and license notices</a></details>
	</div>
	<div class="max-w-7xl w-full h-full border border-stone-900 overflow-clip mt-10 bg-black">
		<div class="w-full border-b border-stone-900 p-4 py-2 flex items-center justify-between text-sm col-span-3">
			<h1 class="font-mono w-28 border-r border-stone-800 text-stone-500">[ <span class="text-stone-200">05</span> / 05 ]</h1>
			<span class="font-metrophobic w-28 text-right border-l border-stone-800 uppercase text-xs">[ get started ]</span>
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
						<span class="text-zinc-500 ml-4">// Ingest a memory through the REST API</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">02</span>
						<span class="text-rose-400 ml-4">await</span>
						<span class="text-amber-400 ml-1">fetch</span>
						<span>(</span>
						<span class="text-green-400">'http://localhost:3000/v1/ingest'</span>
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
						<span class="ml-12 text-zinc-300">user_id</span>
						<span>:&nbsp;</span>
						<span class="text-green-400">'alice'</span>
						<span>,</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">07</span>
						<span class="ml-12 text-zinc-300">text</span>
						<span>:&nbsp;</span>
						<span class="text-green-400">'I prefer TypeScript for backend services'</span>
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
						<span class="text-zinc-500 ml-4">// Recall with an explicit mode: strict, historical, associative, or world_grounded</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">12</span>
						<span class="text-rose-400 ml-4">const</span>
						<span class="text-zinc-300 ml-1">response</span>
						<span class="ml-1">=</span>
						<span class="text-rose-400 ml-1">await</span>
						<span class="text-amber-400 ml-1">fetch</span>
						<span>(</span>
						<span class="text-green-400">'http://localhost:3000/v1/recall'</span>
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
						<span class="ml-12 text-zinc-300">text</span>
						<span>:&nbsp;</span>
						<span class="text-green-400">'What language does Alice prefer?'</span>
						<span>,</span>
					</div>
					<div class="w-full border-l border-stone-900 py-1 pl-4 flex items-center text-zinc-400 hover:border-stone-600 hover:bg-stone-950 transition-all duration-100">
						<span class="text-zinc-500 select-none">17</span>
						<span class="ml-12 text-zinc-300">mode</span>
						<span>:&nbsp;</span>
						<span class="text-green-400">'strict'</span>
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
						<span class="text-zinc-500 ml-4">// Results include evidence, confidence, and a traceable provenance chain</span>
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
				<p class="text-zinc-400 mt-4">An open-source project licensed under the Apache License 2.0.</p>
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