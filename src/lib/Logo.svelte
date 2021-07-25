<script>
	export let small = false;
	export let color = false;
</script>

<svg
	class="h-36 w-36 rounded"
	class:small
	width="36"
	height="36"
	viewBox="0 0 36 36"
fill="none"
	xmlns="http://www.w3.org/2000/svg"
>
	<path d="M0 0h36v36H0V0z" class="{color ? 'fill-rich-purple-500 dark:fill-rich-purple-300' : 'fill-current'} transition-colors" />
	<path
		d="M13.378 13.798l6.903-.543c-1.131-5.567-6.46-9.154-12.99-8.64-7.537.593-13.072 6.366-12.345 15.597.702 8.928 6.62 14.022 14.709 13.385 7.26-.571 12.1-5.486 11.504-13.063l-.294-3.734-12.166.957.392 4.974 5.593-.44c.166 2.981-1.752 5.032-5.445 5.322-4.23.333-6.915-2.603-7.342-8.031-.424-5.387 1.91-8.676 6.002-8.998 2.728-.215 4.693.975 5.48 3.214zM27.84 31.778l1.393-6.071 9.741-.767 2.327 5.778 7.33-.576L36.889 2.672l-9.08.715-7.3 28.967 7.33-.577zm2.611-11.38l2.34-10.249.221-.017 3.929 9.756-6.49.51z"
		class="fill-white dark:fill-rich-purple-900 transition-colors"
	/>
</svg>

<style lang="postcss">
	.small {
		@apply w-20 h-20 rounded-sm;
	}
</style>
