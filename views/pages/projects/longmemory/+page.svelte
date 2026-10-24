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
			duration: 1.2,
			easing: (t) => Math.min(1, 1.001 - Math.pow(1.8, -10 * t)),
			orientation: "vertical",
			gestureOrientation: "vertical",
			smoothWheel: true,
			wheelMultiplier: 1,
			touchMultiplier: 1.5,
		});

		return () => {
			lenis.destroy();
		};
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
		} finally {
			busy = false;
		}
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

		const camera = new THREE.PerspectiveCamera(45, (container.clientWidth || 1) / (container.clientHeight || 1), 0.1, 1000);
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
		const reticleTexture = new THREE.CanvasTexture(canvas);

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
			if (rect.width === 0 || rect.height === 0) return;
			targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
			targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
		};

		window.addEventListener("mousemove", onMouseMove);

		const onResize = () => {
			if (!container) return;
			const w = container.clientWidth;
			const h = container.clientHeight;
			if (w === 0 || h === 0) return;
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

			strandMeshes.forEach(({ line, seed, scaleRadius }) => {
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

<Cursor />

<div class="bg-black min-h-svh w-full text-neutral-300 overflow-x-hidden relative p-3 sm:p-6 md:p-8 flex flex-col justify-center items-center font-funnel selection:bg-neutral-800 selection:text-white">
	<header class="fixed z-40 w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] max-w-7xl mx-auto p-3 sm:p-4 bg-black/70 backdrop-blur-xl border border-stone-800/80 top-3 sm:top-4 flex items-center justify-between">
		<a href="/" class="text-lg sm:text-xl font-medium text-white tracking-tight">Longmemory</a>
		<nav class="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
			<a href="./longmemory/docs" class="text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors">
				<span>Docs</span>
				{@html icons.get("chevronRight", "size-3.5 text-zinc-500")}
			</a>
			<a href="https://github.com/CaviraOSS/Longmemory" target="_blank" rel="noopener noreferrer" class="text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors">
				<span>GitHub</span>
				{@html icons.get("arrowTop", "size-3.5 rotate-45 text-zinc-500")}
			</a>
			<a href="https://cavira.app/discord" target="_blank" rel="noopener noreferrer" class="text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors">
				<span>Discord</span>
				{@html icons.get("arrowTop", "size-3.5 rotate-45 text-zinc-500")}
			</a>
		</nav>
	</header>

	<div
		class="relative w-full max-w-7xl flex flex-col justify-between border border-stone-900 bg-black/60 backdrop-blur-[1px] text-zinc-400 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.9)] mt-16 sm:mt-20 h-[calc(100svh-6rem)] sm:h-[calc(100svh-8rem)] md:h-[calc(100svh-6rem)] lg:h-[calc(100svh-10rem)]">
		<div bind:this={container} class="pointer-events-none absolute inset-0 z-0 scale-150"></div>
		<div class="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.85)_75%)]"></div>

		<div class="relative w-full border-b border-stone-900 px-4 py-2 flex items-center justify-between text-xs sm:text-sm z-10">
			<span class="font-mono text-stone-500">[ <span class="text-stone-200">01</span> / 05 ]</span>
			<span class="font-mono uppercase text-[11px] text-stone-500 tracking-wider">[ hero ]</span>
		</div>

		<main class="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 md:px-12 py-28 md:py-36 lg:py-44 pb-4 text-center">
			<h1 class="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight text-white max-w-5xl leading-[1.12] text-left md:text-center text-balance">Durable, temporal, governed memory for AI agents.</h1>
			<p class="mt-5 sm:mt-6 text-sm sm:text-base md:text-lg text-zinc-300 max-w-3xl md:max-w-5xl font-light leading-relaxed text-left md:text-center md:text-balance">
				Longmemory is a local-first, self-hosted memory engine for LLM applications — not just a vector store. It tracks what's true now, what used to be true, and why, across four distinct recall modes.
			</p>
			<div class="mt-auto md:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full">
				<a href="./longmemory/docs" class="w-full sm:w-auto px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_25px_rgba(255,255,255,0.12)]">
					<span>Initialize Memory</span>
					{@html icons.get("chevronRight", "size-4")}
				</a>

				<div class="w-full sm:w-auto px-5 py-2.5 rounded-full border border-stone-800 bg-stone-950/80 text-zinc-300 text-xs sm:text-sm font-mono flex items-center justify-center gap-2 backdrop-blur-sm select-all">
					<span class="text-zinc-500">$</span>
					<span>npm install longmemory</span>
				</div>
			</div>
		</main>
	</div>

	<section class="max-w-7xl w-full border border-stone-900 overflow-hidden mt-8 sm:mt-12 bg-black">
		<div class="w-full border-b border-stone-900 px-4 py-2 flex items-center justify-between text-xs sm:text-sm">
			<span class="font-mono text-stone-500">[ <span class="text-stone-200">02</span> / 05 ]</span>
			<span class="font-mono uppercase text-[11px] text-stone-500 tracking-wider">[ features ]</span>
		</div>

		<div class="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-stone-900">
			<div class="bg-black p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden min-h-[340px] sm:min-h-[380px]">
				<div class="relative z-10">
					<div class="flex items-start justify-between">
						{@html icons.get("watch", "size-6 sm:size-8 text-zinc-300")}
						<div class="flex flex-col items-end font-mono text-xs text-zinc-500">
							<span>[ <span class="text-zinc-200">01</span> ]</span>
							<span class="text-[10px]">[ IMMUTABLE ]</span>
						</div>
					</div>
					<h2 class="text-lg sm:text-xl font-medium text-zinc-100 mb-2 mt-6">Hydrograph substrate</h2>
					<p class="text-xs sm:text-sm text-zinc-400 leading-relaxed">
						Every write lands as an immutable node with <span class="text-zinc-100">executable edges, worlds, and entities</span>, not a flat row in a vector index.
					</p>
				</div>
				<img src="/assets/images/x1.png" alt="" class="object-cover w-full h-full absolute top-28 rotate-6 left-0 bottom-0 z-0 scale-105 pointer-events-none" />
				<div class="absolute inset-0 bg-gradient-to-t from-black/20 via-black/10 to-transparent z-0 pointer-events-none"></div>
			</div>

			<div class="bg-black p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden lg:col-span-2">
				<div class="relative z-10">
					<div class="flex items-start justify-between">
						{@html icons.get("layers", "size-6 sm:size-8 text-zinc-300")}
						<div class="flex flex-col items-end font-mono text-xs text-zinc-500">
							<span>[ <span class="text-zinc-200">02</span> ]</span>
							<span class="text-[10px] uppercase">[ context ]</span>
						</div>
					</div>
					<h2 class="text-lg sm:text-xl font-medium text-zinc-100 mb-2 mt-6">Four recall modes, one engine</h2>
					<p class="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">Strict, historical, associative, and world-grounded recall run against the same substrate, so each query gets the retrieval contract it actually needs.</p>
					<div class="mt-6 pt-6 border-t border-stone-900 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
						<span class="text-zinc-300">Strict recall applies temporal, contradiction, and confidence gates for answers you can act on.</span>
						<span class="text-zinc-500">Historical and world-grounded recall preserve superseded truth and verify against current external evidence.</span>
					</div>
				</div>
			</div>

			<div class="bg-black p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
				<div class="relative z-10">
					<div class="flex items-start justify-between">
						{@html icons.get("layers", "size-6 sm:size-8 text-zinc-300")}
						<div class="flex flex-col items-end font-mono text-xs text-zinc-500">
							<span>[ <span class="text-zinc-200">03</span> ]</span>
							<span class="text-[10px] uppercase">[ ingestion ]</span>
						</div>
					</div>
					<h2 class="text-lg sm:text-xl font-medium text-zinc-100 mb-2 mt-6">Session porter & connectors</h2>
					<p class="text-xs sm:text-sm text-zinc-400 leading-relaxed">Import history straight from coding agents and chat tools, then keep ingesting documents and events through the same pipeline.</p>
				</div>
			</div>

			<div class="bg-black p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
				<div class="relative z-10">
					<div class="flex items-start justify-between">
						{@html icons.get("bookmark", "size-6 sm:size-8 text-zinc-300")}
						<div class="flex flex-col items-end font-mono text-xs text-zinc-500">
							<span>[ <span class="text-zinc-200">04</span> ]</span>
							<span class="text-[10px] uppercase">[ knowledge ]</span>
						</div>
					</div>
					<h2 class="text-lg sm:text-xl font-medium text-zinc-100 mb-2 mt-6">Project memory & governed assets</h2>
					<p class="text-xs sm:text-sm text-zinc-400 leading-relaxed">Give coding and workflow agents durable project memory, with governed assets that stay consistent across every session.</p>
				</div>
			</div>

			<div class="bg-black p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
				<div class="relative z-10">
					<div class="flex items-start justify-between">
						{@html icons.get("layers", "size-6 sm:size-8 text-zinc-300")}
						<div class="flex flex-col items-end font-mono text-xs text-zinc-500">
							<span>[ <span class="text-zinc-200">05</span> ]</span>
							<span class="text-[10px] uppercase">[ storage ]</span>
						</div>
					</div>
					<h2 class="text-lg sm:text-xl font-medium text-zinc-100 mb-2 mt-6">Local-first, durable storage</h2>
					<p class="text-xs sm:text-sm text-zinc-400 leading-relaxed">
						SQLite keeps nodes, edges, worlds, and temporal history on disk, so recall survives restarts <span class="text-zinc-100">without a separate database service</span>.
					</p>
				</div>
			</div>

			<div class="bg-black p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden md:col-span-2 lg:col-span-2 min-h-[300px]">
				<div class="relative z-10">
					<div class="flex items-start justify-between">
						{@html icons.get("layers", "size-6 sm:size-8 text-zinc-300")}
						<div class="flex flex-col items-end font-mono text-xs text-zinc-500">
							<span>[ <span class="text-zinc-200">06</span> ]</span>
							<span class="text-[10px] uppercase">[ providers ]</span>
						</div>
					</div>
					<h2 class="text-lg sm:text-xl font-medium text-zinc-100 mb-2 mt-6">Eight embedding providers</h2>
					<p class="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">Swap between OpenAI, Gemini, NVIDIA NIM, AWS Bedrock, Ollama, or a local HTTP endpoint without rewriting your pipeline.</p>
				</div>
				<div class="relative w-full h-44 sm:h-52 overflow-hidden mt-4 z-0 pointer-events-none">
					<img src="/assets/images/x6.png" alt="" class="object-cover w-full h-full object-center absolute inset-0 rotate-6 opacity-60" />
					<div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
				</div>
			</div>

			<div class="bg-black p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden md:col-span-2 lg:col-span-1 min-h-[340px] sm:min-h-[380px]">
				<div class="relative z-10">
					<div class="flex items-start justify-between">
						{@html icons.get("layers", "size-6 sm:size-8 text-zinc-300")}
						<div class="flex flex-col items-end font-mono text-xs text-zinc-500">
							<span>[ <span class="text-zinc-200">07</span> ]</span>
							<span class="text-[10px] uppercase">[ decay ]</span>
						</div>
					</div>
					<h2 class="text-lg sm:text-xl font-medium text-zinc-100 mb-2 mt-6">Decay and reinforcement</h2>
					<p class="text-xs sm:text-sm text-zinc-400 leading-relaxed">
						Confidence decays on a deterministic schedule and <span class="text-zinc-100">strengthens on explicit reinforcement</span>, so memory never needs manual tuning.
					</p>
				</div>
				<img src="/assets/images/52.png" alt="" class="object-cover w-full h-full object-top-left absolute top-28 left-0 ml-16 sm:ml-32 mt-20 sm:mt-36 bottom-0 z-0 scale-125 sm:scale-150 pointer-events-none" />
				<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent z-0 pointer-events-none"></div>
			</div>
		</div>
	</section>

	<section class="max-w-7xl w-full border border-stone-900 overflow-hidden mt-8 sm:mt-12 bg-black">
		<div class="w-full border-b border-stone-900 px-4 py-2 flex items-center justify-between text-xs sm:text-sm">
			<span class="font-mono text-stone-500">[ <span class="text-stone-200">03</span> / 05 ]</span>
			<span class="font-mono uppercase text-[11px] text-stone-500 tracking-wider">[ lifecycle ]</span>
		</div>

		<div class="w-full relative overflow-hidden border-b border-stone-900 bg-black">
			<div class="p-6 sm:p-10 relative z-10">
				<div class="flex items-start justify-between">
					{@html icons.get("layers", "size-6 sm:size-8 text-zinc-300")}
					<div class="flex flex-col items-end font-mono text-xs text-zinc-500">
						<span>[ <span class="text-zinc-200">00</span> ]</span>
						<span class="text-[10px] uppercase">[ decay engine ]</span>
					</div>
				</div>
				<h2 class="text-xl sm:text-2xl font-medium text-zinc-100 mb-2 mt-6">Memory that ages the way your product needs it to</h2>
				<p class="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">Confidence decays deterministically, reinforcement is explicit, and every change leaves a provenance trail back to its trigger.</p>
			</div>
			<div class="relative w-full h-40 sm:h-72 md:h-80 lg:h-96 overflow-hidden">
				<img src="/assets/images/x5.png" alt="" class="object-cover object-top -mt-10 sm:-mt-20 w-full h-full z-0 skew-x-[15deg] sm:skew-x-[25deg] skew-y-[-6deg] sm:skew-y-[-10deg] rotate-6 opacity-75" />
				<div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 pointer-events-none"></div>
				<div class="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80 z-10 pointer-events-none"></div>
			</div>
		</div>

		<div class="w-full grid grid-cols-1 md:grid-cols-3 gap-px bg-stone-900">
			<div class="bg-black p-6 sm:p-8 flex flex-col justify-between">
				<div>
					<div class="flex items-start justify-between font-mono text-xs text-zinc-500 mb-4">
						{@html icons.get("layers", "size-6 text-zinc-400")}
						<span>[ 01 ]</span>
					</div>
					<h3 class="text-base sm:text-lg font-medium text-zinc-100 mb-2">Deterministic decay</h3>
					<p class="text-xs sm:text-sm text-zinc-400 leading-relaxed">Each memory ages on a predictable curve with a configurable floor, so retrieval stays explainable instead of mysterious.</p>
				</div>
			</div>

			<div class="bg-black p-6 sm:p-8 flex flex-col justify-between">
				<div>
					<div class="flex items-start justify-between font-mono text-xs text-zinc-500 mb-4">
						{@html icons.get("layers", "size-6 text-zinc-400")}
						<span>[ 02 ]</span>
					</div>
					<h3 class="text-base sm:text-lg font-medium text-zinc-100 mb-2">Explicit reinforcement</h3>
					<p class="text-xs sm:text-sm text-zinc-400 leading-relaxed">Reinforcement events restore strength on demand, driven by real signals from conversations or tool outcomes, never a hidden background job.</p>
				</div>
			</div>

			<div class="bg-black p-6 sm:p-8 flex flex-col justify-between">
				<div>
					<div class="flex items-start justify-between font-mono text-xs text-zinc-500 mb-4">
						{@html icons.get("layers", "size-6 text-zinc-400")}
						<span>[ 03 ]</span>
					</div>
					<h3 class="text-base sm:text-lg font-medium text-zinc-100 mb-2">Full provenance</h3>
					<p class="text-xs sm:text-sm text-zinc-400 leading-relaxed">Every reinforcement and decay step links back to its trigger, so agents can explain why a memory is still in play.</p>
				</div>
			</div>
		</div>
	</section>

	<section class="max-w-7xl w-full border border-stone-900 overflow-hidden mt-8 sm:mt-12 bg-black">
		<div class="w-full border-b border-stone-900 px-4 py-2 flex items-center justify-between text-xs sm:text-sm">
			<span class="font-mono text-stone-500">[ <span class="text-stone-200">04</span> / 05 ]</span>
			<span class="font-mono uppercase text-[11px] text-stone-500 tracking-wider">[ try it ]</span>
		</div>

		<div class="w-full py-8 sm:py-12 px-4 sm:px-8 md:px-10">
			<h2 class="text-xl sm:text-2xl font-medium text-zinc-100 mb-2">One conversation. Five memory architectures.</h2>
			<p class="text-xs sm:text-sm text-zinc-400 max-w-3xl">Local processing, portable source code, and architecture models. Your conversation stays in this browser.</p>
			<p id="conversation-hint" class="mt-2 text-xs text-zinc-500 max-w-3xl">LongMemory's memory handling becomes clearer in longer chats. Keep the conversation going, revisit earlier topics, and change your preferences to see how it tracks context over time in this local demo.</p>

			<div class="mt-6 space-y-3" role="log" aria-label="Memory conversation">
				{#each messages as message, index}
					<div class="flex justify-end">
						<div class="max-w-xl min-w-0 rounded-lg bg-zinc-100 text-black px-4 py-2.5 text-xs sm:text-sm whitespace-pre-wrap break-words">
							<span class="block text-[10px] text-zinc-500 mb-1 font-mono">m{index + 1}</span>
							{message.text}
						</div>
					</div>
				{/each}
			</div>

			<form
				onsubmit={(event) => {
					event.preventDefault();
					submitComposer();
				}}
				class="mt-6 border-t border-stone-900 pt-5">
				<label for="compare-memory" class="sr-only">Message</label>
				<textarea
					id="compare-memory"
					aria-describedby="conversation-hint"
					bind:value={composerText}
					onkeydown={composer_key}
					rows="3"
					maxlength="4000"
					required
					disabled={busy}
					placeholder="Tell your agent something to remember..."
					class="w-full bg-stone-950 border border-stone-800 rounded-lg p-3 resize-y focus:border-zinc-500 outline-none text-zinc-100 placeholder:text-zinc-600 font-mono text-xs sm:text-sm"></textarea>

				<div class="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
					<div class="flex flex-wrap items-center gap-x-4 gap-y-1">
						{#each samples as sample (sample.label)}
							<button type="button" disabled={busy} onclick={() => fillSample(sample)} class="py-1 text-xs text-zinc-400 hover:text-zinc-100 underline underline-offset-4 disabled:opacity-50 text-left">
								{sample.label}
							</button>
						{/each}
					</div>

					<div class="flex items-center justify-end gap-3 shrink-0">
						{#if messages.length}
							<button type="button" onclick={reset_conversation} disabled={busy} class="text-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-40"> Clear conversation </button>
						{/if}
						<button type="submit" disabled={busy || !composerText.trim()} class="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-black text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40">
							<span>{busy ? "Processing..." : "Send"}</span>
							{@html icons.get("chevronRight", "size-3.5")}
						</button>
					</div>
				</div>
			</form>

			{#if failure}
				<p role="alert" class="mt-4 text-xs sm:text-sm text-rose-400">{failure}</p>
			{/if}
			{#if busy}
				<p role="status" class="mt-4 text-xs sm:text-sm text-zinc-400">Loading local processing code...</p>
			{/if}
		</div>

		{#if results}
			<div class="px-4 sm:px-8 md:px-10 pb-10 flex flex-col gap-4" aria-live="polite">
				<div class="flex justify-between gap-4 flex-wrap text-xs text-zinc-500">
					<span>5 local paths / {messages.length} message{messages.length === 1 ? "" : "s"}</span>
					<span>Sorted by local score; equal scores stay tied.</span>
				</div>

				{#each results as result (result.id)}
					<div class="border border-stone-800 rounded-lg p-4 sm:p-5 bg-stone-950/40 min-w-0" data-backend={result.id}>
						<div class="flex items-start justify-between gap-4 flex-wrap">
							<div class="h-6 flex items-center gap-2 min-w-0" aria-label={result.name}>
								{@html icons.get(result.logo, "h-full w-auto max-w-[130px] text-zinc-200")}
								{#if result.id === "supermemory"}
									<span class="text-xs sm:text-sm text-zinc-200 font-medium">{result.name}</span>
								{/if}
							</div>
							<span class="text-xs text-zinc-400 font-mono">
								{result.score === null ? "Not scored" : `${result.score}/100 local score`}
							</span>
						</div>

						<p class="mt-3 text-[11px] text-zinc-500">{result.basis}</p>

						{#if result.score !== null}
							<div role="meter" aria-label={`${result.name} local score`} aria-valuenow={result.score} aria-valuemin="0" aria-valuemax="100" class="mt-3 h-1 w-full bg-stone-900 overflow-hidden rounded-full">
								<div class="h-full bg-zinc-200 transition-all duration-300" style:width={`${result.score}%`}></div>
							</div>
						{/if}

						<div class="mt-5 grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
							<div class="min-w-0">
								<p class="text-xs font-mono text-zinc-500 mb-2">Agent context</p>
								<pre class="text-xs sm:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words font-mono mb-4 p-3 bg-stone-900/40 rounded border border-stone-800">{result.context || "No supported facts extracted by this local path."}</pre>

								<details class="text-xs text-zinc-500">
									<summary class="cursor-pointer hover:text-zinc-200 py-1">Memory representation</summary>
									<pre class="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono p-3 bg-stone-950 rounded border border-stone-900">{JSON.stringify(result.stored, null, 2)}</pre>
								</details>

								<a href={result.source} target="_blank" rel="noreferrer" class="inline-flex mt-4 text-xs text-zinc-500 hover:text-zinc-200 underline underline-offset-4"> Source / architecture reference </a>
							</div>

							<div class="min-w-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-stone-800">
								<dl class="space-y-1.5 text-xs text-zinc-400 font-mono">
									<div class="flex justify-between gap-3">
										<dt class="text-zinc-500">Agent readiness</dt>
										<dd>{result.readiness === null ? "N/A" : `${result.readiness}/100`}</dd>
									</div>
									<div class="flex justify-between gap-3">
										<dt class="text-zinc-500">Fact coverage</dt>
										<dd>{result.metrics.coverage}%</dd>
									</div>
									<div class="flex justify-between gap-3">
										<dt class="text-zinc-500">Source grounding</dt>
										<dd>{result.metrics.grounding}%</dd>
									</div>
									<div class="flex justify-between gap-3">
										<dt class="text-zinc-500">Freshness</dt>
										<dd>{result.metrics.freshness === null ? "N/A" : `${result.metrics.freshness}%`}</dd>
									</div>
									<div class="flex justify-between gap-3">
										<dt class="text-zinc-500">Structured facts</dt>
										<dd>{result.metrics.structure}%</dd>
									</div>
									<div class="flex justify-between gap-3">
										<dt class="text-zinc-500">Unique facts</dt>
										<dd>{result.metrics.uniqueness}%</dd>
									</div>
									<div class="flex justify-between gap-3">
										<dt class="text-zinc-500">Token efficiency</dt>
										<dd>{result.efficiency}%</dd>
									</div>
									<div class="flex justify-between gap-3">
										<dt class="text-zinc-500">Context tokens</dt>
										<dd>{result.context_tokens}</dd>
									</div>
									<div class="flex justify-between gap-3">
										<dt class="text-zinc-500">Stored JSON tokens</dt>
										<dd>{result.stored_tokens}</dd>
									</div>
									<div class="flex justify-between gap-3">
										<dt class="text-zinc-500">Cost / 1k recalls*</dt>
										<dd>${result.cost_per_thousand.toFixed(4)}</dd>
									</div>
									<div class="flex justify-between gap-3">
										<dt class="text-zinc-500">Current / hist facts</dt>
										<dd>{result.active_records} / {result.historical_records}</dd>
									</div>
								</dl>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<details class="px-4 sm:px-8 md:px-10 pb-8 text-xs text-zinc-500 max-w-4xl">
			<summary class="cursor-pointer hover:text-zinc-200">Scoring and limitations</summary>
			<p class="mt-3 leading-relaxed">
				Readiness = 35% value-based fact coverage + 15% source grounding + 20% freshness + 20% structure + 10% uniqueness. Coverage checks normalized values and explicit instead-of/rather-than restrictions, not filler wording. Unavailable dimensions are excluded. Local score = 80% readiness
				+ 20% coverage-adjusted token efficiency. These English rule-based subsets are not full product benchmarks or semantic correctness judgments. Supermemory's private engine is not included; its path models public documentation. All paths use the same shared input analysis, with no
				brand bonuses.
			</p>
			<p class="mt-2 leading-relaxed">Tokens use GPT-4o's tokenizer. *Cost models sending this context 1,000 times at a standardized $1 per million input tokens, not provider pricing, write/embedding costs, or a bill. Local processing makes no API calls.</p>
			<a href="/memory-lab-notices.txt" target="_blank" rel="noreferrer" class="inline-block mt-3 underline underline-offset-4">Source and license notices</a>
		</details>
	</section>

	<section class="max-w-7xl w-full border border-stone-900 overflow-hidden mt-8 sm:mt-12 bg-black">
		<div class="w-full border-b border-stone-900 px-4 py-2 flex items-center justify-between text-xs sm:text-sm">
			<span class="font-mono text-stone-500">[ <span class="text-stone-200">05</span> / 05 ]</span>
			<span class="font-mono uppercase text-[11px] text-stone-500 tracking-wider">[ get started ]</span>
		</div>

		<div class="w-full py-8 sm:py-12 px-6 sm:px-10 border-b border-stone-900">
			<h2 class="text-xl sm:text-2xl font-medium text-zinc-100 mb-2">Get Started in Minutes</h2>
			<p class="text-xs sm:text-sm text-zinc-400">Simple, intuitive API that gets you from zero to production-ready memory in just a few lines of code</p>
		</div>

		<div class="w-full grid grid-cols-1 lg:grid-cols-3 gap-px bg-stone-900">
			<div class="bg-black p-6 sm:p-8 flex flex-col justify-between">
				<div>
					<div class="flex items-start justify-between font-mono text-xs text-zinc-500 mb-4">
						{@html icons.get("textFile", "size-6 text-zinc-400")}
						<span>[ 01 ]</span>
					</div>
					<h3 class="text-lg font-medium text-zinc-100 mb-2">Conversational AI</h3>
					<p class="text-xs sm:text-sm text-zinc-400 leading-relaxed">Equip chat products with persistent preferences, tone awareness, and long-tail recollection so they sound brilliantly personal.</p>
				</div>
			</div>

			<div class="bg-black lg:col-span-2 flex flex-col order-3 md:order-2 row-span-2">
				<div class="w-full border-b border-stone-900 px-4 py-2 flex items-center justify-between text-xs font-mono">
					<div class="flex items-center gap-2 text-stone-400">
						{@html icons.get("code", "size-4")}
						<span>GetStarted.js</span>
					</div>
					<div class="flex items-center gap-2">
						<Dropdown options={["JavaScript"]} selected="JavaScript" />
						<button class="p-1.5 hover:bg-stone-900 hover:text-zinc-200 rounded text-zinc-400 transition-colors">
							{@html icons.get("clipboard", "size-4")}
						</button>
					</div>
				</div>

				<div class="max-h-[460px] w-full overflow-x-auto text-xs font-mono p-4 space-y-1 bg-black">
					<div class="flex items-center text-zinc-500 whitespace-nowrap">
						<span class="w-8 select-none shrink-0 text-zinc-600">01</span>
						<span>// Ingest a memory through the REST API</span>
					</div>
					<div class="flex items-center text-zinc-400 whitespace-nowrap">
						<span class="w-8 select-none shrink-0 text-zinc-600">02</span>
						<span class="text-rose-400 mr-1.5">await</span>
						<span class="text-amber-400 mr-1">fetch</span>
						<span>(<span class="text-emerald-400">'http://localhost:3000/v1/ingest'</span>, &#123;</span>
					</div>
					<div class="flex items-center text-zinc-400 whitespace-nowrap">
						<span class="w-8 select-none shrink-0 text-zinc-600">03</span>
						<span class="ml-4 text-zinc-300 mr-1.5">method:</span>
						<span class="text-emerald-400">'POST'</span>,
					</div>
					<div class="flex items-center text-zinc-400 whitespace-nowrap">
						<span class="w-8 select-none shrink-0 text-zinc-600">04</span>
						<span class="ml-4 text-zinc-300 mr-1.5">headers:</span>
						<span>&#123; <span class="text-emerald-400">'Content-Type'</span>: <span class="text-emerald-400">'application/json'</span> &#125;,</span>
					</div>
					<div class="flex items-center text-zinc-400 whitespace-nowrap">
						<span class="w-8 select-none shrink-0 text-zinc-600">05</span>
						<span class="ml-4 text-zinc-300 mr-1.5">body:</span>
						<span class="text-amber-400">JSON</span>.<span class="text-amber-400">stringify</span>(&#123;
					</div>
					<div class="flex items-center text-zinc-400 whitespace-nowrap">
						<span class="w-8 select-none shrink-0 text-zinc-600">06</span>
						<span class="ml-8 text-zinc-300 mr-1.5">user_id:</span>
						<span class="text-emerald-400">'alice'</span>,
					</div>
					<div class="flex items-center text-zinc-400 whitespace-nowrap">
						<span class="w-8 select-none shrink-0 text-zinc-600">07</span>
						<span class="ml-8 text-zinc-300 mr-1.5">text:</span>
						<span class="text-emerald-400">'I prefer TypeScript for backend services'</span>
					</div>
					<div class="flex items-center text-zinc-400 whitespace-nowrap">
						<span class="w-8 select-none shrink-0 text-zinc-600">08</span>
						<span class="ml-4">&#125;)</span>
					</div>
					<div class="flex items-center text-zinc-400 whitespace-nowrap">
						<span class="w-8 select-none shrink-0 text-zinc-600">09</span>
						<span>&#125;);</span>
					</div>
					<div class="flex items-center text-zinc-500 whitespace-nowrap pt-2">
						<span class="w-8 select-none shrink-0 text-zinc-600">10</span>
						<span>// Recall with an explicit mode</span>
					</div>
					<div class="flex items-center text-zinc-400 whitespace-nowrap">
						<span class="w-8 select-none shrink-0 text-zinc-600">11</span>
						<span class="text-rose-400 mr-1.5">const</span>
						<span class="text-zinc-300 mr-1.5">response</span>=
						<span class="text-rose-400 mx-1.5">await</span>
						<span class="text-amber-400 mr-1">fetch</span>
						<span>(<span class="text-emerald-400">'http://localhost:3000/v1/recall'</span>, &#123;</span>
					</div>
					<div class="flex items-center text-zinc-400 whitespace-nowrap">
						<span class="w-8 select-none shrink-0 text-zinc-600">12</span>
						<span class="ml-4 text-zinc-300 mr-1.5">method:</span>
						<span class="text-emerald-400">'POST'</span>,
					</div>
					<div class="flex items-center text-zinc-400 whitespace-nowrap">
						<span class="w-8 select-none shrink-0 text-zinc-600">13</span>
						<span class="ml-4 text-zinc-300 mr-1.5">body:</span>
						<span class="text-amber-400">JSON</span>.<span class="text-amber-400">stringify</span>(&#123;
					</div>
					<div class="flex items-center text-zinc-400 whitespace-nowrap">
						<span class="w-8 select-none shrink-0 text-zinc-600">14</span>
						<span class="ml-8 text-zinc-300 mr-1.5">text:</span>
						<span class="text-emerald-400">'What language does Alice prefer?'</span>,
					</div>
					<div class="flex items-center text-zinc-400 whitespace-nowrap">
						<span class="w-8 select-none shrink-0 text-zinc-600">15</span>
						<span class="ml-8 text-zinc-300 mr-1.5">mode:</span>
						<span class="text-emerald-400">'strict'</span>
					</div>
					<div class="flex items-center text-zinc-400 whitespace-nowrap">
						<span class="w-8 select-none shrink-0 text-zinc-600">16</span>
						<span class="ml-4">&#125;)</span>
					</div>
					<div class="flex items-center text-zinc-400 whitespace-nowrap">
						<span class="w-8 select-none shrink-0 text-zinc-600">17</span>
						<span>&#125;);</span>
					</div>
					<div class="flex items-center text-zinc-400 whitespace-nowrap">
						<span class="w-8 select-none shrink-0 text-zinc-600">18</span>
						<span class="text-rose-400 mr-1.5">const</span>
						<span>&#123; <span class="text-zinc-300">results</span> &#125; =</span>
						<span class="text-rose-400 mx-1.5">await</span>
						<span class="text-zinc-300">response</span>.<span class="text-amber-400">json</span>();
					</div>
				</div>
			</div>

			<div class="bg-black p-6 sm:p-8 flex flex-col justify-between order-2 md:order-3">
				<div>
					<div class="flex items-start justify-between font-mono text-xs text-zinc-500 mb-4">
						{@html icons.get("users", "size-6 text-zinc-400")}
						<span>[ 02 ]</span>
					</div>
					<h3 class="text-lg font-medium text-zinc-100 mb-2">Personal assistants</h3>
					<p class="text-xs sm:text-sm text-zinc-400 leading-relaxed">Launch companion agents that accumulate rituals, goals, and collaborative context while staying effortlessly organized.</p>
				</div>
			</div>
		</div>
	</section>

	<footer class="max-w-7xl w-full flex flex-col justify-between relative overflow-hidden mt-16 sm:mt-24 pb-8">
		<div class="w-full grid grid-cols-1 sm:grid-cols-3 gap-8">
			<div class="sm:col-span-2 px-2 md:px-0">
				<h3 class="text-xl sm:text-2xl font-medium text-zinc-100">Longmemory</h3>
				<p class="text-xs sm:text-sm text-zinc-400 mt-2">An open-source project licensed under the Apache License 2.0.</p>
				<p class="text-xs sm:text-sm text-zinc-500 mt-1">&copy; 2026 Longmemory, CaviraOSS, and contributors.</p>
			</div>

			<div class="flex flex-col sm:items-end">
				<span class="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3 hidden md:block">Resources</span>
				<nav class="flex md:flex-col justify-between md:items-end gap-2 text-xs sm:text-sm px-2 md:px-0">
					<a href="./longmemory/docs" class="text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors">
						<span>Docs</span>
						{@html icons.get("chevronRight", "size-3.5 text-zinc-500")}
					</a>
					<a href="https://github.com/CaviraOSS/Longmemory" target="_blank" rel="noopener noreferrer" class="text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors">
						<span>GitHub</span>
						{@html icons.get("arrowTop", "size-3.5 rotate-45 text-zinc-500")}
					</a>
					<a href="https://cavira.app/discord" target="_blank" rel="noopener noreferrer" class="text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors">
						<span>Discord</span>
						{@html icons.get("arrowTop", "size-3.5 rotate-45 text-zinc-500")}
					</a>
				</nav>
			</div>
		</div>

		<div class="w-full mt-12 sm:mt-20">
			{@html icons.get("Longmemory", "w-full h-auto opacity-20")}
		</div>
	</footer>
</div>
