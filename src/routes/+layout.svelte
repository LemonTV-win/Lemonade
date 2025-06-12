<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<header class="p-4">
	<p class="flex items-center gap-2 text-lg font-medium">
		<img src="/favicon-96x96.png" alt="Lemonade" width={24} height={24} />
		<span>Lemonade</span>
	</p>
</header>

{@render children()}

<footer class="mt-auto p-4">
	<p class="flex items-center gap-4 text-sm text-gray-400">
		<span
			>© {new Date().getFullYear()}
			<a href="https://lemontv.win" class="transition-colors hover:text-gray-100">LemonTV</a></span
		>

		<a href="https://github.com/mkpoli/LemonJuice" class="transition-colors hover:text-gray-100"
			>GitHub</a
		>

		<a href="https://discord.gg/mY8DMatXM4" class="transition-colors hover:text-gray-100">Discord</a
		>
	</p>
</footer>
