<script setup>
import { ComboboxGroup } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
	class: { type: null, default: '' }
})
</script>

<template>
	<ComboboxGroup data-slot="combobox-group" :class="cn('py-1', props.class)">
		<slot />
	</ComboboxGroup>
</template>
