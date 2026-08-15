<script setup>
import { cn } from '@/lib/utils'

const props = defineProps({
	class: { type: null, default: '' }
})
</script>

<template>
	<div data-slot="dialog-footer" :class="cn('flex flex-row justify-end gap-2', props.class)">
		<slot />
	</div>
</template>
