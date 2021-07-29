<script>
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	import { page } from '$app/stores';
	import Logo from '$lib/Logo.svelte';
	import MenuButton from './MenuButton.svelte';
	import ThemePicker from './ThemePicker.svelte';

	let isOpen = false;

	let htmlElement;

	const closeMenu = () => (isOpen = false);

	onMount(() => {
		htmlElement = document.documentElement;
	});

	$: {
		if (htmlElement) {
			if (isOpen) {
				htmlElement?.classList?.add('no-scroll');
			} else {
				htmlElement?.classList?.remove('no-scroll');
			}
		}
	}
</script>

<header
	class="h-80 sm:h-100 flex items-center px-30 sm:px-48 fixed top-0 left-0 right-0 bg-white bg-opacity-90 dark:bg-rich-purple-900 dark:bg-opacity-90 backdrop-blur-lg z-10"
>
	<nav class="contained w-full xl:px-48 flex items-center justify-between">
		<div class="flex items-center gap-30 text-16 w-full">
			<MenuButton on:click={() => (isOpen = !isOpen)} isMenuOpen={isOpen} extraClass="z-30" />

				<a sveltekit:prefetch class="visible logo mr-auto sm:mr-0 z-20 sm:z-auto" href="/" aria-label="Go to homepage"><Logo color /></a>

			{#if isOpen}
				<div
					class="w-screen h-screen bg-white dark:bg-rich-purple-900 bg-opacity-95 dark:bg-opacity-95 fixed inset-0 z-10 sm:hidden"
					on:click={closeMenu}
					transition:fade
				/>
			{/if}

			<div
				class:open={isOpen}
				class="fixed top-80 left-0 w-full max-w-xs sm:static flex flex-col sm:flex-row gap-30 bg-rich-purple-500 dark:bg-rich-purple-300 sm:bg-transparent sm:dark:bg-transparent p-30 sm:p-0 sm:w-max transition transform-gpu -translate-x-full sm:translate-x-0 rounded-br-xl sm:rounded-br-none rounded-tr-xl sm:rounded-tr-none shadow-2xl sm:shadow-none z-20 sm:z-auto"
			>
					<a class:active={$page.path === '/#about'} on:click={closeMenu} sveltekit:prefetch href="/#about">About me</a>

				{#if $page.path === '/'}
						<a class:active={$page.path === '/#work'} on:click={closeMenu} sveltekit:prefetch href="#work">Work</a>
				{:else}
						<a class:active={$page.path.startsWith('/work')} on:click={closeMenu} sveltekit:prefetch href="/work">Work</a>
				{/if}

				<a on:click={closeMenu} sveltekit:prefetch href="/#contact">Contact</a>
				<a on:click={closeMenu} rel="external" sveltekit:prefetch href="/Goran-Alkovic-CV.pdf">CV</a>
			</div>

			<ThemePicker extraClass="sm:ml-auto z-20 sm:z-auto" />
		</div>
	</nav>
</header>

<style lang="postcss">
	.open {
		@apply translate-x-0;
	}

	nav ul li:not(.logo) {
		@apply text-white sm:text-black sm:dark:text-white sm:hover:text-rich-purple-500 sm:dark:hover:text-rich-purple-300 transition-colors text-18 sm:text-16;
	}

	nav ul li:not(.logo) a {
		@apply block;
	}

	nav ul li.active {
		@apply pointer-events-none select-none sm:text-rich-purple-500 sm:dark:text-rich-purple-300 font-bold;
	}

</style>
