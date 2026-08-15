<script setup>
import { SelectRoot, useForwardPropsEmits } from 'reka-ui'

const props = defineProps({
	open: { type: Boolean, required: false },
	defaultOpen: { type: Boolean, required: false },
	defaultValue: { type: null, required: false },
	modelValue: { type: null, required: false },
	dir: { type: String, required: false },
	name: { type: String, required: false },
	autocomplete: { type: String, required: false },
	disabled: { type: Boolean, required: false },
	required: { type: Boolean, required: false }
})
const emits = defineEmits(['update:modelValue', 'update:open'])

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
	<SelectRoot data-slot="select" v-bind="forwarded">
		<slot />
	</SelectRoot>
</template>
