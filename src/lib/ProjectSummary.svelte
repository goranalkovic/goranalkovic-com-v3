<script>
	import ArrowButton from './ArrowButton.svelte';

	export let title;
	export let subtitle;
	export let timeframe;
	export let button1Props;
	export let button2Props;
	export let extraClass = '';
</script>

<div class={extraClass}>
	{#if title}
		<h3 class="text-40 mb-30">{@html title}</h3>
		<div class="w-160 h-px bg-rich-purple-500 dark:bg-rich-purple-300 mb-15" />
	{:else}
		<div class="w-160 h-px bg-rich-purple-500 dark:bg-rich-purple-300 mb-15" />
	{/if}

	<div class="flex flex-col gap-15 uppercase text-14w mb-30">
		<h4 class="font-bold">{@html subtitle}</h4>
		<span class="opacity-40 hidden">—</span>
		<span class="opacity-80 text-12">{@html timeframe}</span>
	</div>

	<p class="max-w-md flex flex-col gap-15 text-18 leading-relaxed">
		<slot />
	</p>

	{#if button1Props || button2Props}
		<div class="flex gap-30 mt-30">
			{#if button1Props}
				<ArrowButton {...button1Props} />
			{/if}
			{#if button2Props}
				<ArrowButton {...button2Props} />
			{/if}
		</div>
	{/if}
</div>
