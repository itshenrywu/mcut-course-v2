<script setup>
import { AccordionItem, useForwardProps } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = defineProps({
	value: { type: String, required: true },
	disabled: { type: Boolean, required: false },
	class: { type: null, default: '' }
})

const delegated_props = reactiveOmit(props, 'class')
const forwarded = useForwardProps(delegated_props)
</script>

<template>
	<AccordionItem
		data-slot="accordion-item"
		v-bind="forwarded"
		:class="cn('border-b last:border-b-0', props.class)"
	>
		<slot />
	</AccordionItem>
</template>
