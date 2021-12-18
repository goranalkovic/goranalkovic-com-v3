<script>
	import Logo from '$lib/Logo.svelte';
</script>

<footer
class="border-t border-rich-purple-500 dark:border-rich-purple-300 border-opacity-5 dark:border-opacity-10 p-30 sm:px-60 sm:py-30 w-full"
>
<div class="contained flex items-center justify-between">
    <div class="flex items-center gap-10 text-14 shrink-0 mb-5 font-light">
        <Logo small />
        <span>&copy; 2021</span>
    </div>

    <p class="text-right text-12 text-gray-800 dark:text-gray-300 font-light opacity-95 w-7/12 sm:w-full">
        Made with ❤️ in <a href="https://www.figma.com/">Figma</a>, built using
        <a href="https://kit.svelte.dev">SvelteKit</a> and <a href="https://tailwindcss.com">TailwindCSS</a>, hosted on
        <a href="https://netlify.com">Netlify</a>
    </p>
</div>
</footer>
