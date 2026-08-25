<script setup>
import { TabsRoot, useForwardPropsEmits } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = defineProps({
	defaultValue: { type: null, required: false },
	orientation: { type: String, required: false },
	dir: { type: String, required: false },
	activationMode: { type: String, required: false },
	modelValue: { type: null, required: false },
	unmountOnHide: { type: Boolean, required: false },
	class: { type: null, default: '' }
})
const emits = defineEmits(['update:modelValue'])

const delegated_props = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegated_props, emits)
</script>

<template>
	<TabsRoot
		v-slot="slot_props"
		data-slot="tabs"
		v-bind="forwarded"
		:class="cn('flex flex-col gap-2', props.class)"
	>
		<slot v-bind="slot_props" />
	</TabsRoot>
</template>
