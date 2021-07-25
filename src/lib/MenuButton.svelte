<script>
	export let isMenuOpen = false;
    export let extraClass = '';
</script>

<button
	class:is-open={isMenuOpen}
	class="sm:hidden mr-auto w-40 h-40 flex items-center justify-center transform transition hover:scale-110 hover:bg-rich-purple-500 hover:bg-opacity-10 dark:hover:bg-rich-purple-300 dark:hover:bg-opacity-30 rounded-md dark:active:bg-opacity-50 active:bg-opacity-20 {extraClass}"
	on:click
>
	<svg
		class="icon-hamburger w-30 h-30"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<line
			x1="2.75"
			y1="12"
			x2="21.25"
			y2="12"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			id="top"
		/>
		<line
			x1="2.75"
			y1="12"
			x2="21.25"
			y2="12"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			id="mid"
		/>
		<line
			x1="2.75"
			y1="12"
			x2="21.25"
			y2="12"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			id="btm"
		/>
	</svg>
</button>

<style lang="postcss">
	.icon-hamburger {
		transform-origin: center center;
	}

	.icon-hamburger #top,
	.icon-hamburger #mid,
	.icon-hamburger #btm {
		@apply transform-gpu transition;
		transform-origin: center center;
	}

	.icon-hamburger #top {
		transform: translateY(-0.4rem);
	}

	.icon-hamburger #btm {
		transform: translateY(0.4rem);
	}

	.icon-hamburger:hover {
	}

	.icon-hamburger:hover #top {
		transform: translateY(-0.5rem);
	}

	.icon-hamburger:hover #btm {
		transform: translateY(0.5rem);
	}

	.icon-hamburger:active #top {
		transform: translateY(-0.3rem);
	}

	.icon-hamburger:active #btm {
		transform: translateY(0.3rem);
	}

	.is-open .icon-hamburger #top {
		transform: rotate(-45deg) scale(1.25);
		stroke-width: 1.25;
	}

	.is-open .icon-hamburger #mid {
		transform: scaleX(0);
	}

	.is-open .icon-hamburger #btm {
		transform: rotate(45deg) scale(1.25);
		stroke-width: 1.25;
	}

	.is-open .icon-hamburger:active {
		transform: scale(0.95);
	}
</style>
