<script setup>
import { DialogDescription } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
	class: { type: null, default: '' }
})
</script>

<template>
	<DialogDescription data-slot="dialog-description" :class="cn('text-color-6 text-sm', props.class)">
		<slot />
	</DialogDescription>
</template>
