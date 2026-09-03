<script setup>
import { ComboboxLabel } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
	class: { type: null, default: '' }
})
</script>

<template>
	<ComboboxLabel
		data-slot="combobox-label"
		:class="cn('text-color-6 px-2 py-1.5 text-xs', props.class)"
	>
		<slot />
	</ComboboxLabel>
</template>
