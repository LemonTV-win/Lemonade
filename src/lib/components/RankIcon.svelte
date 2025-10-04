<script lang="ts">
	import type { Rank } from '$lib/data/game';
	import Unranked from '$lib/assets/ranks/Unranked.png';
	import Substance from '$lib/assets/ranks/Substance.png';
	import Molecule from '$lib/assets/ranks/Molecule.png';
	import Atom from '$lib/assets/ranks/Atom.png';
	import Proton from '$lib/assets/ranks/Proton.png';
	import Neutron from '$lib/assets/ranks/Neutron.png';
	import Electron from '$lib/assets/ranks/Electron.png';
	import Quark from '$lib/assets/ranks/Quark.png';
	import Superstring from '$lib/assets/ranks/Superstring.png';
	import Singularity from '$lib/assets/ranks/Singularity.png';

	const RANK_IMAGES: Record<string, string> = {
		Unranked: Unranked,
		Substance: Substance,
		Molecule: Molecule,
		Atom: Atom,
		Proton: Proton,
		Neutron: Neutron,
		Electron: Electron,
		Quark: Quark,
		Superstring: Superstring,
		Singularity: Singularity
	};

	function getRankImage(rank: Rank): string {
		return RANK_IMAGES[rank.split(' ')[0]] || RANK_IMAGES['Unranked'];
	}

	let { rank }: { rank: Rank } = $props();
</script>

<img src={getRankImage(rank)} alt={rank} class="h-4 w-4 object-cover" />
