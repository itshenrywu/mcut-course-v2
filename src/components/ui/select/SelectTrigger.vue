<script setup>
import { SelectTrigger, SelectIcon, useForwardProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { ChevronDown } from '@lucide/vue'
import { cn } from '@/lib/utils'

const props = defineProps({
	size: { type: String, default: 'default' },
	disabled: { type: Boolean, required: false },
	class: { type: null, default: '' }
})

const delegated_props = reactiveOmit(props, 'class', 'size')
const forwarded = useForwardProps(delegated_props)
</script>

<template>
	<SelectTrigger
		data-slot="select-trigger"
		:data-size="size"
		v-bind="forwarded"
		:class="cn('border-color-3 data-[placeholder]:text-color-6 [&_svg:not([class*=\'text-\'])]:text-color-6 focus-visible:border-color-5 focus-visible:ring-color-5/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4', props.class)"
	>
		<slot />
		<SelectIcon as-child>
			<ChevronDown class="size-4 opacity-50" />
		</SelectIcon>
	</SelectTrigger>
</template>
