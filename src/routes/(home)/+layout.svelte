<script lang="ts">
	import '../../app.css';

	let { children } = $props();
</script>

<div class="flex min-h-dvh flex-col">
	<header
		class="sticky top-0 z-20 border-b border-gray-800/50 bg-black/70 px-6 py-6 backdrop-blur-md sm:px-4"
	>
		<div class="flex items-center justify-between">
			<a href="/" class="group flex items-center gap-3">
				<img
					src="/favicon-96x96.png"
					alt="Lemonade"
					width={32}
					height={32}
					class="transition-transform duration-300 group-hover:rotate-12"
				/>
				<span
					class="bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-xl font-semibold text-transparent"
				>
					Lemonade
				</span>
			</a>

			<nav class="hidden items-center gap-6 sm:flex">
				<a href="/walls" class="text-gray-300 transition-colors hover:text-amber-300">Walls</a>
				<a href="/interceptors" class="text-gray-300 transition-colors hover:text-amber-300"
					>Interceptors</a
				>
			</nav>
		</div>
	</header>

	<main class="flex-grow py-8">
		{@render children()}
	</main>

	<footer
		class="mt-auto border-t border-gray-800/50 bg-black/70 px-6 py-6 backdrop-blur-md sm:px-4"
	>
		<div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
			<p class="text-sm text-gray-400">
				© {new Date().getFullYear()}
				<a
					href="https://lemontv.win"
					class="text-amber-300/80 transition-colors hover:text-amber-300"
				>
					LemonTV
				</a>
			</p>

			<div class="flex items-center gap-6">
				<a href="/about" class="text-sm text-gray-400 transition-colors hover:text-amber-300">
					About
				</a>
				<a
					href="https://github.com/mkpoli/LemonJuice"
					class="text-sm text-gray-400 transition-colors hover:text-amber-300"
				>
					GitHub
				</a>
				<a
					href="https://discord.gg/mY8DMatXM4"
					class="text-sm text-gray-400 transition-colors hover:text-amber-300"
				>
					Discord
				</a>
			</div>
		</div>
	</footer>
</div>
