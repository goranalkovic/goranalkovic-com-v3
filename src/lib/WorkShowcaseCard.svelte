<script>
	import { preferences, prefersColorSchemeDark, ThemeMode } from '../stores';

	export let imageFilename;
	export let imageFormat = 'png';
	export let name;
	export let url;
	export let lightColor = 'white';
	export let desktopTextHorAlignEnd = false;
	export let desktopTextVerAlignBottom = false;
	export let extraClass = '';

	const dHor = desktopTextHorAlignEnd ? 'lg:justify-self-end' : 'lg:justify-self-start';
	const dVer = desktopTextVerAlignBottom ? 'lg:self-end' : 'lg:self-start';

	const baseUrl =
		'https://ik.imagekit.io/goranalkovic/personal_web/homepage/projects/tr:n-home_workcard';
	const mobileImageUrl = `${baseUrl}/${imageFilename}-mobile-light.${imageFormat}`;
	const imageUrl = `${baseUrl}/${imageFilename}-light.${imageFormat}`;
	const darkMobileImageUrl = `${baseUrl}/${imageFilename}-mobile-dark.${imageFormat}`;
	const darkImageUrl = `${baseUrl}/${imageFilename}-dark.${imageFormat}`;

	$: shouldBeDark =
		($preferences.theme === ThemeMode.AUTO && $prefersColorSchemeDark) ||
		$preferences.theme === ThemeMode.DARK;
	$: mobileImage = shouldBeDark ? darkMobileImageUrl : mobileImageUrl;
	$: desktopImage = shouldBeDark ? darkImageUrl : imageUrl;
</script>

<a
	href={url}
	class="rounded-xl flex flex-col lg:grid lg:grid-cols-1 lg:grid-rows-1 transform-gpu hover:scale-[1.01] transition {extraClass}"
	style="--work-showcase-text-color: {shouldBeDark ? '#fff' : lightColor};"
>
	<picture class="lg:row-start-1 lg:row-end-1 lg:col-start-1 lg:col-end-1">
		<source srcset={mobileImage} media="(max-width: 1023px)" />
		<img
			class="rounded-xl w-full h-full md:h-300 lg:h-full object-cover"
			src={desktopImage}
			alt={name}
		/>
	</picture>
	<h3
		class="mt-15 lg:mt-0 mb-30 sm:mb-0 text-18 md:text-24 lg:text-40 font-medium lg:font-semibold lg:row-start-1 lg:row-end-1 lg:col-start-1 lg:col-end-1 {dVer} {dHor} lg:p-20 transition-colors"
	>
		{name}
	</h3>
</a>

<style lang="postcss">
	h3 {
		@apply text-current;
	}

	@screen lg {
		h3 {
			color: var(--work-showcase-text-color, currentColor);
		}
	}
</style>
