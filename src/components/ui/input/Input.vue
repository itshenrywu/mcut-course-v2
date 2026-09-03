<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({
	class: { type: null, default: '' }
})

const model = defineModel({ type: [String, Number], default: '' })
</script>

<template>
	<input
		v-model="model"
		data-slot="input"
		:class="cn('file:text-color-10 placeholder:text-color-5 selection:bg-color-10 selection:text-color-1 border-color-3 flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus:border-color-5 focus:ring-color-5/50 focus:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive', props.class)"
	/>
</template>
