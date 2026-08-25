<script setup>
import { LoaderCircle } from '@lucide/vue'

defineProps({
	text: {
		type: String,
		default: '讀取中…'
	}
})
</script>

<template>
	<div class="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-color-2/40 backdrop-blur-sm print:hidden">
		<LoaderCircle class="size-8 animate-spin text-color-10" />
		<span class="text-sm text-color-7">{{ text }}</span>
	</div>
</template>
