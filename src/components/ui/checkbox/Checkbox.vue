<script setup>
import { CheckboxRoot, CheckboxIndicator, useForwardPropsEmits } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { Check, Minus } from '@lucide/vue'
import { cn } from '@/lib/utils'

const props = defineProps({
	modelValue: { type: null, required: false },
	defaultValue: { type: null, required: false },
	disabled: { type: Boolean, required: false },
	value: { type: null, required: false },
	id: { type: String, required: false },
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
	<CheckboxRoot
		data-slot="checkbox"
		v-bind="forwarded"
		:class="cn('focus-visible:ring-color-5/50 group flex w-full cursor-pointer items-center gap-2 rounded-md text-left text-sm outline-hidden focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50', props.class)"
	>
		<span class="border-color-5 bg-color-1 group-data-[state=checked]:bg-color-10 group-data-[state=checked]:border-color-10 group-data-[state=indeterminate]:bg-color-10 group-data-[state=indeterminate]:border-color-10 flex size-4 shrink-0 items-center justify-center rounded-[4px] border">
			<CheckboxIndicator class="text-color-1 flex items-center justify-center">
				<Minus v-if="props.modelValue === 'indeterminate'" class="size-3" />
				<Check v-else class="size-3" />
			</CheckboxIndicator>
		</span>
		<span class="min-w-0 flex-1">
			<slot />
		</span>
	</CheckboxRoot>
</template>
