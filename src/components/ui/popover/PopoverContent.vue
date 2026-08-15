<script setup>
import { PopoverContent, PopoverPortal, useForwardPropsEmits } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = defineProps({
	class: { type: null, default: '' },
	align: { type: String, default: 'center' },
	side: { type: String, default: 'bottom' },
	sideOffset: { type: Number, default: 4 },
	collisionPadding: { type: null, default: 8 }
})
const emits = defineEmits(['escapeKeyDown', 'pointerDownOutside', 'focusOutside', 'interactOutside', 'openAutoFocus', 'closeAutoFocus'])

const delegated_props = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegated_props, emits)
</script>

<template>
	<PopoverPortal>
		<PopoverContent
			data-slot="popover-content"
			v-bind="forwarded"
			:class="cn('bg-color-1 text-color-10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 max-h-(--reka-popover-content-available-height) overflow-y-auto overscroll-contain origin-(--reka-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden', props.class)"
		>
			<slot />
		</PopoverContent>
	</PopoverPortal>
</template>
