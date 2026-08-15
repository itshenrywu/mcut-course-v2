<script setup>
import { LoaderCircle } from '@lucide/vue'
import { cn } from '@/lib/utils'

defineProps({
	text: {
		type: String,
		default: '讀取中…'
	},
	size: {
		type: String,
		default: 'size-4'
	},
	containerClass: {
		type: String,
		default: ''
	}
})
</script>

<template>
	<div :class="cn('text-color-6 flex items-center justify-center gap-2 text-sm', containerClass)">
		<LoaderCircle class="animate-spin" :class="size" />
		{{ text }}
	</div>
</template>
