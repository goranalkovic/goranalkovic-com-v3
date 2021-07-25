<script>
	import Header from '$lib/Header.svelte';
	import Footer from '$lib/Footer.svelte';

	// Styles
	import '../app.postcss';
	import '../global.postcss';
	import '../scrollbar.postcss';
</script>

<Header />

<main class="contained-width grid grid-cols-[1.875rem,1fr,1.875rem] sm:grid-cols-[3rem,1fr,3rem]">
	<slot />
</main>

<Footer />