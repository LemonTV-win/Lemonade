<script lang="ts">
	import type { Rank } from '$lib/data/game';

	const RANK_IMAGES: Record<string, string> = {
		Unranked:
			'https://static.wikitide.net/strinovawiki/thumb/b/bb/Rank_Icon_0.png/150px-Rank_Icon_0.png',
		Substance:
			'https://static.wikitide.net/strinovawiki/thumb/5/59/Rank_Icon_1.png/150px-Rank_Icon_1.png',
		Molecule:
			'https://static.wikitide.net/strinovawiki/thumb/8/85/Rank_Icon_2.png/150px-Rank_Icon_2.png',
		Atom: 'https://static.wikitide.net/strinovawiki/thumb/8/89/Rank_Icon_3.png/150px-Rank_Icon_3.png',
		Proton:
			'https://static.wikitide.net/strinovawiki/thumb/9/93/Rank_Icon_4.png/150px-Rank_Icon_4.png',
		Neutron:
			'https://static.wikitide.net/strinovawiki/thumb/d/de/Rank_Icon_5.png/150px-Rank_Icon_5.png',
		Electron:
			'https://static.wikitide.net/strinovawiki/thumb/1/1e/Rank_Icon_6.png/150px-Rank_Icon_6.png',
		Quark:
			'https://static.wikitide.net/strinovawiki/thumb/8/87/Rank_Icon_7.png/150px-Rank_Icon_7.png',
		Superstring:
			'https://static.wikitide.net/strinovawiki/thumb/6/65/Rank_Icon_8.png/150px-Rank_Icon_8.png',
		Singularity:
			'https://static.wikitide.net/strinovawiki/thumb/7/7d/Rank_Icon_9.png/150px-Rank_Icon_9.png'
	};

	function getRankImage(rank: Rank): string {
		return RANK_IMAGES[rank.split(' ')[0]] || RANK_IMAGES['Unranked'];
	}

	let { rank }: { rank: Rank } = $props();
</script>

<img src={getRankImage(rank)} alt={rank} class="h-4 w-4 object-cover" />
