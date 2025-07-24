<script>
	import { onMount } from 'svelte';

	let mounted = false;

	onMount(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<title>About - Lemonade</title>
	<meta
		name="description"
		content="Learn more about Lemonade, a comprehensive resource for Strinova players"
	/>
</svelte:head>

<div class="background-pattern"></div>

<div class="relative z-10 min-h-screen">
	<div class="px-8 py-16 text-center">
		<div class="mx-auto max-w-4xl">
			<h1
				class="text-shadow animate-fade-in-up mb-4 bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-5xl font-bold text-transparent opacity-0 md:text-6xl"
				style="animation-delay: 0s; animation-fill-mode: forwards;"
			>
				About Lemonade
			</h1>
			<p
				class="animate-fade-in-up text-xl text-gray-300 opacity-0 md:text-2xl"
				style="animation-delay: 0.2s; animation-fill-mode: forwards;"
			>
				Your ultimate companion for Strinova mastery
			</p>
		</div>
	</div>

	<div class="mx-auto max-w-6xl px-8 py-16">
		<div
			class="animate-fade-in-up mb-12 rounded-2xl border border-amber-700/50 bg-amber-600/20 p-8 opacity-0 backdrop-blur-sm md:p-10"
			style="animation-delay: 0.4s; animation-fill-mode: forwards;"
		>
			<h2 class="mb-6 text-4xl font-semibold text-amber-300">What is Lemonade?</h2>
			<p class="text-lg leading-relaxed text-gray-300">
				Lemonade is a comprehensive collection of useful materials and resources designed
				specifically for Strinova players. Whether you're a beginner looking to learn the basics or
				an experienced player seeking to improve your skills, this platform provides everything you
				need to enhance your gameplay experience.
			</p>
		</div>

		<div class="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
			<div
				class="animate-fade-in-up rounded-2xl border border-amber-700/50 bg-amber-600/20 p-8 text-center opacity-0 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-amber-500/30"
				style="animation-delay: 0.6s; animation-fill-mode: forwards;"
			>
				<div class="mb-4 text-5xl">📚</div>
				<h3 class="mb-4 text-xl font-semibold text-amber-300">Learning Resources</h3>
				<p class="leading-relaxed text-gray-300">
					Access comprehensive guides, tutorials, and educational content to master Strinova
					mechanics.
				</p>
			</div>

			<div
				class="animate-fade-in-up rounded-2xl border border-amber-700/50 bg-amber-600/20 p-8 text-center opacity-0 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-amber-500/30"
				style="animation-delay: 0.8s; animation-fill-mode: forwards;"
			>
				<div class="mb-4 text-5xl">🎯</div>
				<h3 class="mb-4 text-xl font-semibold text-amber-300">Strategy Guides</h3>
				<p class="leading-relaxed text-gray-300">
					Discover advanced strategies, tips, and tricks to improve your gameplay and competitive
					edge.
				</p>
			</div>

			<div
				class="animate-fade-in-up rounded-2xl border border-amber-700/50 bg-amber-600/20 p-8 text-center opacity-0 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-amber-500/30"
				style="animation-delay: 1s; animation-fill-mode: forwards;"
			>
				<div class="mb-4 text-5xl">🔄</div>
				<h3 class="mb-4 text-xl font-semibold text-amber-300">Regular Updates</h3>
				<p class="leading-relaxed text-gray-300">
					Stay current with the latest game updates, meta changes, and community insights.
				</p>
			</div>

			<div
				class="animate-fade-in-up rounded-2xl border border-amber-700/50 bg-amber-600/20 p-8 text-center opacity-0 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-amber-500/30"
				style="animation-delay: 1.2s; animation-fill-mode: forwards;"
			>
				<div class="mb-4 text-5xl">👥</div>
				<h3 class="mb-4 text-xl font-semibold text-amber-300">Community Driven</h3>
				<p class="leading-relaxed text-gray-300">
					Built by players, for players. Share knowledge and contribute to the growing Strinova
					community.
				</p>
			</div>
		</div>

		<div
			class="animate-fade-in-up mb-12 rounded-2xl border border-amber-700/50 bg-amber-600/20 p-8 opacity-0 backdrop-blur-sm md:p-10"
			style="animation-delay: 1.4s; animation-fill-mode: forwards;"
		>
			<h2 class="mb-6 text-4xl font-semibold text-amber-300">Our Mission</h2>
			<p class="text-lg leading-relaxed text-gray-300">
				We believe that every Strinova player deserves access to high-quality resources that can
				help them grow and succeed. Our mission is to create a centralized hub where players can
				find everything they need to improve their skills, stay informed about the game, and connect
				with fellow enthusiasts.
			</p>
		</div>

		<div
			class="animate-fade-in-up mb-12 rounded-2xl border border-amber-700/50 bg-amber-600/20 p-8 opacity-0 backdrop-blur-sm md:p-10"
			style="animation-delay: 1.6s; animation-fill-mode: forwards;"
		>
			<h2 class="mb-8 text-center text-4xl font-semibold text-amber-300">Created with ❤️</h2>
			<div class="flex flex-col items-center gap-8 md:flex-row">
				<div
					class="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-yellow-300 to-amber-500 text-4xl md:h-28 md:w-28 md:text-5xl"
				>
					👨‍💻
				</div>
				<div class="text-center md:text-left">
					<h3 class="mb-2 text-2xl font-semibold text-amber-300">mkpoli</h3>
					<p class="mb-2 text-gray-300">Developer & Strinova Enthusiast</p>
					<p class="leading-relaxed text-gray-300">
						Passionate about creating tools and resources that help the gaming community thrive.
						This project was born from a love for Strinova and a desire to give back to the
						community.
					</p>
				</div>
			</div>
		</div>

		<div
			class="animate-fade-in-up rounded-2xl border border-amber-700/50 bg-amber-600/20 p-8 text-center opacity-0 backdrop-blur-sm md:p-12"
			style="animation-delay: 1.8s; animation-fill-mode: forwards;"
		>
			<h2 class="mb-4 text-4xl font-semibold text-amber-300">
				Ready to improve your Strinova skills?
			</h2>
			<p class="mb-8 text-xl text-gray-300">
				Start exploring our resources and take your gameplay to the next level!
			</p>
			<a
				href="/"
				class="inline-flex items-center gap-2 rounded-lg border border-amber-700/50 bg-amber-600/20 px-8 py-4 text-amber-300 backdrop-blur-sm transition-all hover:scale-105 hover:bg-amber-500/30"
			>
				Get Started
			</a>
		</div>
	</div>
</div>

<style>
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

	@keyframes fade-in-up {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in-up {
		animation: fade-in-up 0.8s ease-out forwards;
	}
</style>
