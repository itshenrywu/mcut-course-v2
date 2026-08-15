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
	<div class="bg-color-2/40 fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 backdrop-blur-sm print:hidden">
		<LoaderCircle class="text-color-10 size-8 animate-spin" />
		<span class="text-color-7 text-sm">{{ text }}</span>
	</div>
</template>
