<script context="module">
	import ImgComp from '$lib/mdsvex/components/Image.svelte';
	import VideoComp from '$lib/mdsvex/components/Video.svelte';
	// Replace default elements with styled components
	export { ImgComp as img, VideoComp as video };
</script>

<script lang="ts">
	export let title: string = '';
	export let description: string = '';
	export let date: string = '';
	export let author: string = '';
	export let cover: string = '';
	export let tags: string[] = [];
	export let authorUrl: string = '';
	export let authorAvatar: string = '';
	export let authorDisplay: string = '';
	export let authorBio: string = '';

	const getFormattedDate = (value: string): string => {
		if (!value) return '';
		const d = new Date(value);
		if (isNaN(d.getTime())) return value;
		try {
			return new Intl.DateTimeFormat(undefined, {
				year: 'numeric',
				month: 'short',
				day: '2-digit'
			}).format(d);
		} catch {
			return value;
		}
	};

	$: formattedDate = getFormattedDate(date);

	let hasMeta: boolean = Boolean(
		title || description || date || author || cover || (tags && tags.length > 0)
	);
</script>

<svelte:head>
	{#if title}
		<title>{title} | Lemonade</title>
	{/if}
	{#if description}
		<meta name="description" content={description} />
		<meta property="og:title" content={title} />
		<meta property="og:description" content={description} />
		<meta property="og:image" content={cover} />
		<meta property="og:type" content="article" />
		<meta property="og:site_name" content="Lemonade" />
	{/if}
</svelte:head>

<div class="relative mx-auto w-full max-w-4xl px-4 py-8">
	<div
		class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.08),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(251,191,36,0.06),transparent_60%)]"
	></div>
	{#if hasMeta}
		<header class="mb-8">
			{#if cover}
				<img
					src={cover}
					alt={title}
					class="mb-6 h-64 w-full rounded-xl object-cover shadow-lg ring-1 ring-amber-300/20"
				/>
			{/if}
			{#if title}
				<h1
					class="bg-gradient-to-r from-yellow-300 to-amber-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl"
				>
					{title}
				</h1>
			{/if}
			{#if description}
				<p class="mt-3 text-base text-gray-300">{description}</p>
			{/if}
			{#if author || authorUrl || authorAvatar || authorDisplay}
				<div
					class="mt-5 flex flex-col gap-3 rounded-xl border border-amber-400/20 bg-zinc-900/60 p-3 md:flex-row md:items-center md:justify-between md:gap-4"
				>
					<a
						href={authorUrl || '#'}
						target={authorUrl ? '_blank' : undefined}
						rel={authorUrl ? 'noopener' : undefined}
						class="flex min-w-0 shrink-0 items-center gap-3"
					>
						{#if authorAvatar}
							<img
								src={authorAvatar}
								alt={author || 'author'}
								width={48}
								height={48}
								class="h-12 w-12 rounded-full ring-1 ring-amber-400/30"
							/>
						{/if}
						<div class="flex min-w-0 flex-col">
							{#if authorDisplay}
								<span class="truncate whitespace-nowrap text-amber-200">{authorDisplay}</span>
							{/if}
							{#if author}
								<span class="truncate text-sm whitespace-nowrap text-gray-400">{author}</span>
							{/if}
						</div>
					</a>
					{#if authorBio}
						<p class="min-w-0 text-sm leading-6 text-gray-300 md:max-w-[70ch] md:flex-1">
							{authorBio}
						</p>
					{/if}
					{#if authorUrl}
						<a
							href={authorUrl}
							target="_blank"
							rel="noopener"
							class="group inline-flex shrink-0 items-center gap-2 rounded-lg border border-violet-400/30 bg-violet-600/20 px-3 py-2 text-sm font-medium text-violet-200 ring-1 ring-violet-300/10 transition-colors ring-inset hover:bg-violet-600/30 hover:text-white"
							aria-label="Watch live on Twitch"
						>
							<span class="relative inline-flex h-2.5 w-2.5 items-center justify-center">
								<span
									class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/60"
								></span>
								<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
							</span>
							<span>Live</span>
						</a>
					{/if}
				</div>
			{/if}
			{#if date || (tags && tags.length)}
				<div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-400">
					{#if formattedDate}
						<span
							class="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-zinc-900 px-3 py-1"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								class="h-4 w-4 text-amber-300"
								><path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-12.75a.75.75 0 00-1.5 0v4.19l-2.22 2.22a.75.75 0 001.06 1.06l2.66-2.66a.75.75 0 00.22-.53V5.25z"
									clip-rule="evenodd"
								/></svg
							>
							<time datetime={date}>{formattedDate}</time>
						</span>
					{/if}
					{#each tags as tag}
						<span class="rounded-full border border-amber-400/20 bg-zinc-900 px-3 py-1">#{tag}</span
						>
					{/each}
				</div>
			{/if}
		</header>
	{/if}

	<article>
		<div
			class="rounded-2xl border border-amber-400/10 bg-gradient-to-b from-zinc-900/45 to-zinc-950/45 p-6 shadow-xl shadow-black/30 backdrop-blur-lg"
		>
			<div class="article-content">
				<slot />
			</div>
		</div>
	</article>
</div>

<style>
	:global(.article-content h1) {
		margin-top: 1.5rem;
		font-size: 1.875rem;
		line-height: 2.25rem;
		font-weight: 700;
		color: #fff;
	}

	:global(.article-content h2) {
		margin-top: 2.5rem;
		font-size: 1.5rem;
		line-height: 2rem;
		font-weight: 600;
		color: #fff;
		position: relative;
	}

	:global(.article-content h2)::after {
		content: '';
		display: block;
		margin-top: 0.5rem;
		height: 1px;
		background: linear-gradient(
			90deg,
			rgba(245, 158, 11, 0.4),
			rgba(245, 158, 11, 0.1),
			transparent
		);
	}

	:global(.article-content h3) {
		margin-top: 2rem;
		font-size: 1.25rem;
		line-height: 1.75rem;
		font-weight: 600;
		color: rgb(254 240 138);
	}

	:global(.article-content p) {
		margin-top: 1rem;
		color: rgb(229 231 235);
		line-height: 1.75;
	}

	:global(.article-content a) {
		color: rgb(252 211 77);
		text-decoration: underline;
		text-decoration-color: rgba(245, 158, 11, 0.4);
		text-underline-offset: 4px;
	}

	:global(.article-content ul),
	:global(.article-content ol) {
		margin-top: 1rem;
		padding-left: 1.5rem;
	}

	:global(.article-content ul > li),
	:global(.article-content ol > li) {
		margin-top: 0.5rem;
		color: rgb(229 231 235);
	}

	/* Enhanced unordered list bullets */
	:global(.article-content ul) {
		list-style: none;
	}

	:global(.article-content ul > li) {
		position: relative;
		padding-left: 0; /* keep indent from UL; bullet positions via ::before */
	}

	:global(.article-content ul > li)::before {
		content: '';
		position: absolute;
		left: -1rem;
		top: 0.8em;
		width: 0.35rem;
		height: 0.35rem;
		border-radius: 9999px;
		background: rgba(245, 158, 11, 0.85);
		box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.25);
	}

	/* Enhanced ordered list numbering */
	:global(.article-content ol) {
		list-style: none;
		counter-reset: list-counter;
	}

	:global(.article-content ol > li) {
		position: relative;
		padding-left: 0; /* keep indent from OL; number positions via ::before */
	}

	:global(.article-content ol > li)::before {
		counter-increment: list-counter;
		content: counter(list-counter) '.';
		position: absolute;
		left: -1.25rem;
		top: 0;
		font-weight: 600;
		color: rgb(254 240 138);
	}

	/* Nested list spacing */
	:global(.article-content li > ul),
	:global(.article-content li > ol) {
		margin-top: 0.5rem;
	}

	:global(.article-content blockquote) {
		margin-top: 1.5rem;
		border-left: 4px solid rgba(245, 158, 11, 0.4);
		background: rgba(24, 24, 27, 0.6);
		padding: 0.75rem 1rem;
		color: rgb(255 251 235);
		border-radius: 0.5rem;
	}

	:global(.article-content code) {
		background: rgba(24, 24, 27, 0.8);
		border-radius: 0.375rem;
		padding: 0.125rem 0.375rem;
		color: rgb(253 230 138);
	}

	:global(.article-content pre) {
		margin-top: 1rem;
		background: rgb(9 9 11);
		border: 1px solid rgba(245, 158, 11, 0.1);
		padding: 1rem;
		border-radius: 0.75rem;
		box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.4);
		color: rgb(255 251 235);
		overflow-x: auto;
	}

	:global(.article-content hr) {
		margin: 2rem 0;
		height: 1px;
		border: 0;
		background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.3), transparent);
	}

	:global(.article-content img) {
		display: block;
		margin: 1.5rem 0;
		width: 100%;
		border-radius: 0.75rem;
		border: 1px solid rgba(245, 158, 11, 0.2);
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
		object-fit: contain;
	}

	:global(.article-content table) {
		margin-top: 1.5rem;
		width: 100%;
		border-collapse: collapse;
		border-radius: 0.75rem;
		overflow: hidden;
		border: 1px solid rgba(245, 158, 11, 0.1);
	}

	:global(.article-content thead) {
		background: rgba(24, 24, 27, 0.7);
		color: rgb(254 240 138);
	}

	:global(.article-content tbody tr:hover) {
		background: rgba(24, 24, 27, 0.4);
	}

	:global(.article-content th),
	:global(.article-content td) {
		padding: 0.75rem 1rem;
		text-align: left;
		color: rgb(229 231 235);
		border-bottom: 1px solid rgba(245, 158, 11, 0.1);
	}
</style>
