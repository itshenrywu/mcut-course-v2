<script setup>
import { AccordionHeader, AccordionTrigger, useForwardProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { ChevronDown } from '@lucide/vue'
import { cn } from '@/lib/utils'

const props = defineProps({
	class: { type: null, default: '' }
})

const delegated_props = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegated_props)
</script>

<template>
	<AccordionHeader class="flex">
		<AccordionTrigger
			data-slot="accordion-trigger"
			v-bind="forwarded"
			:class="cn('focus-visible:border-color-5 focus-visible:ring-color-5/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-[color,background-color,border-color,box-shadow,opacity] outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180', props.class)"
		>
			<slot />
			<ChevronDown class="text-color-6 pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
		</AccordionTrigger>
	</AccordionHeader>
</template>
