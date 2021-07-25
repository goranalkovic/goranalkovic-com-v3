<script>
    export let small = false;
    export let color = false;
</script>

<svg class="h-36 w-36 rounded" class:small={small} width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h400v400H0V0z" class:letter-color={color} class="fill-current"/><path d="M148.649 153.313l76.698-6.036C212.777 85.419 153.57 45.562 81.006 51.273c-83.74 6.59-145.236 70.734-137.164 173.304 7.808 99.202 73.569 155.796 163.432 148.723 80.678-6.349 134.453-60.952 127.826-145.151l-3.265-41.487-135.178 10.639 4.35 55.265 62.154-4.892c1.837 33.128-19.476 55.908-60.504 59.137-46.998 3.699-76.83-28.92-81.577-89.237-4.71-59.858 21.218-96.403 66.686-99.981 30.311-2.386 52.147 10.837 60.883 35.72zM309.33 353.085l15.486-67.455 108.234-8.518 25.848 64.202 81.444-6.41-130.46-305.202-100.886 7.94-81.11 321.853 81.444-6.41zm29.021-126.438l26.004-113.878 2.449-.193 43.652 108.396-72.105 5.675z" class="fill-white dark:fill-rich-purple-900" /></svg>

<style>
    .small {
        @apply w-20 h-20 rounded-sm;
    }

    .letter-color {
        @apply fill-rich-purple-500 dark:fill-rich-purple-300;
    }
</style>