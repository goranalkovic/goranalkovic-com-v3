<script>
	export let mobileImageUrl;
	export let imageUrl;
	export let darkMobileImageUrl;
	export let darkImageUrl;
	export let name;
	export let url;
	export let lightColor = 'white';
	export let desktopTextHorAlignEnd = false;
	export let desktopTextVerAlignBottom = false;
    export let extraClass = '';

    const dHor = desktopTextHorAlignEnd ? 'sm:justify-self-end' : 'sm:justify-self-start';
    const dVer = desktopTextVerAlignBottom ? 'sm:self-end' : 'sm:self-start';
</script>

<a href={url} class="rounded-xl sm:grid sm:grid-cols-1 sm:grid-rows-1 transform-gpu hover:scale-[1.01] transition hover:shadow-xl dark:hover:shadow-2xl {extraClass}">
	<picture class="sm:row-start-1 sm:row-end-1 sm:col-start-1 sm:col-end-1">
        <source srcset={darkMobileImageUrl} media="(prefers-color-scheme: dark) and (max-width: 639px)" />
		<source srcset={mobileImageUrl} media="(max-width: 639px)" />
		<source srcset={darkImageUrl} media="(prefers-color-scheme: dark) and (min-width: 640px)" />
		<img class="rounded-xl" src={imageUrl} alt={name} />
	</picture>
	<h3
		class="mt-15 sm:mt-0 mb-30 sm:mb-0 text-24 sm:text-48 font-medium sm:font-bold sm:row-start-1 sm:row-end-1 sm:col-start-1 sm:col-end-1 {dVer} {dHor} sm:p-20 sm:text-[{lightColor}] sm:dark:text-white"
	>
		{name}
	</h3>
</a>