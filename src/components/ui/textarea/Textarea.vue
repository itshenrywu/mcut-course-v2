<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({
	class: { type: null, default: '' }
})

const model = defineModel({ type: String, default: '' })
</script>

<template>
	<textarea
		v-model="model"
		data-slot="textarea"
		:class="cn('placeholder:text-color-5 selection:bg-color-10 selection:text-color-1 border-color-3 flex w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-color-5 focus-visible:ring-color-5/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive', props.class)"
	/>
</template>
