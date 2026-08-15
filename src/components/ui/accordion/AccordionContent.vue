<script setup>
import { AccordionContent } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
	class: { type: null, default: '' }
})
</script>

<template>
	<AccordionContent
		data-slot="accordion-content"
		class="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
	>
		<div :class="cn('pt-0 pb-4', props.class)">
			<slot />
		</div>
	</AccordionContent>
</template>
