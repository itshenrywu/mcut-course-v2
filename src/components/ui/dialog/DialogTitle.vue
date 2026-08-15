<script setup>
import { DialogTitle } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
	class: { type: null, default: '' }
})
</script>

<template>
	<DialogTitle data-slot="dialog-title" :class="cn('text-lg leading-none font-semibold tracking-tight', props.class)">
		<slot />
	</DialogTitle>
</template>
