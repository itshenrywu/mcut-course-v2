<script setup>
import { RadioGroupItem, RadioGroupIndicator, useForwardProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = defineProps({
	value: { type: null, required: true },
	disabled: { type: Boolean, required: false },
	id: { type: String, required: false },
	class: { type: null, default: '' }
})

const delegated_props = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegated_props)
</script>

<template>
	<RadioGroupItem
		data-slot="radio-group-item"
		v-bind="forwarded"
		:class="cn('focus-visible:ring-color-5/50 group flex w-full cursor-pointer items-center gap-2 rounded-md text-left text-sm outline-hidden focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50', props.class)"
	>
		<span class="border-color-5 bg-color-1 group-data-[state=checked]:border-color-10 flex size-4 shrink-0 items-center justify-center rounded-full border">
			<RadioGroupIndicator class="bg-color-10 size-2 rounded-full" />
		</span>
		<span class="min-w-0 flex-1">
			<slot />
		</span>
	</RadioGroupItem>
</template>
