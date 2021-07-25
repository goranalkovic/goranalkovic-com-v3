<script>
	import { page } from '$app/stores';
	import Logo from '$lib/Logo.svelte';
</script>

<header class="fixed top-0 py-30 bg-white dark:bg-rich-purple-900 bg-opacity-90 dark:bg-opacity-95 backdrop-blur-lg z-10 w-full">
	<nav>
		<ul class="flex items-center gap-30 text-18">
			<li class="visible"><a sveltekit:prefetch href="/" aria-label="Go to homepage"><Logo color /></a></li>
			<li class:visible={$page.path !== '/'}><a sveltekit:prefetch href="/">Back</a></li>
			<li class:visible={$page.path === '/'}><a sveltekit:prefetch href="#about">About me</a></li>
			<li class:visible={$page.path === '/'}><a sveltekit:prefetch href="#work">Work</a></li>
			<li class:visible={$page.path === '/'}><a sveltekit:prefetch href="#contact">Contact</a></li>
		</ul>
	</nav>
</header>

<style>
	li:not(.visible) {
		@apply hidden;
	}
</style>