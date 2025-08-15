<script>
	import { onMount } from 'svelte';

	let visible = false;

	onMount(() => {
		visible = true;
	});
</script>

<svelte:head>
	<title>Lemonade – Strinova Utility Lineup Platform</title>
	<meta
		name="description"
		content="Strinova utility lineups, callouts, strats, techniques sharing platform."
	/>
</svelte:head>

<div class="background-pattern"></div>

<main
	class="relative z-10 flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center"
>
	<div class="max-w-2xl space-y-6">
		<img
			class="hero-image mx-auto h-32 w-32 rounded-full transition-all duration-300 hover:scale-105"
			src="/lemonade.png"
			alt="Lemonade"
			width={96}
			height={96}
		/>

		<h1
			class="text-shadow bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-5xl font-bold tracking-tight text-transparent transition-all duration-700 {visible
				? 'translate-y-0 opacity-100'
				: '-translate-y-4 opacity-0'}"
		>
			Welcome to Lemonade
		</h1>
		<h2
			class="mb-8 text-xl text-gray-300 transition-all delay-100 duration-700 {visible
				? 'translate-y-0 opacity-100'
				: '-translate-y-4 opacity-0'}"
		>
			Strinova Utility Lineup
		</h2>

		<nav
			class="mt-8 flex flex-col justify-center gap-4 transition-all delay-200 duration-700 sm:flex-row {visible
				? 'translate-y-0 opacity-100'
				: '-translate-y-4 opacity-0'}"
		>
			<a
				href="/walls"
				class="flex items-center gap-2 rounded-lg border border-amber-700/50 bg-amber-600/20 px-6 py-3 text-amber-300 backdrop-blur-sm transition-all hover:scale-105 hover:bg-amber-500/30"
			>
				<img src="/icons/reiichi_skill_1.webp" alt="Reiichi" class="h-5 w-5 object-contain" />
				Reiichi Walls
			</a>
			<a
				href="/interceptors"
				class="flex items-center gap-2 rounded-lg border border-amber-700/50 bg-amber-600/20 px-6 py-3 text-amber-300 backdrop-blur-sm transition-all hover:scale-105 hover:bg-amber-500/30"
			>
				<img src="/icons/interceptor.png" alt="Interceptor" class="h-5 w-5" />
				Interceptors
			</a>
		</nav>

		<h2 class="text-xl text-gray-300">Strinova Databases</h2>

		<nav
			class="mt-8 flex justify-center gap-4 transition-all delay-200 duration-700 sm:flex-row {visible
				? 'translate-y-0 opacity-100'
				: '-translate-y-4 opacity-0'}"
		>
			<!-- Callouts -->
			<a
				href="/callouts"
				class="flex items-center gap-2 rounded-lg border border-amber-700/50 bg-amber-600/20 px-6 py-3 text-amber-300 backdrop-blur-sm transition-all hover:scale-105 hover:bg-amber-500/30"
			>
				🎯 Callouts
			</a>

			<!-- VODs -->
			<a
				href="/vods"
				class="flex items-center gap-2 rounded-lg border border-amber-700/50 bg-amber-600/20 px-6 py-3 text-amber-300 backdrop-blur-sm transition-all hover:scale-105 hover:bg-amber-500/30"
			>
				🎦 VODs
			</a>
		</nav>

		<h2 class="text-xl text-gray-300">Strinova Tutorials</h2>

		<nav
			class="mt-8 flex justify-center gap-4 transition-all delay-200 duration-700 sm:flex-row {visible
				? 'translate-y-0 opacity-100'
				: '-translate-y-4 opacity-0'}"
		>
			<a
				href="/tutorials/kankeri"
				class="flex items-center gap-2 rounded-lg border border-amber-700/50 bg-amber-600/20 px-6 py-3 text-amber-300 backdrop-blur-sm transition-all hover:scale-105 hover:bg-amber-500/30"
			>
				📘 Kankeri Tutorials
			</a>
		</nav>
	</div>
</main>

<style>
	:global(body) {
		background-image:
			radial-gradient(circle at center, #1a1a1ad5, #000000d5), url('/maps/ocarnus.png');
		background-attachment: fixed;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
	}

	:global(body::before) {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(10px);
		z-index: -1;
	}

	.background-pattern {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-image:
			linear-gradient(rgba(255, 204, 0, 0.03) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 204, 0, 0.03) 1px, transparent 1px);
		background-size: 40px 40px;
		z-index: 1;
		pointer-events: none;
	}

	@keyframes float {
		0% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-10px);
		}
		100% {
			transform: translateY(0px);
		}
	}

	h1 {
		animation: float 6s ease-in-out infinite;
	}

	.hero-image {
		animation: float 6s ease-in-out infinite;
	}
</style>
