<script lang="ts">
	import '../../app.css';

	let { children } = $props();
</script>

<div class="mx-auto flex min-h-full flex-col">
	<header class="mx-auto p-4">
		<p class="flex items-center gap-2 text-lg font-medium">
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
		</p>
	</header>

	{@render children()}

	<footer class="mx-auto mt-auto p-4">
		<p class="flex items-center gap-4 text-sm text-gray-400">
			<span
				>© {new Date().getFullYear()}
				<a href="https://lemontv.win" class="transition-colors hover:text-gray-100">LemonTV</a
				></span
			>

			<a href="https://github.com/mkpoli/LemonJuice" class="transition-colors hover:text-gray-100"
				>GitHub</a
			>

			<a href="https://discord.gg/mY8DMatXM4" class="transition-colors hover:text-gray-100"
				>Discord</a
			>
		</p>
	</footer>
</div>
