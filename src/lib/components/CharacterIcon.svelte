<script lang="ts">
	import type { Character } from '$lib/data/game';
	import { m } from '$lib/paraglide/messages.js';

	import MicheleProfile from '$lib/assets/characters/Michele_Profile.png';
	import NobunagaProfile from '$lib/assets/characters/Nobunaga_Profile.png';
	import KokonaProfile from '$lib/assets/characters/Kokona_Profile.png';
	import YvetteProfile from '$lib/assets/characters/Yvette_Profile.png';
	import FlaviaProfile from '$lib/assets/characters/Flavia_Profile.png';
	import YugiriProfile from '$lib/assets/characters/Yugiri_Profile.png';
	import LeonaProfile from '$lib/assets/characters/Leona_Profile.png';
	import ReiichiProfile from '$lib/assets/characters/Reiichi_Profile.png';
	import LawineProfile from '$lib/assets/characters/Lawine_Profile.png';
	import MingProfile from '$lib/assets/characters/Ming_Profile.png';
	import MeredithProfile from '$lib/assets/characters/Meredith_Profile.png';
	import EikaProfile from '$lib/assets/characters/Eika_Profile.png';
	import KanamiProfile from '$lib/assets/characters/Kanami_Profile.png';
	import FragransProfile from '$lib/assets/characters/Fragrans_Profile.png';
	import MaraProfile from '$lib/assets/characters/Mara_Profile.png';
	import AudreyProfile from '$lib/assets/characters/Audrey_Profile.png';
	import MaddelenaProfile from '$lib/assets/characters/Maddelena_Profile.png';
	import BaiMoProfile from '$lib/assets/characters/Bai_Mo_Profile.png';
	import FuchsiaProfile from '$lib/assets/characters/Fuchsia_Profile.png';
	import GalateaProfile from '$lib/assets/characters/Galatea_Profile.png';
	import ChiyoProfile from '$lib/assets/characters/Chiyo_Profile.png';
	import CelestiaProfile from '$lib/assets/characters/Celestia_Profile.png';

	const CHARACTER_2_IMAGE: Record<Character, string> = {
		Michele: MicheleProfile,
		Nobunaga: NobunagaProfile,
		Kokona: KokonaProfile,
		Yvette: YvetteProfile,
		Flavia: FlaviaProfile,
		Yugiri: YugiriProfile,
		Leona: LeonaProfile,
		Reiichi: ReiichiProfile,
		Lawine: LawineProfile,
		Ming: MingProfile,
		Meredith: MeredithProfile,
		Eika: EikaProfile,
		Kanami: KanamiProfile,
		Fragrans: FragransProfile,
		Mara: MaraProfile,
		Audrey: AudreyProfile,
		Celestia: CelestiaProfile,
		Maddelena: MaddelenaProfile,
		'Bai Mo': BaiMoProfile,
		Fuchsia: FuchsiaProfile,
		Galatea: GalateaProfile,
		Chiyo: ChiyoProfile
	};
	let { character, class: className = '' }: { character: Character | null; class?: string } =
		$props();
</script>

{#if character}
	<img
		class={[
			className.includes('h-') ? undefined : 'h-9',
			className.includes('w-') ? undefined : 'w-9',
			className.includes('rounded-full') ? undefined : 'rounded-full',
			className
		]}
		src={CHARACTER_2_IMAGE[character]}
		alt={character}
		title={character}
	/>
	<!-- TODO: Translate character name -->
{:else}
	<div
		class={[
			'flex h-9 w-9 items-center justify-center rounded-full bg-gray-600 text-gray-400',
			className
		]}
	>
		?
	</div>
{/if}
