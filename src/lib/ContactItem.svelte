<script>
    import ArrowButton from '$lib/ArrowButton.svelte';

    export let title;
    export let contactPrefix = '';
    export let contact;
    export let buttonCaption;
    export let buttonUrl;
</script>

<div>
    <p class="text-18 font-bold transition-colors">{title}</p>
    <p class="text-14 transition-colors text-black dark:text-rich-purple-300"><span>{contactPrefix}</span><span class="text-rich-purple-500 dark:text-white">{contact}</span> </p>

    <ArrowButton external url={buttonUrl} content={buttonCaption} extraClass="mt-15" />
</div>