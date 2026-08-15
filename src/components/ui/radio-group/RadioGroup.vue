<script setup>
import { RadioGroupRoot, useForwardPropsEmits } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = defineProps({
	modelValue: { type: null, required: false },
	defaultValue: { type: null, required: false },
	disabled: { type: Boolean, required: false },
	orientation: { type: String, required: false },
	name: { type: String, required: false },
	required: { type: Boolean, required: false },
	asChild: { type: Boolean, required: false },
	as: { type: null, required: false },
	class: { type: null, default: '' }
})

const emits = defineEmits(['update:modelValue'])

const delegated_props = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegated_props, emits)
</script>

<template>
	<RadioGroupRoot
		data-slot="radio-group"
		v-bind="forwarded"
		:class="cn('flex flex-col gap-2', props.class)"
	>
		<slot />
	</RadioGroupRoot>
</template>
