<script lang="ts">
	import type { GameMap } from '$lib/data/game';

	import Base404 from '$lib/assets/maps/base_404.jpg';
	import Area88 from '$lib/assets/maps/area_88.jpg';
	import PortEuler from '$lib/assets/maps/port_euler.jpg';
	import WindyTown from '$lib/assets/maps/windy_town.jpg';
	import SpaceLab from '$lib/assets/maps/space_lab.jpg';
	import CauchyDistrict from '$lib/assets/maps/cauchy_district.jpg';
	import Cosmite from '$lib/assets/maps/cosmite.jpg';
	import Ocarnus from '$lib/assets/maps/ocarnus.png';

	const MAP_2_IMAGE: Record<GameMap, string> = {
		base_404: Base404,
		area_88: Area88,
		port_euler: PortEuler,
		windy_town: WindyTown,
		space_lab: SpaceLab,
		cauchy_district: CauchyDistrict,
		cosmite: Cosmite,
		ocarnus: Ocarnus
	};

	const MAP_2_NAME: Record<GameMap, string> = {
		base_404: 'Base 404',
		area_88: 'Area 88',
		port_euler: 'Port Euler',
		windy_town: 'Windy Town',
		space_lab: 'Space Lab',
		cauchy_district: 'Cauchy District',
		cosmite: 'Cosmite',
		ocarnus: 'Orcanus'
	};

	let { map }: { map: GameMap } = $props();
</script>

<img src={MAP_2_IMAGE[map]} alt={MAP_2_NAME[map]} class="h-6 w-10 rounded object-cover" />
