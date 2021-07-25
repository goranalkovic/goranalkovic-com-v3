<script>
	import { page } from '$app/stores';
	import Logo from '$lib/Logo.svelte';
</script>

<header class="h-80 sm:h-100 flex items-center px-30 sm:px-48 fixed top-0 left-0 right-0 bg-white bg-opacity-90 dark:bg-rich-purple-900 dark:bg-opacity-90 backdrop-blur-lg z-10">
	<nav class="contained-width w-full xl:px-48 flex items-center justify-between">
		<ul class="flex items-center gap-30 text-16 w-max">
			<li class="visible"><a sveltekit:prefetch href="/" aria-label="Go to homepage"><Logo color /></a></li>
			<li class:visible={$page.path !== '/'}><a sveltekit:prefetch href="/">Back</a></li>
			<li class:visible={$page.path === '/'}><a sveltekit:prefetch href="#about">About me</a></li>
			<li class:visible={$page.path === '/'}><a sveltekit:prefetch href="#work">Work</a></li>
			<li class:visible={$page.path === '/'}><a sveltekit:prefetch href="#contact">Contact</a></li>
		</ul>
		<button class="flex sm:hidden">Menu</button>
	</nav>
</header>

<style lang="postcss">
	li:not(.visible) {
		@apply hidden;
	}

	li:not(:first-of-type):not(:nth-of-type(2)) {
		@apply hidden sm:block;
	}

	nav ul li:not(:first-of-type) {
		@apply hover:text-rich-purple-500 dark:hover:text-rich-purple-300 transition-colors;
	}
</style>