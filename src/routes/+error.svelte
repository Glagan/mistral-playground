<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="flex grow flex-col items-center justify-center gap-4">
	<h2 class="text-2xl">
		<span class="from-primary-500 to-error-500 bg-gradient-to-br box-decoration-clone bg-clip-text text-transparent">
			{page.status}
		</span>
	</h2>
	<h1 class="text-4xl">
		<span class="from-error-500 to-primary-500 bg-gradient-to-br box-decoration-clone bg-clip-text text-transparent">
			{page.error!.message}
		</span>
	</h1>
</div>
<div></div>
