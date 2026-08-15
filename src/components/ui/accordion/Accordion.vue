<script setup>
import { AccordionRoot, useForwardPropsEmits } from 'reka-ui'

const props = defineProps({
	collapsible: { type: Boolean, required: false },
	defaultValue: { type: null, required: false },
	modelValue: { type: null, required: false },
	type: { type: String, required: false },
	dir: { type: String, required: false },
	orientation: { type: String, required: false },
	disabled: { type: Boolean, required: false },
	class: { type: null, default: '' }
})
const emits = defineEmits(['update:modelValue'])

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
	<AccordionRoot data-slot="accordion" v-bind="forwarded">
		<slot />
	</AccordionRoot>
</template>
