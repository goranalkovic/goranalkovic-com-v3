<script>
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { expoOut } from 'svelte/easing';

	import { page } from '$app/stores';

	import Header from '$lib/Header.svelte';
	import Footer from '$lib/Footer.svelte';

	import { reducedMotion, preferences, prefersColorSchemeDark, ThemeMode } from '../stores';

	let htmlElement;

	onMount(() => {
		htmlElement = document.documentElement;
	});

	$: {
		if (htmlElement) {
			const shouldBeDark = ($preferences.theme === ThemeMode.AUTO && $prefersColorSchemeDark) || $preferences.theme === ThemeMode.DARK;

			if (shouldBeDark) {
				htmlElement?.classList?.add('dark');
			} else {
				htmlElement?.classList?.remove('dark');
			}
		}
	}

	// Styles
	import '../app.postcss';
	import '../fonts.postcss';
	import '../global.postcss';
	import '../scrollbar.postcss';
</script>

<Header />

{#key $page.path}
	<div in:fly={{ y: $reducedMotion ? 50 : 500, duration: $reducedMotion ? 10 : 400, easing: expoOut }}>
		<main class="contained grid grid-cols-[1.875rem,1fr,1.875rem] sm:grid-cols-[3rem,1fr,3rem]">
			<slot />
		</main>
		<Footer />
	</div>
{/key}
