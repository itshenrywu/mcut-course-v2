<script setup>
import { cn } from '@/lib/utils'

defineProps({
	label: {
		type: String,
		default: ''
	},
	ddClass: {
		type: String,
		default: ''
	}
})
</script>

<template>
	<div class="flex flex-col gap-1 p-4 sm:flex-row sm:gap-4">
		<dt class="shrink-0 text-sm font-medium text-color-6 sm:w-28">{{ label }}</dt>
		<dd :class="cn('flex-1 text-sm', ddClass)">
			<slot />
		</dd>
	</div>
</template>
