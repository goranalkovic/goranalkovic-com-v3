<script>
	import Header from '$lib/header/Header.svelte';
	import Logo from '$lib/Logo.svelte';
	import '../app.postcss';
</script>

<Header />

<main>
	<slot />
</main>

<footer class="flex items-center justify-between gap-15">
	<div class="flex items-center gap-5 text-18 flex-shrink-0">
		<Logo small />
		<span>&copy; 2021</span>
	</div>

	<p class="text-right text-12 w-1/2 sm:w-full text-gray-800 dark:text-gray-200 font-light">
		Made with ❤️ in <a href="https://www.figma.com/">Figma</a>, built using <a href="https://kit.svelte.dev">SvelteKit</a>, hosted on <a href="https://netlify.com">Netlify</a>
	</p>
</footer>

<style global>
	body {
		@apply p-30 md:p-48 bg-white dark:bg-rich-purple-900 text-black dark:text-white transition-colors max-w-7xl mx-auto;
	}

	html,
	body {
		scroll-behavior: smooth;
		overflow-x: hidden;
	}

	.purple-text {
		@apply text-rich-purple-500 dark:text-rich-purple-300;
	}


	footer {
		@apply border-t border-rich-purple-500 dark:border-rich-purple-300 border-opacity-5 dark:border-opacity-10 pt-36 -mx-60 px-60;
	}

	footer p a {
		@apply font-medium hover:text-rich-purple-500 dark:hover:text-rich-purple-300;
	}

	::-webkit-scrollbar {
		width: 1rem;
		background-color: transparent;
		border-left: 1px solid rgba(70 62 251 / 0.05);
	}

	::-webkit-scrollbar:hover {
		border-left: 1px solid rgba(70 62 251 / 0.15);
	}

	::-webkit-scrollbar-thumb {
		background-color: rgba(70 62 251 / 0.1);
		border-radius: 100px;

		border: 5px solid transparent;
		background-clip: content-box;
	}

	::-webkit-scrollbar-thumb:hover {
		background-color: rgba(70 62 251 / 0.8);
	}

	::-webkit-scrollbar-track {
		background-color: transparent;
	}

	@media (prefers-color-scheme: dark) {
		::-webkit-scrollbar {
			border-left: 1px solid rgba(122 117 251 / 0.05);
		}

		::-webkit-scrollbar:hover {
			border-left: 1px solid rgba(122 117 251 / 0.15);
		}

		::-webkit-scrollbar-thumb {
			background-color: rgba(122 117 251 / 0.1);
		}

		::-webkit-scrollbar-thumb:hover {
			background-color: rgba(122 117 251 / 0.8);
		}
	}
</style>
