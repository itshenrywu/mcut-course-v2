<script setup>
import { SelectItem, SelectItemIndicator, SelectItemText, useForwardProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { Check } from '@lucide/vue'
import { cn } from '@/lib/utils'

const props = defineProps({
	value: { type: null, required: true },
	disabled: { type: Boolean, required: false },
	textValue: { type: String, required: false },
	description: { type: String, required: false },
	inlineDescription: { type: Boolean, required: false },
	class: { type: null, default: '' }
})

const delegated_props = reactiveOmit(props, 'class', 'description', 'inlineDescription')
const forwarded = useForwardProps(delegated_props)
</script>

<template>
	<SelectItem
		data-slot="select-item"
		v-bind="forwarded"
		:class="cn('focus:bg-color-2 focus:text-color-10 [&_svg:not([class*=\'text-\'])]:text-color-6 relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4', props.class)"
	>
		<span class="absolute left-2 flex size-3.5 items-center justify-center">
			<SelectItemIndicator>
				<Check class="size-4" />
			</SelectItemIndicator>
		</span>
		<span :class="cn('flex min-w-0 flex-1 flex-col gap-x-3 md:flex-row md:items-baseline md:justify-between', inlineDescription && 'flex-row items-baseline justify-between')">
			<SelectItemText>
				<slot />
			</SelectItemText>
			<span v-if="description" class="text-color-6 shrink-0 text-xs">{{ description }}</span>
		</span>
	</SelectItem>
</template>
