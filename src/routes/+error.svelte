<script lang="ts">
    import { page } from '$app/stores';
</script>

<div class="flex flex-col flex-grow items-center justify-center gap-4">
    <h2 class="text-2xl">
        <span class="bg-gradient-to-br from-primary-500 to-error-500 bg-clip-text text-transparent box-decoration-clone">{$page.status}</span>
    </h2>
    <h1 class="text-4xl">
        <span class="bg-gradient-to-br from-error-500 to-primary-500 bg-clip-text text-transparent box-decoration-clone">{$page.error!.message}</span>
    </h1>
</div>

<style lang="postcss">
</style>