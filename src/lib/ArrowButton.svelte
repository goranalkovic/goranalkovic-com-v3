<script context="module">
     export const ArrowDirections = {
        RIGHT: 'right',
        LEFT: 'left',
        UP: 'up',
        DOWN: 'down',
        DIAGONAL: 'diagonal'
    };
</script>

<script>
    export let content;
    export let url;
    export let extraClass = '';
    export let arrowDirection = ArrowDirections.RIGHT;
</script>

<a class="flex items-center text-14w uppercase font-medium gap-5 group w-max p-px rounded-sm {extraClass}" href={url}>
    <span class="group-hover:text-rich-purple-500 dark:group-hover:text-rich-purple-300 group-hover:tracking-[0.18em] transition-all">{@html content}</span>
    <svg
    class:-rotate-45={arrowDirection === ArrowDirections.DIAGONAL}
    class:rotate-90={arrowDirection === ArrowDirections.DOWN}
    class:-rotate-90={arrowDirection === ArrowDirections.UP}
    class:rotate-180={arrowDirection === ArrowDirections.LEFT}
    class="transform" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.84 2l5.66 6-5.66 6-.973-1.031 4.005-4.232H1.5V7.263h10.372L7.867 3.018 8.84 2z" class="fill-rich-purple-500 dark:fill-rich-purple-300"
    />
    </svg>
</a>

    