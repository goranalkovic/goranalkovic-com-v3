<script>
    import ArrowButton from '$lib/ArrowButton.svelte';

    export let title;
    export let contactPrefix = '';
    export let contact;
    export let buttonCaption;
    export let buttonUrl;
</script>

<div>
    <p class="text-18 font-bold">{title}</p>
    <p class="text-14"><span>{contactPrefix}</span><span class="text-rich-purple-500 dark:text-rich-purple-300">{contact}</span> </p>

    <ArrowButton external url={buttonUrl} content={buttonCaption} extraClass="mt-15" />
</div>