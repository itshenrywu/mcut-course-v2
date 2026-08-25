<script setup>
import { DialogClose, DialogContent, DialogPortal, useForwardPropsEmits } from 'reka-ui'
import { reactiveOmit } from '@vueuse/core'
import { X } from '@lucide/vue'
import { cn } from '@/lib/utils'
import DialogOverlay from './DialogOverlay.vue'

const props = defineProps({
	forceMount: { type: Boolean, required: false },
	trapFocus: { type: Boolean, required: false },
	disableOutsidePointerEvents: { type: Boolean, required: false },
	showCloseButton: { type: Boolean, default: true },
	class: { type: null, default: '' }
})
const emits = defineEmits(['escapeKeyDown', 'pointerDownOutside', 'focusOutside', 'interactOutside', 'openAutoFocus', 'closeAutoFocus'])

const delegated_props = reactiveOmit(props, 'class', 'showCloseButton')
const forwarded = useForwardPropsEmits(delegated_props, emits)

function onOpenCloseAutoFocus(event) {
	event.preventDefault()
	event.target?.focus?.()
}
</script>

<template>
	<DialogPortal>
		<DialogOverlay />
		<DialogContent
			data-slot="dialog-content"
			v-bind="forwarded"
			@open-auto-focus="onOpenCloseAutoFocus"
			@close-auto-focus="onOpenCloseAutoFocus"
			:class="cn('bg-color-1 text-color-10 outline-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border p-6 shadow-lg duration-200', props.showCloseButton && '[&_[data-slot=dialog-header]]:pr-6', props.class)"
		>
			<slot />
			<DialogClose
				v-if="props.showCloseButton"
				class="ring-offset-color-1 focus:ring-color-5 data-[state=open]:bg-color-2 text-color-6 absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none"
			>
				<X class="size-4" />
				<span class="sr-only">關閉</span>
			</DialogClose>
		</DialogContent>
	</DialogPortal>
</template>
